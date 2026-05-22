import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import SessionSummary from '../components/SessionSummary';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Award, BrainCircuit, CheckCircle2, Zap, RefreshCw, Sparkles, Trophy } from 'lucide-react';

export default function StudyMode() {
  const { exams, progress: allProgress, updateCardProgress } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam');
  const navigate = useNavigate();

  const currentExam = examId ? exams.find(e => e.id === examId) : exams[0];

  // ─── SNAPSHOT: Freeze the due cards list at session start ───────────────────
  const [sessionCards, setSessionCards] = useState(null); // null = not initialized yet

  const isParcours = !examId;

  useEffect(() => {
    if (sessionCards !== null) return; // Already initialized, don't re-run

    const now = new Date();
    let questionsPool = [];

    if (examId) {
      if (!currentExam || !currentExam.questions) return;
      questionsPool = (currentExam.questions || []).map(q => ({ ...q, examName: currentExam.name }));
    } else {
      const activeExams = exams.filter(e => e.isActive !== false);
      questionsPool = activeExams.flatMap(e =>
        (e.questions || []).map(q => ({ ...q, examName: e.name }))
      );
    }

    // Classification
    // 1. Échauffement (repetitions >= 3)
    const echauffementPool = questionsPool.filter(q => allProgress[q.id]?.repetitions >= 3);
    const echauffement = echauffementPool.sort(() => 0.5 - Math.random()).slice(0, 3)
      .map(q => ({ ...q, stage: 'échauffement', stageLabel: 'Échauffement' }));

    // 2. Consolidation (due & repetitions > 0)
    const consolidationPool = questionsPool.filter(q => {
      const p = allProgress[q.id];
      return p && p.repetitions > 0 && new Date(p.nextReviewDate) <= now;
    });
    const consolidation = consolidationPool.sort(() => 0.5 - Math.random()).slice(0, 5)
      .map(q => ({ ...q, stage: 'consolidation', stageLabel: 'Consolidation' }));

    // 3. Nouveautés (not seen)
    const nouveautesPool = questionsPool.filter(q => !allProgress[q.id]);
    const nouveautes = nouveautesPool.sort(() => 0.5 - Math.random()).slice(0, 5)
      .map(q => ({ ...q, stage: 'nouveautés', stageLabel: 'Nouvelle Notion' }));

    // 4. Défi (easeFactor < 2.2)
    const defiPool = questionsPool.filter(q => {
      const p = allProgress[q.id];
      return p && p.easeFactor < 2.2;
    });
    const fallbackDefiPool = defiPool.length > 0 ? defiPool : questionsPool.filter(q => allProgress[q.id]);
    const defi = fallbackDefiPool.sort(() => 0.5 - Math.random()).slice(0, 2)
      .map(q => ({ ...q, stage: 'défi', stageLabel: 'Défi du Jour' }));

    const compiledCards = [...echauffement, ...consolidation, ...nouveautes, ...defi];
    setSessionCards(compiledCards);
  }, [currentExam, examId, exams, allProgress, sessionCards]);
  // ────────────────────────────────────────────────────────────────────────────

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleBackClick = () => {
    if (sessionHistory.length > 0) {
      setShowExitModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  // Redirect if exam is invalid
  useEffect(() => {
    if (isParcours) {
      if (exams.length === 0) {
        navigate('/dashboard');
      }
      return;
    }
    if (!currentExam && exams.length > 0) {
      navigate(`/study?exam=${exams[0].id}`, { replace: true });
    } else if (exams.length === 0) {
      navigate('/dashboard');
    }
  }, [currentExam, exams, navigate, isParcours]);

  const handleNext = (questionId, quality) => {
    updateCardProgress(questionId, quality); // Updates SRS data in background
    
    // Track history for session summary
    const card = sessionCards[currentIndex];
    setSessionHistory(prev => [
      ...prev,
      {
        questionId,
        quality,
        topic: card?.topic || 'Général'
      }
    ]);

    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionFinished(true);
    }
  };

  const handleForceReview = () => {
    // Pick up to 10 random cards for a forced review session
    const shuffled = [...currentExam.questions].sort(() => 0.5 - Math.random());
    setSessionCards(shuffled.slice(0, 10));
    setSessionFinished(false);
    setCurrentIndex(0);
    setSessionHistory([]);
  };

  // ── Loading state ──
  if ((!isParcours && !currentExam) || sessionCards === null) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <BrainCircuit size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="text-muted">{isParcours ? "Chargement du parcours guidé..." : "Chargement de la session..."}</h2>
        </div>
      </div>
    );
  }

  // ── Empty exam ──
  if (!isParcours && currentExam.questions && currentExam.questions.length === 0) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <BrainCircuit size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Module Vide</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            Ce module ne contient aucune question. Contactez l'administration.
          </p>
          <button className="btn" onClick={() => navigate('/dashboard')}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // ── All cards already reviewed today (SRS) ──
  if (sessionCards.length === 0) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <CheckCircle2 size={40} color="var(--emerald)" />
          </div>
          <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{isParcours ? "Parcours Complété !" : "Tout est à jour !"}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            {isParcours 
              ? "Vous avez terminé tout votre parcours guidé d'aujourd'hui. Excellent travail pour maintenir votre régularité !"
              : `Vous avez révisé toutes les cartes prévues pour aujourd'hui dans ${currentExam.name}.`
            }
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {!isParcours && (
              <button className="btn-outline" onClick={handleForceReview} style={{ width: '100%', borderColor: 'var(--violet)', color: 'var(--violet)' }}>
                Forcer une révision (10 cartes)
              </button>
            )}
            <button className="btn" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session finished (Show the premium SessionSummary) ──
  if (sessionFinished) {
    return (
      <SessionSummary 
        sessionHistory={sessionHistory}
        examName={isParcours ? "Session de révision du jour" : currentExam.name}
        onForceReview={isParcours ? null : handleForceReview}
        onBackToDashboard={() => navigate('/dashboard')}
      />
    );
  }

  const progress = (currentIndex / sessionCards.length) * 100;
  const currentCard = sessionCards[currentIndex];

  return (
    <div className="animate-fade-in" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0.5rem 1rem',
    }}>
      {/* ── Unified Minimalist Header (Single Line for Focus) ── */}
      <div className="study-session-header">
        {/* Left: Back Button & Title & Stage */}
        <div className="study-header-left">
          <button 
            className="study-back-btn"
            onClick={handleBackClick} 
          >
            <ArrowLeft size={18} />
          </button>
          
          <span className="study-session-title">
            {isParcours ? "Révision du jour" : currentExam.name}
          </span>

          {currentCard?.stageLabel && (
            <div style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '99px',
              background: 
                currentCard.stage === 'échauffement' ? 'var(--violet-soft)' :
                currentCard.stage === 'consolidation' ? 'var(--warning-soft)' :
                currentCard.stage === 'nouveautés' ? 'var(--emerald-soft)' :
                'rgba(239, 68, 68, 0.08)',
              color: 
                currentCard.stage === 'échauffement' ? 'var(--violet)' :
                currentCard.stage === 'consolidation' ? 'var(--warning)' :
                currentCard.stage === 'nouveautés' ? 'var(--emerald)' :
                'var(--danger)',
              border: '1px solid currentColor',
              fontSize: '0.68rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap'
            }}>
              {currentCard.stage === 'échauffement' && <Zap size={11} style={{ strokeWidth: 3 }} />}
              {currentCard.stage === 'consolidation' && <RefreshCw size={11} style={{ strokeWidth: 3 }} />}
              {currentCard.stage === 'nouveautés' && <Sparkles size={11} style={{ strokeWidth: 3 }} />}
              {currentCard.stage === 'défi' && <Trophy size={11} style={{ strokeWidth: 3 }} />}
              {currentCard.stageLabel}
            </div>
          )}
        </div>

        {/* Center: Progress Bar */}
        <div className="study-header-center">
          <div className="study-progress-track">
            <div 
              className="study-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Counter */}
        <div className="study-header-right">
          <span>{currentIndex + 1}</span>
          <span style={{ color: 'var(--text-subtle)', fontWeight: 500 }}>/</span>
          <span style={{ color: 'var(--text-subtle)' }}>{sessionCards.length}</span>
        </div>
      </div>

      {/* ── Flashcard ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <Flashcard
          key={currentCard.id}
          card={currentCard}
          onNext={handleNext}
        />
      </div>

      {/* ── Exit Confirmation Modal ── */}
      {showExitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'var(--violet-soft)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              color: 'var(--violet)'
            }}>
              <BrainCircuit size={28} />
            </div>
            
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Quitter la session ?
            </h3>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '2rem' }}>
              Votre progression sur les <strong>{sessionHistory.length}</strong> fiche{sessionHistory.length !== 1 ? 's' : ''} révisée{sessionHistory.length !== 1 ? 's' : ''} a bien été enregistrée.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <button 
                className="btn" 
                onClick={() => {
                  setShowExitModal(false);
                  setSessionFinished(true);
                }}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)'
                }}
              >
                Voir le bilan de session
              </button>
              
              <button 
                className="btn-outline" 
                onClick={() => navigate('/dashboard', { state: { partialSave: true, count: sessionHistory.length } })}
                style={{ width: '100%', padding: '0.85rem', fontWeight: 800, borderColor: 'var(--border)', color: 'var(--text-main)' }}
              >
                Quitter directement
              </button>
              
              <button 
                onClick={() => setShowExitModal(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-subtle)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  marginTop: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                Continuer à réviser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
