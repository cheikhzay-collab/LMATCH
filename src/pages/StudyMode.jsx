import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import { useAuth } from '../context/AuthContext';
import { Timer, ArrowLeft, Award, BrainCircuit, CheckCircle2 } from 'lucide-react';

export default function StudyMode() {
  const { exams, progress: allProgress, updateCardProgress } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam');
  const navigate = useNavigate();

  const currentExam = examId ? exams.find(e => e.id === examId) : exams[0];

  // ─── SNAPSHOT: Freeze the due cards list at session start ───────────────────
  // This is the KEY FIX: we never let this list change mid-session.
  // useMemo was recalculating on every `updateCardProgress` call, causing crashes.
  const [sessionCards, setSessionCards] = useState(null); // null = not initialized yet

  useEffect(() => {
    if (!currentExam || !currentExam.questions) return;
    if (sessionCards !== null) return; // Already initialized, don't re-run

    const now = new Date();
    const dueCards = currentExam.questions.filter(q => {
      const cardProgress = allProgress[q.id];
      if (!cardProgress) return true; // New card, never seen
      return new Date(cardProgress.nextReviewDate) <= now; // Due or overdue
    });

    setSessionCards(dueCards);
  }, [currentExam]); // ONLY depends on currentExam, not allProgress
  // ────────────────────────────────────────────────────────────────────────────

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Timer resets on each new card
  useEffect(() => {
    if (!sessionCards || sessionCards.length === 0 || sessionFinished) return;
    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, sessionFinished, sessionCards]);

  // Redirect if exam is invalid
  useEffect(() => {
    if (!currentExam && exams.length > 0) {
      navigate(`/study?exam=${exams[0].id}`, { replace: true });
    } else if (exams.length === 0) {
      navigate('/dashboard');
    }
  }, [currentExam, exams, navigate]);

  const handleNext = (questionId, quality) => {
    updateCardProgress(questionId, quality); // Updates SRS data in background
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
  };

  // ── Loading state ──
  if (!currentExam || sessionCards === null) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <BrainCircuit size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="text-muted">Chargement de la session...</h2>
        </div>
      </div>
    );
  }

  // ── Empty exam ──
  if (currentExam.questions && currentExam.questions.length === 0) {
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
          <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tout est à jour !</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Vous avez révisé toutes les cartes prévues pour aujourd'hui dans <strong>{currentExam.name}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button className="btn-outline" onClick={handleForceReview} style={{ width: '100%', borderColor: 'var(--violet)', color: 'var(--violet)' }}>
              Forcer une révision (10 cartes)
            </button>
            <button className="btn" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
              Voir mes autres cours
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session finished ──
  if (sessionFinished) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px' }}>
          <BrainCircuit size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Session Terminée !</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            L'algorithme <strong>SuperMemo-2</strong> a mis à jour vos prochaines révisions pour <strong>{currentExam.name}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button className="btn-outline" onClick={handleForceReview} style={{ width: '100%', borderColor: 'var(--violet)', color: 'var(--violet)' }}>
              Continuer à réviser
            </button>
            <button className="btn" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
              Retour au Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (currentIndex / sessionCards.length) * 100;
  const currentCard = sessionCards[currentIndex];

  return (
    <div className="animate-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0.5rem 1rem',
    }}>
      {/* ── Header ── */}
      <div className="study-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '1rem', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Module</h4>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{currentExam.name}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="timer-pill" style={{
            color: timeLeft <= 10 ? 'var(--danger)' : 'var(--primary)',
            borderColor: timeLeft <= 10 ? 'var(--danger)' : 'var(--primary)',
            background: timeLeft <= 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.05)',
            padding: '0.4rem 0.8rem', fontSize: '0.9rem'
          }}>
            <Timer size={18} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>

          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '1.5rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Award size={16} color="var(--warning)" />
            <span style={{ fontSize: '0.85rem' }}>{currentIndex + 1} / {sessionCards.length}</span>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="xp-bar-container" style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <div className="xp-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* ── Flashcard ── */}
      {/* KEY FIX: key={currentCard.id} forces React to unmount/remount Flashcard on each new card,
          which resets its internal state (selectedOption, showAstuce) automatically */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <Flashcard
          key={currentCard.id}
          card={currentCard}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
