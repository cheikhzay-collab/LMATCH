import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Timer, ArrowLeft, CheckCircle2, XCircle, Lightbulb, Trophy, Flame, Zap, ChevronLeft, ChevronRight, TrendingUp, Lock, LayoutGrid } from 'lucide-react';

import { renderWithMath } from '../utils/mathRenderer';
import DiagnosticReport from '../components/DiagnosticReport';

/* ─── Math renderer (from shared utility) ───────────────────────── */
function renderOptionText(text) {
  return renderWithMath(text);
}

/* ─── Circular Timer ────────────────────────────────────────────── */
function CircularTimer({ timeLeft, totalTime }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, timeLeft / totalTime));
  const offset = circ * (1 - pct);
  const critical = timeLeft <= 300;
  const color = critical ? 'var(--danger)' : timeLeft <= 1200 ? 'var(--warning)' : 'var(--emerald)';
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const label = h > 0
    ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    : `${m}:${s.toString().padStart(2,'0')}`;

  // Stress Monitor Parameters
  const heartbeatSpeed = critical ? 0.5 : timeLeft <= 1200 ? 1.2 : 2.5;

  const getProctorMessage = () => {
    if (timeLeft === 0) return "🔴 Temps écoulé ! L'examen est terminé.";
    if (critical) return "⚠️ TEMPS CRITIQUE ! Finalisez vos réponses et assurez-vous d'avoir tout complété.";
    if (timeLeft <= 600) return "⏳ Moins de 10 minutes restantes ! Gardez votre calme et ciblez les questions rapides.";
    if (timeLeft <= 1800) return "⚡ Plus que 30 minutes. Le rythme est bon, continuez ainsi !";
    if (timeLeft <= 3600) return "🎯 Une heure écoulée. Restez concentré et gérez judicieusement votre temps.";
    return "💡 L'examen vient de commencer. Lisez attentivement et ne bloquez pas sur une seule question.";
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '1.25rem',
      padding: '0.25rem 0'
    }}>
      <style>{`
        @keyframes candle-flicker {
          0% { transform: scale(1) rotate(-1.5deg); opacity: 0.9; }
          100% { transform: scale(1.06) rotate(1.5deg); opacity: 1; }
        }
        @keyframes timer-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 2px var(--danger)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 10px var(--danger)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 2px var(--danger)); }
        }
        @keyframes ekg-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes pulse-critical {
          0% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); border-color: var(--danger); }
          100% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Main Circular Ring */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110" style={{ position: 'absolute', inset: 0 }}>
          {/* Track */}
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--bg-hover)" strokeWidth="7" />
          {/* Fill */}
          <circle
            cx="55" cy="55" r={r} fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 5px ${color}55)` }}
          />
          {/* Time label */}
          <text
            x="55" y="58"
            textAnchor="middle" dominantBaseline="middle"
            fill={color}
            fontSize={critical ? "16" : "14"}
            fontWeight="900"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            style={{ animation: critical ? 'timer-pulse 0.8s ease-in-out infinite' : 'none' }}
          >
            {label}
          </text>
        </svg>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        
        {/* EKG stress heartbeat monitor */}
        <div style={{ 
          background: 'var(--bg-hover)', 
          borderRadius: '10px', 
          padding: '0.5rem 0.75rem', 
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          animation: critical ? 'pulse-critical 1.5s ease-in-out infinite' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Niveau de Stress
            </span>
            <span style={{ 
              fontSize: '0.68rem', 
              color, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ 
                width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block',
                animation: critical ? 'timer-pulse 0.6s infinite' : 'none'
              }} />
              {critical ? 'CRITIQUE' : timeLeft <= 1200 ? 'ÉLEVÉ' : 'CALME'}
            </span>
          </div>

          <svg width="100%" height="24" viewBox="0 0 100 24" style={{ display: 'block', overflow: 'hidden' }}>
            <path 
              d="M 0 12 L 20 12 L 25 2 L 30 22 L 35 9 L 40 14 L 45 12 L 100 12" 
              fill="none" 
              stroke={color} 
              strokeWidth="2" 
              strokeDasharray="20 80" 
              strokeDashoffset="100" 
              style={{ animation: `ekg-flow ${heartbeatSpeed}s linear infinite` }} 
            />
          </svg>
        </div>

        {/* Dynamic Melting Proctor Candle & Motivational Ticker */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '0.75rem', alignItems: 'center' }}>
          {/* Animated Wax Candle */}
          <div style={{ background: 'var(--bg-hover)', borderRadius: '8px', padding: '0.35rem', border: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="48" viewBox="0 0 30 48" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="60%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              {/* Wax candle body (shrinks downwards) */}
              <rect x="11" y={18 + (1 - pct) * 16} width="8" height={22 - (1 - pct) * 16} fill="var(--text-subtle)" opacity="0.3" rx="1.5" />
              <rect x="12" y={18 + (1 - pct) * 16} width="6" height={22 - (1 - pct) * 16} fill="var(--text-muted)" opacity="0.5" rx="1" />
              
              {/* Wick */}
              <line x1="15" y1={14 + (1 - pct) * 16} x2="15" y2={18 + (1 - pct) * 16} stroke="var(--text-main)" strokeWidth="1.5" />
              
              {/* Flicker Flame */}
              {timeLeft > 0 && (
                <path 
                  d="M15,4 C17.5,9 15,14 15,14 C15,14 12.5,9 15,4 Z" 
                  fill="url(#flameGrad)" 
                  style={{ 
                    transformOrigin: `15px ${14 + (1 - pct) * 16}px`, 
                    animation: 'candle-flicker 0.12s ease-in-out infinite alternate',
                    filter: 'drop-shadow(0 0 3px #F59E0B)'
                  }} 
                />
              )}
            </svg>
          </div>

          {/* Scrolling Proctor Ticker */}
          <div style={{ 
            background: 'var(--bg-hover)', 
            borderRadius: '8px', 
            padding: '0.5rem 0.75rem', 
            border: '1px solid var(--border)',
            height: 52,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>
              Proctor Conseils
            </p>
            <div style={{ overflow: 'hidden', position: 'relative', width: '100%', height: '18px', marginTop: '1px' }}>
              <div style={{
                position: 'absolute',
                whiteSpace: 'nowrap',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                animation: 'ticker-scroll 12s linear infinite',
                paddingLeft: '100%'
              }}>
                {getProctorMessage()}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Results Screen ────────────────────────────────────────────── */
function ResultsScreen({ questions, answers, exam, onReturn }) {
  const { schoolBranding } = useAuth();
  const [tab, setTab] = React.useState('correction');

  // Get school scoring rules
  const brand = schoolBranding[exam.school] || { scoring: { correct: 1, wrong: -0.25, empty: 0 } };
  const rules = brand.scoring || { correct: 1, wrong: -0.25, empty: 0 };

  let score = 0;
  questions.forEach(q => {
    const ans = answers[q.id];
    if (ans === q.correct_answer) score += rules.correct;
    else if (!ans) score += rules.empty;
    else score += rules.wrong;
  });

  const maxPossible = questions.length * rules.correct;
  const pct = Math.max(0, Math.round((score / maxPossible) * 100));

  // Build corrected array with topic for DiagnosticReport
  const corrected = questions.map((q, idx) => ({
    q: idx + 1,
    question: q.question,
    correct: q.correct_answer,
    detected: answers[q.id] || null,
    result: answers[q.id] === q.correct_answer ? 'correct' : 'wrong',
    topic: q.topic || 'Général',
  }));

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem) clamp(0.875rem, 4vw, 1.5rem) 4rem' }}>
      {/* Trophy card */}
      <div className="glass-panel text-center" style={{ padding: '2.5rem 2rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${pct >= 50 ? 'var(--emerald)' : 'var(--danger)'}`,
        }}>
          <Trophy size={32} color={pct >= 50 ? 'var(--emerald)' : 'var(--danger)'} />
        </div>
        <h1 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Rapport de Performance
        </h1>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0.5rem 0', lineHeight: 1 }}>
          {score}<span style={{ fontSize: '1.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{questions.length}</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: pct >= 50 ? 'var(--emerald-soft)' : 'var(--danger-soft)',
          color: pct >= 50 ? 'var(--emerald)' : 'var(--danger)',
          padding: '0.35rem 1.1rem', borderRadius: '99px', fontWeight: 700,
          border: `1px solid ${pct >= 50 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          marginBottom: '1.25rem'
        }}>
          <Zap size={14} /> {pct}% de réussite
        </div>
        <button className="btn" style={{ marginTop: '0.75rem' }} onClick={onReturn}>
          <ArrowLeft size={16} /> Retour au Dashboard
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', background:'var(--bg-glass)', padding:'0.35rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', width:'fit-content', maxWidth:'100%', flexWrap:'wrap' }}>
        {[{id:'correction', label:'Correction', icon:<CheckCircle2 size={15}/>},{id:'diagnostic', label:'Diagnostic', icon:<TrendingUp size={15}/>}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.5rem 1rem', borderRadius:'calc(var(--radius-md) - 3px)', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit', transition:'all 0.2s',
              background: tab===t.id ? 'var(--violet)' : 'transparent',
              color:      tab===t.id ? '#fff'           : 'var(--text-muted)',
              boxShadow:  tab===t.id ? '0 2px 8px var(--violet-glow)' : 'none',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'correction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {questions.map((q, idx) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div key={q.id} className="glass-panel" style={{
                borderLeft: `4px solid ${isCorrect ? 'var(--emerald)' : 'var(--danger)'}`,
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    Question {idx + 1} {q.topic && `· ${q.topic}`}
                  </span>
                  {isCorrect
                    ? <CheckCircle2 size={20} color="var(--emerald)" />
                    : <XCircle size={20} color="var(--danger)" />}
                </div>
                <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 500 }}>
                  {renderWithMath(q.question)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--bg-glass)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.4rem', fontWeight: 600 }}>VOTRE RÉPONSE</p>
                    {userAns
                      ? <span style={{ color: isCorrect ? 'var(--emerald)' : 'var(--danger)', fontWeight: 600 }}>
                          {userAns}) {renderOptionText(q.options.find(o => o.id === userAns)?.text)}
                        </span>
                      : <span className="text-muted">Aucune réponse</span>
                    }
                  </div>
                  <div style={{ background: 'var(--emerald-soft)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginBottom: '0.4rem', fontWeight: 600 }}>BONNE RÉPONSE</p>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      {q.correct_answer}) {renderOptionText(q.options.find(o => o.id === q.correct_answer)?.text)}
                    </span>
                  </div>
                </div>
                {!isCorrect && q.astuce && (
                  <div className="astuce-box">
                    <div className="astuce-header"><Lightbulb size={16} /> Astuce</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{renderWithMath(q.astuce)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'diagnostic' && (
        <DiagnosticReport corrected={corrected} exam={exam} onClose={onReturn} />
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function MockExamMode() {
  const { exams, saveMockExamResult, schoolBranding, isExamLocked } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam');
  const navigate = useNavigate();

  const currentExam = examId ? exams.find(e => e.id === examId) : exams[0];
  const questions = currentExam?.questions ?? [];
  const TOTAL_TIME = 120 * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_TIME);
  const [isFinished, setIsFinished]     = useState(false);
  const [answers, setAnswers]           = useState({});
  const [combo, setCombo]               = useState(0);
  const [selectedImageZoom, setSelectedImageZoom] = useState(null);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  const hasSavedResult = React.useRef(false);

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

      // Get school scoring rules
      const brand = schoolBranding[currentExam.school] || { scoring: { correct: 1, wrong: -0.25, empty: 0 } };
      const rules = brand.scoring || { correct: 1, wrong: -0.25, empty: 0 };

      let pts = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      questions.forEach(q => {
        const ans = answers[q.id];
        if (ans === q.correct_answer) {
          pts += rules.correct;
          correctCount++;
        } else if (!ans) {
          pts += rules.empty;
          emptyCount++;
        } else {
          pts += rules.wrong;
          wrongCount++;
        }
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
  }, [isFinished, answers, currentExam, questions, saveMockExamResult, schoolBranding]);

  const handleSelect = useCallback((optId) => {
    if (answers[questions[currentIndex]?.id]) return; // already answered in mock? allow re-select
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optId }));
  }, [answers, currentIndex, questions]);

  const goNext = () => { if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(i => i - 1); };

  if (!currentExam) {
    return (
      <div className="focus-layout flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="glass-panel text-center" style={{ padding: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Aucun examen sélectionné</h2>
          <button className="btn" onClick={() => navigate('/dashboard')}>
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
            <button onClick={() => navigate('/dashboard')} className="btn-outline">
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
        <div className="focus-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg,var(--violet),var(--emerald))', display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Trophy size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800 }}>Résultats — {currentExam.name}</span>
          </div>
        </div>
        <ResultsScreen
          questions={questions}
          answers={answers}
          exam={currentExam}
          onReturn={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answered = answers[currentQuestion?.id];
  const isCritical = timeLeft <= 300;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="focus-layout" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div className="focus-header" style={{ padding: '0.6rem clamp(0.75rem, 3vw, 1.5rem)', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> <span className="hide-xs">Quitter</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'clamp(120px, 30vw, 300px)' }}>{currentExam.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }} className="hide-xs">{currentExam.year} · Concours Blanc</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {combo >= 2 && (
            <div className="combo-badge" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
              <Flame size={12} /> {combo}x Combo
            </div>
          )}
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
            <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-subtle)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em', flexShrink: 0 }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.3rem', borderRadius: '0.4rem', display: 'flex' }}>
                  <Lightbulb size={14} />
                </div>
                Énoncé / Contexte
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-main)', paddingRight: '4px' }}>
                {renderWithMath(currentQuestion.context)}
              </div>
            </div>
          )}

          {/* Question Card (Middle/Right or Full Width) */}
          <div className="glass-card animate-fade-in" key={currentIndex} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Topic & Question Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexShrink: 0 }}>
              <span style={{ 
                fontSize: '0.76rem', 
                color: 'var(--violet)', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                background: 'var(--violet-soft)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                Question {currentIndex + 1} sur {questions.length}
              </span>
              {currentQuestion.topic && (
                <span className="topic-badge" style={{ margin: 0, padding: '0.25rem 0.6rem', fontSize: '0.7rem', borderRadius: '6px', fontWeight: 700 }}>
                  {currentQuestion.topic}
                </span>
              )}
            </div>

            {/* Scrollable Question and Options Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '4px', marginBottom: '0.5rem' }}>
              <div className="question-box" style={{ 
                fontSize: '1.15rem', 
                fontWeight: 700, 
                marginBottom: '1.5rem', 
                lineHeight: '1.6', 
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
                flexShrink: 0 
              }}>
                {renderWithMath(currentQuestion.question)}
              </div>

              {currentQuestion.image && (
                <div style={{ 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border)', 
                  background: 'rgba(0,0,0,0.15)', 
                  padding: '0.4rem', 
                  marginBottom: '1rem',
                  maxWidth: '100%', 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <img 
                    src={currentQuestion.image} 
                    alt="Question diagram" 
                    style={{ 
                      maxHeight: '140px', 
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
              )}

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
                  borderColor: currentIndex === 0 ? 'var(--border)' : 'var(--border)',
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
                      // Pulsing glowing Violet border for active question
                      btnStyle = {
                        ...btnStyle,
                        border: '2px solid var(--violet)',
                        background: 'rgba(99, 102, 241, 0.16)',
                        color: 'var(--violet)',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.35)',
                      };
                    } else if (isAnswered) {
                      // High-fidelity Emerald Green tint for answered/completed questions
                      btnStyle = {
                        ...btnStyle,
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--emerald)',
                      };
                    } else {
                      // Glassmorphic light grey/dark theme standard layout
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
        {/* Drawer Drag Indicator / Top Handle */}
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
        
        {/* Drawer Header */}
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
        
        {/* Drawer Content Area (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '2px' }}>
          {/* Progress stats in 4-column compact row */}
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
          
          {/* Scrollable grid navigator */}
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
        </div>
      </div>

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
