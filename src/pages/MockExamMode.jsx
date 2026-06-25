import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Timer, ArrowLeft, CheckCircle2, Zap, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

import { renderWithMath } from '../utils/mathRenderer';
import CircularTimer from '../components/CircularTimer';
import MockExamResults from '../components/MockExamResults';

function renderOptionText(text) {
  return renderWithMath(text);
}

export default function MockExamMode() {
  const { exams, saveMockExamResult, schoolBranding, isExamLocked, updateCardProgress, user, loading, loadExamQuestions } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam');
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || (user ? '/dashboard' : '/schools');

  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    if (examId) {
      const exam = exams.find(e => e.id === examId);
      if (exam && (!exam.questions || exam.questions.length === 0)) {
        setLoadingQuestions(true);
        loadExamQuestions(examId)
          .catch(err => console.error('[MockExamMode] Failed to load exam questions:', err))
          .finally(() => setLoadingQuestions(false));
      }
    }
  }, [examId, exams, loadExamQuestions]);

  const currentExam = useMemo(() => examId ? exams.find(e => e.id === examId) : exams[0], [exams, examId]);
  const questions = useMemo(() => currentExam?.questions ?? [], [currentExam]);
  const TOTAL_TIME = 120 * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_TIME);
  const [isFinished, setIsFinished]     = useState(false);
  const [answers, setAnswers]           = useState({});
  const [selectedImageZoom, setSelectedImageZoom] = useState(null);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [showMobileContext, setShowMobileContext] = useState(false);

  const hasSavedResult = useRef(false);

  useEffect(() => {
    if (!questions.length || isFinished) return;
    const t = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(t); setIsFinished(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [isFinished, questions]);

  useEffect(() => {
    if (isFinished && !hasSavedResult.current && currentExam) {
      hasSavedResult.current = true;

      const brand = schoolBranding[currentExam.school] || { scoring: { correct: 1, wrong: -0.25, empty: 0 } };
      const rules = brand.scoring || { correct: 1, wrong: -0.25, empty: 0 };

      let pts = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      questions.forEach(q => {
        const ans = answers[q.id];
        const isCorrect = ans === q.correct_answer;
        if (isCorrect) {
          pts += rules.correct;
          correctCount++;
        } else if (!ans) {
          pts += rules.empty;
          emptyCount++;
        } else {
          pts += rules.wrong;
          wrongCount++;
        }
        
        updateCardProgress(q.id, isCorrect ? 4 : 0);
      });

      const maxPossible = questions.length * rules.correct;
      const pct = maxPossible > 0 ? Math.max(0, Math.round((pts / maxPossible) * 100)) : 0;

      saveMockExamResult({
        examId: currentExam.id,
        examName: currentExam.name,
        school: currentExam.school,
        score: pts,
        maxScore: questions.length,
        correctCount,
        wrongCount,
        emptyCount,
        pct,
        mode: 'online'
      });
    }
  }, [isFinished, answers, currentExam, questions, saveMockExamResult, schoolBranding, updateCardProgress]);

  const handleSelect = useCallback((optId) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optId }));
  }, [currentIndex, questions]);

  const goNext = useCallback(() => { if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1); }, [questions.length, currentIndex]);
  const goPrev = useCallback(() => { if (currentIndex > 0) setCurrentIndex(i => i - 1); }, [currentIndex]);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const progress = useMemo(() => questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0, [currentIndex, questions.length]);
  const answered = useMemo(() => currentQuestion ? answers[currentQuestion.id] : undefined, [currentQuestion, answers]);
  const isCritical = useMemo(() => timeLeft <= 300, [timeLeft]);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const onReturn = useCallback(() => {
    if (Object.keys(answers).length > 0 && !isFinished) {
      const saveAndQuit = window.confirm("Voulez-vous terminer cet examen et enregistrer vos résultats ?\n\n- [OK] pour enregistrer et voir vos résultats.\n- [Annuler] pour quitter sans enregistrer.");
      if (saveAndQuit) {
        setIsFinished(true);
        return;
      }
    }
    navigate(fromPath);
  }, [navigate, fromPath, answers, isFinished]);

  if (loading || loadingQuestions || (currentExam && !questions.length)) {
    return (
      <div className="focus-layout" style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #18181B 0%, #09090B 100%)'
      }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '1.2rem' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(113, 109, 242, 0.15)',
            borderTop: '3px solid var(--violet)',
            borderRight: '3px solid var(--emerald)',
            animation: 'spinApp 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
          }} />
        </div>
        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
          Chargement de l'examen...
        </h3>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spinApp {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!currentExam) {
    return (
      <div className="focus-layout flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="glass-panel text-center" style={{ padding: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Aucun examen sélectionné</h2>
          <button className="btn" onClick={onReturn}>
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
      </div>
    );
  }

  if (currentExam && isExamLocked(currentExam)) {
    return (
      <div className="focus-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', padding: '3rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.15)' }}>
            <Zap size={36} fill="currentColor" />
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Concours Premium Verrouillé</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            L'examen <strong>{currentExam.name}</strong> fait partie de l'offre Premium. Abonnez-vous pour débloquer l'accès à tous les concours blancs et tester vos connaissances en conditions réelles.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/subscription')} className="btn" style={{ background: 'linear-gradient(135deg, var(--violet), #818cf8)' }}>
              ✦ Voir les offres
            </button>
            <button onClick={onReturn} className="btn-outline">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="focus-layout">
        <MockExamResults
          questions={questions}
          answers={answers}
          exam={currentExam}
          onReturn={onReturn}
          schoolBranding={schoolBranding}
        />
      </div>
    );
  }

  return (
    <div className="focus-layout" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div className="focus-header" style={{ padding: '0.6rem clamp(0.75rem, 3vw, 1.5rem)', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={onReturn}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> <span className="hide-xs">Quitter</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'clamp(120px, 30vw, 300px)' }}>{currentExam.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }} className="hide-xs">{currentExam.year} · Concours Blanc</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`timer-pill ${isCritical ? 'critical' : ''}`} style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}>
            <Timer size={14} />
            {Math.floor(timeLeft / 3600) > 0
              ? `${Math.floor(timeLeft/3600)}:${Math.floor((timeLeft%3600)/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`
              : `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`}
          </div>
          <button
            onClick={() => setIsNavDrawerOpen(true)}
            className="mobile-only-toggle btn-ghost"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '0.4rem', 
              borderRadius: '8px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            title="Grille de navigation"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="progress-track" style={{ borderRadius: 0, height: '4px', flexShrink: 0 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Mobile Stats Sub-header ── */}
      <div className="mobile-only-stats-bar" style={{
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 1rem',
        background: 'var(--bg-glass)',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontWeight: 700,
        flexShrink: 0
      }}>
        <div>Question {currentIndex + 1}/{questions.length}</div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block' }} />
            {answeredCount} Fait
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
            {questions.length - answeredCount} Reste
          </span>
        </div>
      </div>

      {/* ── Bento Body ── */}
      <div className="focus-body" style={{ flex: 1, padding: '0.8rem 1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'stretch', maxWidth: '100%', margin: '0' }}>
        <div className={`mock-exam-grid ${currentQuestion.context ? 'has-context' : ''}`} style={{ gap: '1rem', width: '100%', height: '100%', alignItems: 'stretch' }}>

          {/* Context Panel (Left Half if exists) */}
          {currentQuestion.context && (
            <div className="glass-card animate-fade-in desktop-context-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.95rem', letterSpacing: '0.08em', flexShrink: 0 }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '0.45rem', display: 'flex' }}>
                  <Zap size={16} />
                </div>
                Énoncé / Contexte
              </div>
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                fontSize: '1.15rem', 
                lineHeight: '1.65', 
                color: 'var(--text-main)', 
                paddingRight: '4px',
                fontFamily: "'Computer Modern Serif', 'STIX Two Text', Georgia, serif"
              }}>
                {renderWithMath(currentQuestion.context)}
              </div>
            </div>
          )}

          {/* Question Card (Middle/Right or Full Width) */}
          <div className="glass-card animate-fade-in question-card-main" key={currentIndex} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Topic & Question Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexShrink: 0 }}>
              <span style={{ 
                fontSize: '0.95rem', 
                color: 'var(--violet)', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                background: 'var(--violet-soft)',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                Question {currentIndex + 1} sur {questions.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {currentQuestion.context && (
                  <button
                    onClick={() => setShowMobileContext(true)}
                    className="mobile-only-toggle"
                    style={{
                      border: '1px solid var(--violet)',
                      background: 'var(--violet-soft)',
                      color: 'var(--violet)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Voir l'énoncé
                  </button>
                )}
                {currentQuestion.topic && (
                  <span className="topic-badge" style={{ margin: 0, padding: '0.35rem 0.8rem', fontSize: '0.9rem', borderRadius: '6px', fontWeight: 600 }}>
                    {currentQuestion.topic}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Question and Options Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '4px', marginBottom: '0.5rem' }}>
              {(() => {
                const pos = currentQuestion.imagePosition || 'below_statement';
                const sizeH = {
                  small: '90px',
                  medium: '150px',
                  large: '220px',
                  xlarge: '320px'
                }[currentQuestion.imageSize || 'medium'];

                const imageEl = currentQuestion.image && (
                  <div style={{ 
                    borderRadius: '10px', 
                    overflow: 'hidden', 
                    border: {
                      transparent: 'none',
                      white: '1px solid #e2e8f0',
                      dark: '1px solid rgba(255,255,255,0.08)'
                    }[currentQuestion.imageBg || 'transparent'],
                    background: {
                      transparent: 'transparent',
                      white: '#ffffff',
                      dark: '#121214'
                    }[currentQuestion.imageBg || 'transparent'],
                    padding: currentQuestion.imageBg === 'transparent' ? 0 : '0.4rem', 
                    maxWidth: '100%', 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                    height: sizeH,
                    width: pos === 'side_by_side' ? '40%' : '100%',
                    marginBottom: pos === 'side_by_side' ? 0 : '1.25rem',
                    marginTop: pos === 'below_statement' ? '1.25rem' : 0
                  }}>
                    <img 
                      src={currentQuestion.image} 
                      alt="Question diagram" 
                      style={{ 
                        height: '100%', 
                        maxWidth: '100%', 
                        borderRadius: '6px', 
                        objectFit: 'contain',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }} 
                      onClick={() => setSelectedImageZoom(currentQuestion.image)}
                      title="Cliquez pour agrandir"
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    />
                  </div>
                );

                const statementEl = (
                  <div className="question-box" style={{ 
                    fontSize: '1.35rem', 
                    fontWeight: 500, 
                    lineHeight: '1.65', 
                    color: 'var(--text-main)',
                    letterSpacing: '-0.01em',
                    flex: 1,
                    fontFamily: "'Computer Modern Serif', 'STIX Two Text', Georgia, serif"
                  }}>
                    {renderWithMath(currentQuestion.question)}
                  </div>
                );

                if (pos === 'side_by_side' && currentQuestion.image) {
                  return (
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                      {statementEl}
                      {imageEl}
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: '1.5rem' }}>
                    {pos === 'above_statement' && imageEl}
                    {statementEl}
                    {pos === 'below_statement' && imageEl}
                  </div>
                );
              })()}

              <div className="options-grid" style={{ gap: '0.5rem' }}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = answered === opt.id;
                  return (
                    <button
                      key={opt.id}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(opt.id)}
                    >
                      <span className="option-letter">{opt.id}</span>
                      <span style={{ flex: 1 }}>{renderOptionText(opt.text)}</span>
                      {isSelected && <CheckCircle2 size={18} color="var(--violet)" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pinned Nav Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid var(--border)', 
              paddingTop: '0.75rem', 
              paddingBottom: 'env(safe-area-inset-bottom, 0px)', 
              flexShrink: 0 
            }}>
              <button 
                className="btn-outline" 
                disabled={currentIndex === 0} 
                onClick={goPrev}
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  fontSize: '0.85rem',
                  opacity: currentIndex === 0 ? 0.45 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  color: currentIndex === 0 ? 'var(--text-subtle)' : 'var(--text-main)',
                  background: currentIndex === 0 ? 'var(--bg-glass)' : 'transparent',
                }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              {currentIndex === questions.length - 1 ? (
                <button className="btn-emerald" onClick={() => setIsFinished(true)} style={{ padding: '0.5rem 1.75rem', fontSize: '0.85rem' }}>
                  Terminer l'examen
                </button>
              ) : (
                <button className="btn" onClick={goNext} style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                  Suivant <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Right — Info & Navigation Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            
            {/* Circular Timer & Stress Monitor */}
            <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', flexShrink: 0 }}>
              <CircularTimer timeLeft={timeLeft} totalTime={TOTAL_TIME} />
            </div>

            {/* Consolidated Progression & Question Grid Navigator */}
            <div className="glass-panel" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Progress stats in 4-column compact row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginBottom: '0.75rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--violet)', margin: 0, lineHeight: 1.1 }}>{currentIndex + 1}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Actuel</p>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--emerald)', margin: 0, lineHeight: 1.1 }}>{answeredCount}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Fait</p>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--warning)', margin: 0, lineHeight: 1.1 }}>{questions.length - answeredCount}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Reste</p>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{questions.length}</p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Total</p>
                </div>
              </div>

              {/* Scrollable grid navigator */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', marginTop: '0.25rem', flexShrink: 0 }}>
                  Grille de Navigation
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem' }}>
                  {questions.map((q, i) => {
                    const isCurrent = i === currentIndex;
                    const isAnswered = !!answers[q.id];

                    let btnStyle = {
                      padding: '0.4rem 0',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                      display: 'block',
                      width: '100%',
                    };

                    if (isCurrent) {
                      btnStyle = {
                        ...btnStyle,
                        border: '2px solid var(--violet)',
                        background: 'rgba(99, 102, 241, 0.16)',
                        color: 'var(--violet)',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.35)',
                      };
                    } else if (isAnswered) {
                      btnStyle = {
                        ...btnStyle,
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--emerald)',
                      };
                    } else {
                      btnStyle = {
                        ...btnStyle,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-glass)',
                        color: 'var(--text-muted)',
                      };
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        style={btnStyle}
                        className="nav-grid-btn"
                        onMouseEnter={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = isAnswered 
                              ? '0 3px 8px rgba(16, 185, 129, 0.25)' 
                              : '0 3px 8px rgba(255, 255, 255, 0.05)';
                            if (!isAnswered) {
                              e.currentTarget.style.borderColor = 'var(--text-subtle)';
                              e.currentTarget.style.color = 'var(--text-main)';
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            if (isAnswered) {
                              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                              e.currentTarget.style.color = 'var(--emerald)';
                            } else {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }
                          }
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Grid Drawer ── */}
      {isNavDrawerOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            animation: 'fade-in-overlay 0.2s ease-out'
          }}
          onClick={() => setIsNavDrawerOpen(false)}
        />
      )}
      
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-base)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        zIndex: 1001,
        transform: isNavDrawerOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
        maxHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div 
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--border)',
            borderRadius: '99px',
            margin: '0 auto 1.25rem',
            cursor: 'pointer'
          }} 
          onClick={() => setIsNavDrawerOpen(false)} 
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Grille de Navigation</h3>
          <button 
            className="btn-ghost" 
            onClick={() => setIsNavDrawerOpen(false)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}
          >
            Fermer
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '2px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--violet)', margin: 0, lineHeight: 1.1 }}>{currentIndex + 1}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Actuel</p>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--emerald)', margin: 0, lineHeight: 1.1 }}>{answeredCount}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Fait</p>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--warning)', margin: 0, lineHeight: 1.1 }}>{questions.length - answeredCount}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Reste</p>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '6px', padding: '0.4rem 0.25rem', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{questions.length}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', margin: 0, fontWeight: 700 }}>Total</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {questions.map((q, i) => {
                const isCurrent = i === currentIndex;
                const isAnswered = !!answers[q.id];
                
                let btnStyle = {
                  padding: '0.6rem 0',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  display: 'block',
                  width: '100%',
                };
                
                if (isCurrent) {
                  btnStyle = {
                    ...btnStyle,
                    border: '2px solid var(--violet)',
                    background: 'rgba(99, 102, 241, 0.16)',
                    color: 'var(--violet)',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.35)',
                  };
                } else if (isAnswered) {
                  btnStyle = {
                    ...btnStyle,
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--emerald)',
                  };
                } else {
                  btnStyle = {
                    ...btnStyle,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-glass)',
                    color: 'var(--text-muted)',
                  };
                }
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsNavDrawerOpen(false);
                    }}
                    style={btnStyle}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <button 
            className="btn-emerald" 
            onClick={() => {
              setIsFinished(true);
              setIsNavDrawerOpen(false);
            }} 
            style={{ 
              marginTop: '0.5rem',
              marginBottom: '1rem',
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '0.9rem',
              fontWeight: 800,
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Terminer l'examen
          </button>
        </div>
      </div>

      {/* ── Mobile Context Drawer/Modal ── */}
      {showMobileContext && currentQuestion.context && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1010,
              animation: 'fade-in-overlay 0.2s ease-out'
            }}
            onClick={() => setShowMobileContext(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--bg-base)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderTop: '1px solid var(--border)',
            padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
            zIndex: 1011,
            boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div 
              style={{
                width: '40px',
                height: '4px',
                background: 'var(--border)',
                borderRadius: '99px',
                margin: '0 auto 1.25rem',
                cursor: 'pointer'
              }} 
              onClick={() => setShowMobileContext(false)} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Énoncé / Contexte</h3>
              <button 
                className="btn-ghost" 
                onClick={() => setShowMobileContext(false)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}
              >
                Fermer
              </button>
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              fontSize: '1.15rem', 
              lineHeight: '1.65', 
              color: 'var(--text-main)', 
              paddingRight: '4px',
              fontFamily: "'Computer Modern Serif', 'STIX Two Text', Georgia, serif"
            }}>
              {renderWithMath(currentQuestion.context)}
            </div>
          </div>
        </>
      )}

      {/* ── Image Lightbox Zoom Overlay ── */}
      {selectedImageZoom && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.85)', 
            backdropFilter: 'blur(10px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out'
          }}
          onClick={() => setSelectedImageZoom(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImageZoom} 
              alt="Zoomed diagram" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '85vh', 
                borderRadius: '12px', 
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'block'
              }} 
            />
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem', fontWeight: 600 }}>
              Cliquez n'importe où pour fermer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
