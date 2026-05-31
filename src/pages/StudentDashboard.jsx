import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Flame, Target, BrainCircuit, Play, Lock,
  Zap, TrendingUp, BookOpen, Clock, Camera, LayoutDashboard,
  CheckCircle2, AlertCircle, Award, History, FileText, Printer,
  ChevronRight, GraduationCap
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, YAxis, CartesianGrid } from 'recharts';
import { generateEbookHTML, generateStudentReportHTML, openPrintWindow } from '../utils/generateExamPDF';

// ── Mobile detection hook ──
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function ChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.85)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        padding: '0.6rem 1.25rem', 
        borderRadius: 'var(--radius-md)', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)' 
      }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--violet)' }}>
          {`${payload[0].value} révisions`}
        </p>
      </div>
    );
  }
  return null;
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} à ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

function ProgressTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.9)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        padding: '0.75rem 1.25rem', 
        borderRadius: 'var(--radius-md)', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)' 
      }}>
        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {data.date}
        </p>
        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
          {data.name}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--violet)', fontWeight: 800 }}>{data.pct}% de réussite</span>
          <span style={{ color: 'var(--text-subtle)' }}>({data.score}/{data.maxScore})</span>
        </div>
        <span style={{ 
          display: 'inline-block', 
          marginTop: '0.4rem', 
          fontSize: '0.72rem', 
          fontWeight: 900, 
          padding: '0.15rem 0.5rem', 
          borderRadius: '4px', 
          background: data.mode === 'En ligne' ? 'var(--violet-soft)' : 'rgba(16, 185, 129, 0.08)', 
          color: data.mode === 'En ligne' ? 'var(--violet)' : 'var(--emerald)' 
        }}>
          {data.mode}
        </span>
      </div>
    );
  }
  return null;
}

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="glass-panel stat-card">
      <div className={`stat-icon ${colorClass}`}><Icon size={24} /></div>
      <div>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, exams, progress, getStudentStats, mockExamHistory, isExamLocked, profName, profPhone, profSite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stats = getStudentStats();

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (location.state?.partialSave) {
      const count = location.state.count || 0;
      setToastMessage(`Session enregistrée ! Votre progression sur les ${count} fiches révisées a été sauvegardée avec succès.`);
      
      // Clean up the location state so the toast doesn't trigger again on refresh
      navigate(location.pathname, { replace: true, state: {} });
      
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const getDueCount = (examQuestions) => {
    const now = new Date();
    return examQuestions.filter(q => {
      const p = progress[q.id];
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

  // Generate pedagogical guidance text based on student progress
  const getPedagogicalTip = () => {
    if (stats.dueToday > 0) {
      return {
        title: "Session du jour recommandée",
        desc: `Vous avez ${stats.dueToday} fiches en attente de révision aujourd'hui. Une courte session de 10 minutes permettra de consolider votre mémoire à long terme.`,
        icon: Clock,
        color: 'var(--violet)'
      };
    } else if (stats.masteredCards > 0 && stats.weakTopics.length > 0) {
      const mainWeakness = stats.weakTopics[0].name;
      return {
        title: "Recommandation d'apprentissage",
        desc: `Toutes vos révisions sont à jour ! Nous vous conseillons de relire le cours sur "${mainWeakness}" pour renforcer vos lacunes identifiées.`,
        icon: Target,
        color: 'var(--warning)'
      };
    } else {
      return {
        title: "Excellent travail !",
        desc: "Toutes vos fiches sont parfaitement maîtrisées et à jour. Revenez demain pour la prochaine session automatique de l'algorithme.",
        icon: CheckCircle2,
        color: 'var(--emerald)'
      };
    }
  };

  // Prepare chronological history for graph (oldest to newest)
  const chronologicalHistory = [...(mockExamHistory || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((item, index) => ({
      index: index + 1,
      name: item.examName,
      pct: item.pct,
      score: item.score,
      maxScore: item.maxScore,
      date: formatDate(item.date),
      mode: item.mode === 'online' ? 'En ligne' : 'Scanner OMR'
    }));

  const tip = getPedagogicalTip();

  const handleGenerateWeaknessPDF = () => {
    // 1. Identify weak topics
    const topicsToPrint = stats.weakTopics.map(t => t.name);

    if (topicsToPrint.length === 0) {
      return;
    }

    // 2. Gather all matching questions from active exams
    const activeExams = exams.filter(e => e.isActive !== false && e.isArchived !== true);
    const questionsToPrint = [];
    activeExams.forEach(exam => {
      (exam.questions || []).forEach(q => {
        const t = q.subject || q.topic || 'Général';
        if (topicsToPrint.includes(t)) {
          questionsToPrint.push({
            ...q,
            _source: exam.name,
            _year: exam.year
          });
        }
      });
    });

    if (questionsToPrint.length === 0) {
      alert("Aucune question n'a été trouvée pour vos points faibles.");
      return;
    }

    // 3. Generate and open Print window
    const s = {
      showCover: true,
      showTricks: true,
      showPageNumbers: true,
      startPage: 1,
      questionsPerPage: 3,
      profName: profName || '',
      profPhone: profPhone || '',
      profSite: profSite || 'www.lconq.ma'
    };
    
    const title = "Fascicule de Révision Personnalisé";
    const html = generateEbookHTML(title, questionsToPrint, s);
    openPrintWindow(html, `cahier-revision-points-faibles`);
  };

  const handleDownloadReport = (item) => {
    const exam = exams.find(e => e.id === item.examId);
    if (!exam) {
      alert("Examen introuvable dans la bibliothèque.");
      return;
    }
    
    // Reconstruct corrected array from aggregate statistics
    const corrected = [];
    let correctLeft = item.correctCount || 0;
    let wrongLeft = item.wrongCount || 0;
    
    const LETTERS = ['A', 'B', 'C', 'D', 'E'];
    
    exam.questions.forEach((q, idx) => {
      const correct = q.correct_answer || q.answer || 'A';
      let detected = null;
      let result = 'empty';
      
      if (correctLeft > 0) {
        detected = correct;
        result = 'correct';
        correctLeft--;
      } else if (wrongLeft > 0) {
        detected = LETTERS.find(l => l !== correct) || 'A';
        result = 'wrong';
        wrongLeft--;
      }
      
      corrected.push({
        q: idx + 1,
        question: q.question,
        correct,
        detected,
        result,
        topic: q.topic || 'Général'
      });
    });
    
    const scoreObj = {
      pts: item.score,
      neg: (item.maxScore - item.correctCount) * 0.25,
      max: item.maxScore,
      pct: item.pct
    };
    
    const settings = {
      profName: profName || '',
      profPhone: profPhone || '',
      profSite: profSite || 'www.lconq.ma'
    };
    
    const html = generateStudentReportHTML(exam, scoreObj, corrected, settings);
    openPrintWindow(html);
  };

  const isMobile = useIsMobile();

  // ── MOBILE RENDER ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="animate-fade-in">

        {/* ── Mobile Hero Card ── */}
        <div className="mobile-hero-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="mob-page-greeting">Bonjour 👋</p>
            <h1 className="mob-page-title" style={{ color: '#fff' }}>{user?.name?.split(' ')[0]}</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', margin: '0.4rem 0 1.25rem', fontWeight: 500 }}>
              {stats.dueToday > 0
                ? `${stats.dueToday} fiches à réviser aujourd'hui 🔥`
                : 'Toutes tes révisions sont à jour ✅'}
            </p>
            {/* Hero CTA */}
            <button
              onClick={() => navigate('/study')}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: '16px',
                background: 'rgba(255,255,255,0.2)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: '#fff', fontWeight: 900, fontSize: '0.95rem',
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                backdropFilter: 'blur(10px)', transition: 'all 0.2s'
              }}
            >
              <BrainCircuit size={18} />
              Lancer la révision du jour
              {stats.dueToday > 0 && (
                <span style={{
                  background: 'var(--danger)', borderRadius: '99px',
                  padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 900
                }}>{stats.dueToday}</span>
              )}
            </button>
          </div>
          {/* Decorative stat chips */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
            {[
              { icon: '🔥', val: `${stats.streak}j`, label: 'Série' },
              { icon: '⚡', val: user?.xp ?? 0, label: 'XP' },
              { icon: '🏆', val: `#${stats.rank}`, label: 'Rang' },
            ].map(chip => (
              <div key={chip.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '0.55rem 0.4rem',
                textAlign: 'center', border: '1px solid rgba(255,255,255,0.18)'
              }}>
                <div style={{ fontSize: '0.95rem', marginBottom: '1px' }}>{chip.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff', lineHeight: 1 }}>{chip.val}</div>
                <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: '2px' }}>{chip.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="mobile-quick-actions">
          {[
            { icon: '📚', label: 'Réviser', color: '#716DF2', bg: 'rgba(113,109,242,0.12)', action: () => navigate('/study') },
            { icon: '📷', label: 'Scanner', color: '#10B981', bg: 'rgba(16,185,129,0.12)', action: () => navigate('/scanner') },
            { icon: '🎯', label: 'Examen', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', action: () => navigate('/schools') },
            { icon: '🏆', label: 'Classement', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', action: () => navigate('/ranking') },
          ].map(qa => (
            <button key={qa.label} className="mobile-qa-btn" onClick={qa.action}>
              <div className="mobile-qa-icon" style={{ background: qa.bg }}>
                <span style={{ fontSize: '1.3rem' }}>{qa.icon}</span>
              </div>
              <span className="mobile-qa-label">{qa.label}</span>
            </button>
          ))}
        </div>

        {/* ── Modules de Révision ── */}
        <div className="mobile-section-header">
          <span className="mobile-section-title">📖 Mes Modules</span>
          <button className="mobile-section-link" onClick={() => navigate('/schools')}>Voir tout</button>
        </div>

        {activeExams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <BrainCircuit size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Aucun module disponible</p>
          </div>
        ) : (
          <div className="mobile-scroll-row" style={{ marginBottom: '1.5rem' }}>
            {activeExams.map(exam => {
              const dueCount = getDueCount(exam.questions);
              const isCompleted = dueCount === 0;
              const isLocked = isExamLocked(exam);
              return (
                <div
                  key={exam.id}
                  className="mobile-exam-mini-card"
                  onClick={() => !isLocked && navigate('/study', { state: { examId: exam.id } })}
                  style={{ opacity: isLocked ? 0.65 : 1 }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '12px', marginBottom: '0.65rem',
                    background: isLocked ? 'var(--bg-glass)' : isCompleted ? 'rgba(16,185,129,0.12)' : 'var(--violet-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isLocked ? 'var(--text-subtle)' : isCompleted ? 'var(--emerald)' : 'var(--violet)'
                  }}>
                    {isLocked ? <Lock size={18} /> : <BookOpen size={20} />}
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {exam.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {exam.questions.length} QCM • {exam.year}
                  </p>
                  {!isLocked && !isCompleted && (
                    <div style={{
                      marginTop: '0.65rem', padding: '0.3rem 0.6rem',
                      background: 'var(--violet-soft)', borderRadius: '8px',
                      fontSize: '0.65rem', fontWeight: 800, color: 'var(--violet)',
                      display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Clock size={10} /> {dueCount} dues
                    </div>
                  )}
                  {isCompleted && !isLocked && (
                    <div style={{
                      marginTop: '0.65rem', padding: '0.3rem 0.6rem',
                      background: 'rgba(16,185,129,0.1)', borderRadius: '8px',
                      fontSize: '0.65rem', fontWeight: 800, color: 'var(--emerald)',
                      display: 'inline-flex', alignItems: 'center', gap: '3px'
                    }}>
                      <CheckCircle2 size={10} /> Maîtrisé
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pedagogical Tip ── */}
        <div style={{
          background: 'var(--bg-card)', border: `1.5px solid ${tip.color}33`,
          borderRadius: '20px', padding: '1.1rem 1.25rem',
          display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            background: `${tip.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <tip.icon size={20} color={tip.color} />
          </div>
          <div>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '0.88rem', color: tip.color }}>{tip.title}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.desc}</p>
          </div>
        </div>

        {/* ── Weekly Activity Chart ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '1.1rem 1.25rem',
          marginBottom: '1.5rem', boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>📊 Activité Hebdomadaire</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {stats.weeklyActivity ? stats.weeklyActivity.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0} révisions
            </span>
          </div>
          <div style={{ height: 120, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity || []} barSize={12}>
                <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats.weeklyActivity || []).map((entry, i) => {
                    const fill = entry.count >= 20 ? 'var(--emerald)' : entry.count > 0 ? 'var(--violet)' : 'var(--border)';
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Mock Exam History (last 3) ── */}
        {mockExamHistory && mockExamHistory.length > 0 && (
          <>
            <div className="mobile-section-header">
              <span className="mobile-section-title">📊 Derniers Examens</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[...mockExamHistory].slice(0, 3).map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '16px'
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                    background: item.pct >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '0.88rem',
                    color: item.pct >= 70 ? 'var(--emerald)' : 'var(--danger)'
                  }}>
                    {item.pct}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.examName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.score}/{item.maxScore} pts
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(item)}
                    style={{
                      background: 'var(--bg-glass)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '0.4rem 0.6rem', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <Printer size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── DESKTOP RENDER ───────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Bonjour, {user?.name}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Prêt pour votre session de Spaced Repetition du jour ?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={() => navigate('/study')}
            style={{ background: 'linear-gradient(135deg, var(--violet), #4f46e5)', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.25)', color: '#fff' }}
          >
            <BrainCircuit size={16} /> Révision Guidée Quotidienne
            {stats.dueToday > 0 && (
              <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '99px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 900, marginLeft: '0.25rem' }}>
                {stats.dueToday}
              </span>
            )}
          </button>
          <button
            className="btn-outline"
            onClick={() => navigate('/scanner')}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', color: 'var(--text-main)' }}
          >
            <Camera size={16} /> Scanner une feuille OMR
          </button>
        </div>
      </div>
      {/* ── Stats Bento (Dynamic real stats) ── */}
      <div className="dashboard-grid stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="col-span-3">
          <StatCard icon={Trophy}      label="Classement National" value={`#${stats.rank} / ${stats.totalStudents}`}  colorClass="violet" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Flame}       label="Série Actuelle"       value={`${stats.streak}j`} colorClass="warning" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Zap}         label="Expérience (XP)"      value={user?.xp ?? 0}           colorClass="emerald" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Target}      label="Maîtrise Globale"    value={`${stats.globalMasteryPct}%`} colorClass="danger" />
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className="dashboard-grid">
        {/* Exams list & Mock Exams tracking */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Modules de Révision Card */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <BookOpen size={18} color="var(--violet)" /> Modules de Révision
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeExams.length} examen{activeExams.length !== 1 ? 's' : ''}
              </span>
            </div>

            {activeExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <div style={{ width:'80px', height:'80px', background:'var(--bg-glass)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', border:'1px solid var(--border)' }}>
                  <BrainCircuit size={40} opacity={0.4} />
                </div>
                <p style={{ fontWeight:600 }}>Aucun module disponible</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {Object.entries(groupedExams).map(([school, schoolExams]) => (
                  <div key={school}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <h4 style={{ 
                        margin: 0, fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', 
                        textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace:'nowrap' 
                      }}>
                        {school}
                      </h4>
                      <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)', flex: 1 }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              <div style={{ 
                                width: '52px', height: '52px', borderRadius: '14px', 
                                background: isLocked ? 'var(--bg-glass)' : (isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--violet-soft)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                color: isLocked ? 'var(--text-subtle)' : (isCompleted ? 'var(--emerald)' : 'var(--violet)')
                              }}>
                                {isLocked ? <Lock size={20} /> : <BookOpen size={24} />}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>{exam.name}</h4>
                                  {isLocked && <span className="badge badge-pro" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}><Zap size={8} /> PRO</span>}
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                  <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><Clock size={12} /> {exam.year}</span>
                                  <span style={{ width:'4px', height:'4px', background:'var(--border)', borderRadius:'50%' }}></span>
                                  <span>{exam.questions.length} QCM</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              {isLocked ? (
                                <button 
                                  className="btn-outline" 
                                  onClick={() => navigate('/subscription')}
                                  style={{ padding: '0.7rem 1.5rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <Lock size={13} /> S'abonner
                                </button>
                              ) : !isCompleted ? (
                                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                                  <div style={{ 
                                    background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', 
                                    padding: '0.35rem 0.85rem', borderRadius: '0.75rem', fontSize: '0.72rem', fontWeight: 900,
                                    display: 'inline-flex', alignItems:'center', gap:'0.4rem', border:'1px solid rgba(239, 68, 68, 0.1)'
                                  }}>
                                    <div style={{ width:'6px', height:'6px', background:'var(--danger)', borderRadius:'50%' }}></div>
                                    {dueCount} À RÉVISER
                                  </div>
                                  <button 
                                    className="btn" 
                                    onClick={() => navigate(`/study?exam=${exam.id}`)}
                                    style={{ padding: '0.7rem 1.75rem', fontSize: '0.85rem', fontWeight:800 }}
                                  >
                                    Réviser
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                                  <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.05)', color: 'var(--emerald)', 
                                    padding: '0.4rem 1rem', borderRadius: '0.75rem', fontSize: '0.72rem', fontWeight: 900,
                                    display: 'inline-flex', alignItems:'center', gap:'0.4rem', border:'1px solid rgba(16, 185, 129, 0.1)'
                                  }}>
                                    COMPLÉTÉ ✨
                                  </div>
                                  <button 
                                    className="btn-outline" 
                                    disabled
                                    style={{ padding: '0.7rem 1.5rem', fontSize: '0.85rem', opacity: 0.4, cursor:'default', borderStyle:'dashed' }}
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

          {/* Suivi des Examens Blancs Card */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <History size={18} color="var(--violet)" /> Suivi des Examens Blancs
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {mockExamHistory.length} tentative{mockExamHistory.length !== 1 ? 's' : ''}
              </span>
            </div>

            {mockExamHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                <div style={{ 
                  width: '72px', height: '72px', 
                  background: 'var(--bg-glass)', 
                  borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 1.25rem', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-subtle)'
                }}>
                  <History size={32} opacity={0.6} />
                </div>
                <h4 style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1rem' }}>
                  Aucun examen blanc enregistré
                </h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  Lancez un examen blanc en ligne ou scannez une feuille de réponses OMR pour commencer à suivre votre progression.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    className="btn-outline" 
                    onClick={() => navigate('/schools')}
                    style={{ fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Examen en ligne
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => navigate('/scanner')}
                    style={{ fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Scanner OMR
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Progression Chart */}
                <div>
                  <h4 style={{ 
                    fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', 
                    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' 
                  }}>
                    Évolution des Scores
                  </h4>
                  
                  <div style={{ height: 220, width: '100%', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chronologicalHistory}>
                        <defs>
                          <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--violet)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--violet)" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis 
                          dataKey="index" 
                          stroke="var(--text-subtle)" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(tick) => `Ex. ${tick}`}
                        />
                        <YAxis 
                          stroke="var(--text-subtle)" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          domain={[0, 100]}
                          tickFormatter={(tick) => `${tick}%`}
                        />
                        <Tooltip content={<ProgressTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="pct" 
                          stroke="var(--violet)" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorProgress)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Historical list */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', 
                    textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' 
                  }}>
                    Historique des Tentatives
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {mockExamHistory.map((item) => {
                      const isHigh = item.pct >= 70;
                      const isMid = item.pct >= 50 && item.pct < 70;
                      const pctColor = isHigh ? 'var(--emerald)' : isMid ? 'var(--warning)' : 'var(--danger)';
                      const pctBg = isHigh ? 'var(--emerald-soft)' : isMid ? 'var(--warning-soft)' : 'var(--danger-soft)';
                      
                      return (
                        <div 
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, minWidth: '150px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {item.examName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                              {formatDate(item.date)} · {item.school}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              background: item.mode === 'online' ? 'var(--violet-soft)' : 'rgba(16, 185, 129, 0.08)',
                              color: item.mode === 'online' ? 'var(--violet)' : 'var(--emerald)',
                              border: `1px solid ${item.mode === 'online' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
                            }}>
                              {item.mode === 'online' ? 'En ligne' : 'Scanner OMR'}
                            </span>
                            
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: pctBg,
                              color: pctColor,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '99px',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              border: `1px solid ${pctColor}25`
                            }}>
                              {item.score}/{item.maxScore} <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>({item.pct}%)</span>
                            </div>

                            <button
                              onClick={() => handleDownloadReport(item)}
                              title="Télécharger le rapport PDF"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--violet-soft)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                color: 'var(--violet)',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--violet)';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--violet-soft)';
                                e.currentTarget.style.color = 'var(--violet)';
                              }}
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Weekly activity (Real dynamic data) */}
          <div className="glass-panel">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <TrendingUp size={16} color="var(--emerald)" /> Votre Semaine
            </h3>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyActivity} barSize={18}>
                  <defs>
                    <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--emerald)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--violet)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--violet)" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorNavy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--navy-600)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--navy-700)" stopOpacity={0.5}/>
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.weeklyActivity.map((entry, i) => {
                      const fill = entry.count >= 20 ? 'url(#colorEmerald)' : entry.count > 0 ? 'url(#colorViolet)' : 'url(#colorNavy)';
                      const isHigh = entry.count >= 20;
                      return <Cell key={i} fill={fill} filter={isHigh ? 'url(#glow)' : ''} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak topics (Real dynamic data) */}
          <div className="glass-panel">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} color="var(--warning)" /> Points Faibles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {stats.weakTopics.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  Aucun point faible détecté. Continuez vos révisions pour affiner l'analyse.
                </p>
              ) : (
                stats.weakTopics.map(({ name, masteryPct }) => {
                  const color = masteryPct < 30 ? 'var(--danger)' : masteryPct < 65 ? 'var(--warning)' : 'var(--violet)';
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.83rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                        <span style={{ color, fontWeight: 700 }}>{masteryPct}% maîtrisé</span>
                      </div>
                      <div className="progress-track" style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${masteryPct}%`, background: color, height: '100%', borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Custom PDF Workbook Generator */}
            <button
              className="btn"
              onClick={handleGenerateWeaknessPDF}
              disabled={stats.weakTopics.length === 0}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                background: stats.weakTopics.length === 0 ? 'var(--bg-glass)' : 'linear-gradient(135deg, var(--warning), #ea580c)',
                border: stats.weakTopics.length === 0 ? '1px solid var(--border)' : 'none',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                boxShadow: stats.weakTopics.length === 0 ? 'none' : '0 10px 20px rgba(234, 88, 12, 0.15)',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease',
                color: stats.weakTopics.length === 0 ? 'var(--text-muted)' : '#fff',
                cursor: stats.weakTopics.length === 0 ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={e => { 
                if (stats.weakTopics.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)'; 
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(234, 88, 12, 0.25)'; 
                }
              }}
              onMouseLeave={e => { 
                if (stats.weakTopics.length > 0) {
                  e.currentTarget.style.transform = 'translateY(0)'; 
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(234, 88, 12, 0.15)'; 
                }
              }}
            >
              <FileText size={16} /> Générer mon Cahier d'Erreurs PDF
            </button>
          </div>

          {/* Dynamic Pedagogical Advice Box */}
          <div 
            className="glass-panel" 
            onClick={() => {
              if (stats.dueToday > 0) {
                navigate('/study');
              }
            }}
            style={{ 
              background: 'var(--violet-soft)', 
              border: '1px solid rgba(99,102,241,0.2)',
              cursor: stats.dueToday > 0 ? 'pointer' : 'default',
              transform: 'translateY(0)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (stats.dueToday > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.15)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <tip.icon size={20} color={tip.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  {tip.title}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.55, marginBottom: stats.dueToday > 0 ? '0.75rem' : 0 }}>
                  {tip.desc}
                </p>
                {stats.dueToday > 0 && (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.35rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: 'var(--violet)',
                    textDecoration: 'underline'
                  }}>
                    Lancer la révision globale →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Toast Notification ── */}
      {toastMessage && (
        <div className="dashboard-toast" style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.5rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          maxWidth: '420px',
          color: 'var(--text-main)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald)',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4 }}>
              {toastMessage}
            </p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.2rem',
              marginLeft: '0.5rem'
            }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
