import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Flame, Target, BrainCircuit, Play, Lock,
  Zap, TrendingUp, BookOpen, Clock, Camera, LayoutDashboard
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_DATA = [
  { name: 'Lun', score: 60 },
  { name: 'Mar', score: 75 },
  { name: 'Mer', score: 65 },
  { name: 'Jeu', score: 85 },
  { name: 'Ven', score: 80 },
  { name: 'Sam', score: 95 },
  { name: 'Dim', score: 90 },
];

function ChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--violet)' }}>{`${payload[0].value}% score`}</p>
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
  const { user, exams, progress } = useAuth();
  const navigate = useNavigate();

  const getDueCount = (examQuestions) => {
    const now = new Date();
    return examQuestions.filter(q => {
      const p = progress[q.id];
      if (!p) return true;
      return new Date(p.nextReviewDate) <= now;
    }).length;
  };

  const activeExams = exams.filter(e => e.isActive !== false);

  const groupedExams = activeExams.reduce((acc, exam) => {
    const school = exam.school || 'Général';
    if (!acc[school]) acc[school] = [];
    acc[school].push(exam);
    return acc;
  }, {});

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
        
        {/* Quick OMR Scan Button */}
        <button 
          className="btn"
          onClick={() => navigate('/scanner')}
          style={{ 
            background: 'linear-gradient(135deg, var(--violet), var(--emerald))', 
            border: 'none', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            boxShadow: '0 10px 25px rgba(124, 58, 237, 0.25)',
            transform: 'translateY(0)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(124, 58, 237, 0.25)'; }}
        >
          <Camera size={16} /> Scanner une feuille OMR
        </button>
      </div>

      {/* ── Stats Bento ── */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="col-span-3">
          <StatCard icon={Trophy}      label="Classement National" value={`#${user?.rank ?? '—'}`}  colorClass="violet" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Flame}       label="Série Actuelle"       value={`${user?.streak ?? 0}j`} colorClass="warning" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Zap}         label="Expérience (XP)"      value={user?.xp ?? 0}           colorClass="emerald" />
        </div>
        <div className="col-span-3">
          <StatCard icon={Target}      label="Précision Moyenne"    value="78%"                     colorClass="danger" />
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className="dashboard-grid">
        {/* Exams list */}
        <div className="col-span-8 glass-panel">
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

                      return (
                        <div 
                          key={exam.id} 
                          className="exam-card-premium"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ 
                              width: '52px', height: '52px', borderRadius: '14px', 
                              background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--violet-soft)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              color: isCompleted ? 'var(--emerald)' : 'var(--violet)'
                            }}>
                              <BookOpen size={24} />
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '1.05rem' }}>{exam.name}</h4>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><Clock size={12} /> {exam.year}</span>
                                <span style={{ width:'4px', height:'4px', background:'var(--border)', borderRadius:'50%' }}></span>
                                <span>{exam.questions.length} QCM</span>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            {!isCompleted ? (
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

        {/* Right sidebar */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Weekly chart */}
          <div className="glass-panel">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <TrendingUp size={16} color="var(--emerald)" /> Votre Semaine
            </h3>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} barSize={18}>
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
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {CHART_DATA.map((entry, i) => {
                      const fill = entry.score >= 90 ? 'url(#colorEmerald)' : entry.score >= 75 ? 'url(#colorViolet)' : 'url(#colorNavy)';
                      const isHigh = entry.score >= 75;
                      return <Cell key={i} fill={fill} filter={isHigh ? 'url(#glow)' : ''} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak topics */}
          <div className="glass-panel">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} color="var(--warning)" /> Points Faibles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { name: 'Nombres Complexes', pct: 65, color: 'var(--danger)' },
                { name: 'Suites Numériques', pct: 75, color: 'var(--warning)' },
                { name: 'Probabilités',       pct: 82, color: 'var(--violet)' },
              ].map(({ name, pct, color }) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.83rem' }}>
                    <span>{name}</span>
                    <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color, boxShadow: 'none' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick tip */}
          <div className="glass-panel" style={{ background: 'var(--violet-soft)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Clock size={18} color="var(--violet)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Session du jour</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Votre prochain rappel SRS est dans <strong className="text-violet">2h</strong>. Restez connecté !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
