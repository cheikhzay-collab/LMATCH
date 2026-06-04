import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import MobileFlashcard from '../components/MobileFlashcard';
import SessionSummary from '../components/SessionSummary';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Award, BrainCircuit, CheckCircle2, Zap, RefreshCw, Sparkles, Trophy, Lock, BookOpen, Clock } from 'lucide-react';

// Helper to group cards by context, preserving original exam order and avoiding duplicates.
function groupCardsByContext(compiledCards, questionsPool) {
  const grouped = [];
  const seenIds = new Set();

  compiledCards.forEach(card => {
    if (seenIds.has(card.id)) return;

    if (card.context && card.context.trim()) {
      const siblings = questionsPool.filter(q =>
        q.context &&
        q.context.trim() === card.context.trim() &&
        q.examName === card.examName
      );

      siblings.forEach(q => {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          grouped.push({
            ...q,
            stage: card.stage || 'révision',
            stageLabel: q.id === card.id ? (card.stageLabel || 'Révision') : `${card.stageLabel || 'Révision'} (Lié)`
          });
        }
      });
    } else {
      seenIds.add(card.id);
      grouped.push(card);
    }
  });

  return grouped;
}

export default function StudyMode() {
  const { exams, progress: allProgress, updateCardProgress, isExamLocked, getStudentStats } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam');
  const navigate = useNavigate();

  // Mobile detection — updated on resize
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const activeExamsList = exams.filter(e => e.isActive !== false && e.isArchived !== true && !isExamLocked(e));
  const currentExam = examId ? exams.find(e => e.id === examId) : activeExamsList[0];

  const [sessionStarted, setSessionStarted] = useState(!!examId);
  const isParcours = !examId;

  // ─── SNAPSHOT: Freeze the due cards list at session start ───────────────────
  const [sessionCards, setSessionCards] = useState(null); // null = not initialized yet

  // Dynamically allow scrolling on selector dashboard, but lock it in study session focus mode
  useEffect(() => {
    const layoutEl = document.querySelector('.focus-layout');
    if (!sessionStarted) {
      if (layoutEl) {
        layoutEl.style.setProperty('overflow-y', 'auto', 'important');
        layoutEl.style.setProperty('overflow-x', 'hidden', 'important');
        layoutEl.style.setProperty('height', 'auto', 'important');
      }
      document.body.style.setProperty('overflow-y', 'auto', 'important');
      document.body.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('position', 'relative', 'important');
    } else {
      if (layoutEl) {
        layoutEl.style.removeProperty('overflow-y');
        layoutEl.style.removeProperty('overflow-x');
        layoutEl.style.removeProperty('height');
      }
      document.body.style.removeProperty('overflow-y');
      document.body.style.removeProperty('overflow-x');
      document.body.style.removeProperty('position');
    }
    return () => {
      if (layoutEl) {
        layoutEl.style.removeProperty('overflow-y');
        layoutEl.style.removeProperty('overflow-x');
        layoutEl.style.removeProperty('height');
      }
      document.body.style.removeProperty('overflow-y');
      document.body.style.removeProperty('overflow-x');
      document.body.style.removeProperty('position');
    };
  }, [sessionStarted]);

  // Track sessionType/examId URL changes
  useEffect(() => {
    if (examId) {
      setSessionStarted(true);
    } else {
      setSessionStarted(false);
      setSessionCards(null);
    }
  }, [examId]);

  useEffect(() => {
    if (!sessionStarted || sessionCards !== null) return;

    const now = new Date();
    let questionsPool = [];

    if (examId) {
      if (!currentExam || !currentExam.questions) return;
      questionsPool = (currentExam.questions || []).map(q => ({ ...q, examName: currentExam.name }));
    } else {
      questionsPool = activeExamsList.flatMap(e =>
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
    const groupedCards = groupCardsByContext(compiledCards, questionsPool);
    setSessionCards(groupedCards);
  }, [currentExam, examId, exams, allProgress, sessionCards, sessionStarted]);
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
      if (activeExamsList.length === 0) {
        navigate('/dashboard');
      }
      return;
    }
    if (!currentExam && activeExamsList.length > 0) {
      navigate(`/study?exam=${activeExamsList[0].id}`, { replace: true });
    } else if (activeExamsList.length === 0) {
      navigate('/dashboard');
    }
  }, [currentExam, activeExamsList, navigate, isParcours]);

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
    if (!currentExam || !currentExam.questions) return;
    const questionsPool = (currentExam.questions || []).map(q => ({ ...q, examName: currentExam.name }));
    const shuffled = [...questionsPool].sort(() => 0.5 - Math.random());
    
    const sliced = shuffled.slice(0, 10).map(q => ({
      ...q,
      stage: 'révision',
      stageLabel: 'Révision'
    }));

    const grouped = groupCardsByContext(sliced, questionsPool);
    setSessionCards(grouped);
    setSessionFinished(false);
    setCurrentIndex(0);
    setSessionHistory([]);
  };

  // ── Study Selector Dashboard (Main screen when no exam/session is selected) ──
  if (!sessionStarted) {
    const getDueCount = (examQuestions) => {
      const now = new Date();
      return (examQuestions || []).filter(q => {
        const p = allProgress[q.id];
        if (!p) return true;
        return new Date(p.nextReviewDate) <= now;
      }).length;
    };

    const activeExams = exams.filter(e => e.isActive !== false && e.isArchived !== true);

    const groupedExams = activeExams.reduce((acc, exam) => {
      const school = exam.school || 'Général';
      if (!acc[school]) acc[school] = [];
      acc[school].push(exam);
      return acc;
    }, {});

    const stats = getStudentStats ? getStudentStats() : null;
    const totalDueToday = stats ? stats.dueToday : 0;

    return (
      <div className="animate-fade-in" style={{ padding: 'clamp(1rem, 4vw, 2.5rem) 1rem', maxWidth: '1100px', margin: '0 auto', minHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-outline"
            style={{ 
              padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, 
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem' 
            }}
          >
            <ArrowLeft size={16} /> Retour au Dashboard
          </button>
        </div>

        {/* Hub Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ 
            width: '60px', height: '60px', background: 'var(--violet-soft)', borderRadius: '18px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            border: '1px solid rgba(113, 109, 242, 0.2)', color: 'var(--violet)'
          }}>
            <BrainCircuit size={30} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.3rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Espace Révision (SRS)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            Consolidez votre mémoire à long terme en révisant les notions au moment optimal calculé par notre algorithme de répétition espacée.
          </p>
        </div>

        <div className="dashboard-grid">
          {/* Left: General Daily Guided Session Card */}
          <div className="col-span-5">
            <div className="glass-panel" style={{ 
              height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              border: '1px solid rgba(113, 109, 242, 0.2)', background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(113, 109, 242, 0.03) 100%)',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
                    <Zap size={18} fill="currentColor" />
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>Parcours Guidé</h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Session intelligente regroupant toutes vos fiches en attente de révision aujourd'hui à travers tous vos concours actifs.
                </p>

                <div style={{ 
                  background: totalDueToday > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                  border: `1px solid ${totalDueToday > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'}`,
                  color: totalDueToday > 0 ? 'var(--danger)' : 'var(--emerald)',
                  padding: '1.25rem 1rem', borderRadius: '14px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.15rem', lineHeight: 1 }}>{totalDueToday}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {totalDueToday > 0 ? "Fiches à réviser aujourd'hui" : "Toutes vos fiches sont à jour !"}
                  </div>
                </div>
              </div>

              <button 
                className="btn" 
                onClick={() => setSessionStarted(true)} 
                disabled={totalDueToday === 0}
                style={{ 
                  width: '100%', padding: '0.85rem', fontWeight: 800, 
                  background: totalDueToday > 0 ? 'var(--btn-primary-bg)' : 'var(--bg-glass)',
                  color: totalDueToday > 0 ? '#fff' : 'var(--text-subtle)',
                  cursor: totalDueToday > 0 ? 'pointer' : 'default',
                  opacity: totalDueToday > 0 ? 1 : 0.6,
                  border: totalDueToday > 0 ? 'none' : '1px solid var(--border)'
                }}
              >
                {totalDueToday > 0 ? 'Démarrer la session globale' : 'Revenez demain ✨'}
              </button>
            </div>
          </div>

          {/* Right: Modules de Révision par Concours */}
          <div className="col-span-7">
            <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                  <BookOpen size={18} color="var(--violet)" /> Modules de Révision
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {activeExams.length} examen{activeExams.length !== 1 ? 's' : ''}
                </span>
              </div>

              {activeExams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <BrainCircuit size={36} opacity={0.4} style={{ marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 600 }}>Aucun module de révision disponible</p>
                </div>
              ) : (
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem', flex: 1 }}>
                  {Object.entries(groupedExams).map(([school, schoolExams]) => (
                    <div key={school}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                        <h4 style={{ 
                          margin: 0, fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-muted)', 
                          textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' 
                        }}>
                          {school}
                        </h4>
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)', flex: 1 }}></div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {schoolExams.map((exam) => {
                          const dueCount = getDueCount(exam.questions);
                          const isCompleted = dueCount === 0;
                          const isLocked = isExamLocked(exam);

                          return (
                            <div 
                               key={exam.id} 
                               className="exam-card-premium"
                               style={{ opacity: isLocked ? 0.8 : 1 }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                                <div style={{ 
                                  width: '38px', height: '38px', borderRadius: '10px', 
                                  background: isLocked ? 'var(--bg-glass)' : (isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--violet-soft)'),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  color: isLocked ? 'var(--text-subtle)' : (isCompleted ? 'var(--emerald)' : 'var(--violet)')
                                }}>
                                  {isLocked ? <Lock size={15} /> : <BookOpen size={16} />}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0 }}>
                                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{exam.name}</h4>
                                    {isLocked && <span className="badge badge-pro" style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem', flexShrink: 0 }}><Zap size={7} /> PRO</span>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    <span>{exam.year}</span>
                                    <span>·</span>
                                    <span>{exam.questions.length} QCM</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                {isLocked ? (
                                  <button 
                                    className="btn-outline" 
                                    onClick={() => navigate('/subscription')}
                                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Lock size={10} /> S'abonner
                                  </button>
                                ) : !isCompleted ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ 
                                      background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', 
                                      padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 900,
                                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem', border: '1px solid rgba(239, 68, 68, 0.1)'
                                    }}>
                                      {dueCount} À RÉVISER
                                    </div>
                                    <button 
                                      className="btn" 
                                      onClick={() => navigate(`/study?exam=${exam.id}`)}
                                      style={{ padding: '0.45rem 1rem', fontSize: '0.72rem', fontWeight: 800 }}
                                    >
                                      Réviser
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ 
                                      background: 'rgba(16, 185, 129, 0.05)', color: 'var(--emerald)', 
                                      padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 900,
                                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem', border: '1px solid rgba(16, 185, 129, 0.1)'
                                    }}>
                                      COMPLÉTÉ ✨
                                    </div>
                                    <button 
                                      className="btn-outline" 
                                      disabled
                                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.72rem', opacity: 0.4, cursor: 'default', borderStyle: 'dashed' }}
                                    >
                                      Demain
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Lock check ──
  if (!isParcours && currentExam && isExamLocked(currentExam)) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.15)' }}>
          <Zap size={36} fill="currentColor" />
        </div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Contenu Premium Verrouillé</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', marginBottom: '2rem', lineHeight: 1.6 }}>
          L'examen <strong>{currentExam.name}</strong> fait partie de l'offre Premium. Abonnez-vous pour débloquer l'accès à tous les concours et corriger vos faiblesses avec l'IA.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/subscription')} className="btn" style={{ background: 'linear-gradient(135deg, var(--violet), #818cf8)' }}>
            ✦ Voir les offres d'abonnement
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-outline">
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

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
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
      overflowX: 'hidden',
      boxSizing: 'border-box',
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

      {/* ── Flashcard: desktop vs mobile ── */}
      <div 
        className="study-scroll-container"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          justifyContent: 'center',
          /* On mobile: natural scroll, not squeezed */
          overflowY: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '5rem' : 0,
        }}>
        {isMobile ? (
          <MobileFlashcard
            key={currentCard.id}
            card={currentCard}
            onNext={handleNext}
          />
        ) : (
          <Flashcard
            key={currentCard.id}
            card={currentCard}
            onNext={handleNext}
          />
        )}
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
          <div className="animate-fade-in" style={{
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
