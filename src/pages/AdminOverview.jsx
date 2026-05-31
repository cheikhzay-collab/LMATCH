import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, CircleDollarSign, TrendingUp, Camera, 
  Sparkles, AlertTriangle, Activity, CheckCircle, RefreshCw, X, ArrowUpRight, Phone, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminOverview() {
  const { users, exams, refreshAdminData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (refreshAdminData) {
      refreshAdminData();
    }
  }, [refreshAdminData]);

  // Real Database calculations
  const totalPremium = users.filter(u => u.tier === 'premium').length;
  const totalRevenue = totalPremium * 99; // 99 Dh per premium user

  // AI-OMR Engine simulation
  const [omrStatus, setOmrStatus] = useState('processing'); // 'idle' or 'processing'
  const [omrProgress, setOmrProgress] = useState(14);

  useEffect(() => {
    let interval;
    if (omrStatus === 'processing') {
      interval = setInterval(() => {
        setOmrProgress(prev => {
          if (prev >= 45) {
            setOmrStatus('idle');
            return 45;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [omrStatus]);

  const handleToggleOMR = () => {
    if (omrStatus === 'idle') {
      setOmrProgress(0);
      setOmrStatus('processing');
    } else {
      setOmrStatus('idle');
    }
  };

  // Math viz state and calculation
  const [showDerivative, setShowDerivative] = useState(false);
  const baseProgressionData = [
    { name: 'Sem 1', f_t: 55 },
    { name: 'Sem 2', f_t: 58 },
    { name: 'Sem 3', f_t: 65 },
    { name: 'Sem 4', f_t: 64 },
    { name: 'Sem 5', f_t: 72 },
    { name: 'Sem 6', f_t: 82 },
    { name: 'Sem 7', f_t: 85 },
  ];

  const progressionData = baseProgressionData.map((d, idx, arr) => {
    const prev = arr[idx - 1];
    const rate = prev ? d.f_t - prev.f_t : 0;
    return {
      ...d,
      f_prime_t: rate
    };
  });

  // Action Hub state
  const [actionItems, setActionItems] = useState([
    {
      id: 'omr-1',
      type: 'omr',
      title: 'Conflit de lecture OMR',
      student: 'Yassine Kamel',
      details: 'Double marquage détecté sur la question 12 (indice de confiance 48%).',
      time: 'Il y a 5 min',
      severity: 'high',
    },
    {
      id: 'parent-1',
      type: 'parent',
      title: 'Rappel parent demandé',
      student: 'Amal Alami',
      details: "Baisse de performance signalée sur l'étude des dérivées mathématiques.",
      time: 'Il y a 20 min',
      severity: 'medium',
    },
    {
      id: 'code-1',
      type: 'code',
      title: "Code d'activation bloqué",
      student: 'Amine Ouadadi',
      details: 'Erreurs de saisie répétées avec un reçu de paiement valide fourni.',
      time: 'Il y a 1h',
      severity: 'low',
    }
  ]);

  const handleResolve = (id) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.95)', 
          backdropFilter: 'blur(16px)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          padding: '0.8rem 1.2rem', 
          borderRadius: '12px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          color: '#fff',
          fontFamily: 'inherit'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
              <span>Niveau f(t) :</span>
              <strong style={{ color: '#E2B874', fontSize: '1rem' }}>{payload[0].value}%</strong>
            </p>
            {showDerivative && payload[1] && (
              <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
                <span>Vitesse f\'(t) :</span>
                <strong style={{ color: 'var(--violet)', fontSize: '1rem' }}>
                  {payload[1].value > 0 ? `+${payload[1].value}` : payload[1].value}% / sem
                </strong>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ direction: 'ltr', textAlign: 'left' }}>
      
      {/* ── HEADER WITH AI-OMR ENGINE PULSE ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(113, 109, 242, 0.2)' }}>
              <LayoutDashboard size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>Tableau de bord intelligent</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Pilotez l'activité globale et suivez les performances académiques des élèves.</p>
        </div>

        {/* AI-OMR Engine Status Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          <div onClick={handleToggleOMR} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
              {omrStatus === 'processing' && (
                <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: 'var(--emerald)', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
              )}
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: omrStatus === 'processing' ? 'var(--emerald)' : 'var(--text-subtle)' }}></span>
            </span>
            <div style={{ textDirection: 'ltr', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {omrStatus === 'processing' ? `Moteur OMR : Lot ${omrProgress}/45` : 'Moteur IA OMR : Prêt'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {omrStatus === 'processing' ? 'Traitement des copies en cours...' : 'Inactif - Cliquer pour simuler'}
              </div>
            </div>
          </div>
          
          <button 
            className="btn"
            onClick={() => navigate('/scanner')}
            style={{ 
              background: 'linear-gradient(135deg, var(--violet), var(--emerald))', 
              border: 'none', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              borderRadius: '10px',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)'
            }}
          >
            <Camera size={15} /> Scanner les QCM
          </button>
        </div>
      </header>

      {/* ── PREDICTIVE KPI CARDS (4 COLUMNS) ── */}
      <div className="dashboard-grid stats-row" style={{ marginBottom: '2rem' }}>
        
        {/* Card 1 */}
        <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Engagement étudiant</span>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--violet-soft)', color: 'var(--violet)' }}><Users size={18} /></div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>88.4%</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
              <Sparkles size={12} /> Prédiction IA : 93.0% (▲) demain
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Succès des devoirs IA</span>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--emerald-soft)', color: 'var(--emerald)' }}><Award size={18} /></div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>72.1%</div>
            <div style={{ fontSize: '0.78rem', color: '#E2B874', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
              <Sparkles size={12} /> Hausse de +4.5% estimée la sem. pro.
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Interventions requises</span>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--danger-soft)', color: 'var(--danger)' }}><AlertTriangle size={18} /></div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{actionItems.length} alertes</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
              <RefreshCw size={12} className={omrStatus === 'processing' ? 'animate-spin' : ''} /> Résolution estimée : 12 min
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Index de maîtrise</span>
            <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--warning-soft)', color: 'var(--warning)' }}><Activity size={18} /></div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>67.8 <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>pts</small></div>
            <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
              <Sparkles size={12} /> Cible de fin de cycle : 71.2 (▲)
            </div>
          </div>
        </div>

      </div>

      {/* ── MAIN CONTENT GRID (8-COL FOR VIZ, 4-COL FOR ACTION HUB) ── */}
      <div className="dashboard-grid">
        
        {/* Left Column: Mathematical Progress Analytics */}
        <div className="col-span-8 glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Niveaux d'assimilation et de vitesse académique</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualisation analytique de l'apprentissage cumulé f(t) et de sa dérivée f'(t)</p>
            </div>
            
            {/* Mathematical Toggles */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowDerivative(false)}
                className={`btn-outline ${!showDerivative ? 'selected' : ''}`}
                style={{ 
                  padding: '0.45rem 1rem', 
                  fontSize: '0.8rem', 
                  borderRadius: '8px',
                  background: !showDerivative ? 'var(--violet-soft)' : 'transparent',
                  borderColor: !showDerivative ? 'var(--violet)' : 'var(--border)',
                  color: !showDerivative ? 'var(--violet)' : 'var(--text-main)',
                  fontWeight: !showDerivative ? 800 : 500
                }}
              >
                Fonction f(t) principale
              </button>
              <button 
                onClick={() => setShowDerivative(true)}
                className={`btn-outline ${showDerivative ? 'selected' : ''}`}
                style={{ 
                  padding: '0.45rem 1rem', 
                  fontSize: '0.8rem', 
                  borderRadius: '8px',
                  background: showDerivative ? 'var(--violet-soft)' : 'transparent',
                  borderColor: showDerivative ? 'var(--violet)' : 'var(--border)',
                  color: showDerivative ? 'var(--violet)' : 'var(--text-main)',
                  fontWeight: showDerivative ? 800 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                Dérivée f'(t) (Variation)
              </button>
            </div>
          </div>

          <div style={{ height: '320px', width: '100%', direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Base f(t) gradient */}
                  <linearGradient id="colorFt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E2B874" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#E2B874" stopOpacity={0}/>
                  </linearGradient>
                  {/* Derivative f'(t) gradient */}
                  <linearGradient id="colorFprime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--violet)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--violet)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#E2B874" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                {showDerivative && (
                  <YAxis yAxisId="right" orientation="right" stroke="var(--violet)" fontSize={11} tickLine={false} axisLine={false} domain={[-5, 15]} />
                )}
                <Tooltip content={<CustomTooltip />} />
                
                {/* Main spline f(t) */}
                <Area 
                  type="monotone" 
                  yAxisId="left"
                  dataKey="f_t" 
                  name="Niveau f(t)"
                  stroke="#E2B874" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorFt)" 
                />
                
                {/* Derivative f'(t) */}
                {showDerivative && (
                  <Area 
                    type="monotone" 
                    yAxisId="right"
                    dataKey="f_prime_t" 
                    name="Taux f'(t)"
                    stroke="var(--violet)" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorFprime)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E2B874' }}></div>
              <span>f(t) : Niveau d'assimilation mathématique global (Intégrale de performance)</span>
            </div>
            {showDerivative && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px dashed var(--violet)' }}></div>
                <span>f'(t) : Vitesse d'apprentissage (Dérivée temporelle du niveau)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Action Hub */}
        <div className="col-span-4 glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Centre de décision</h3>
            <span style={{ background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 850, padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
              {actionItems.length} alertes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {actionItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-subtle)', padding: '2rem 0' }}>
                <CheckCircle size={36} color="var(--emerald)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Toutes les tâches sont résolues !</span>
                <span style={{ fontSize: '0.75rem' }}>Aucune action humaine n'est requise.</span>
              </div>
            ) : (
              actionItems.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '14px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Severity Badge */}
                  <span style={{ 
                    position: 'absolute', 
                    right: '1rem', 
                    top: '1rem', 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: item.severity === 'high' ? 'var(--danger)' : item.severity === 'medium' ? 'var(--warning)' : 'var(--emerald)'
                  }}></span>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.title}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#E2B874', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Élève : {item.student}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                        {item.details}
                      </p>
                      
                      {/* Action buttons inside item */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {item.type === 'omr' && (
                          <button 
                            className="btn"
                            onClick={() => {
                              navigate('/scanner');
                            }}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            <Camera size={12} /> Résoudre conflit
                          </button>
                        )}
                        {item.type === 'parent' && (
                          <button 
                            className="btn"
                            onClick={() => {
                              alert(`Appel téléphonique au tuteur de : ${item.student}`);
                              handleResolve(item.id);
                            }}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'linear-gradient(135deg, var(--emerald) 0%, #047857 100%)' }}
                          >
                            <Phone size={12} /> Appeler
                          </button>
                        )}
                        {item.type === 'code' && (
                          <button 
                            className="btn"
                            onClick={() => {
                              navigate('/admin/settings');
                            }}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            Valider reçu
                          </button>
                        )}
                        <button 
                          className="btn-outline" 
                          onClick={() => handleResolve(item.id)}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--bg-hover)' }}
                        >
                          Ignorer
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <span style={{ position: 'absolute', right: '1rem', bottom: '0.8rem', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── REAL DATABASE STATS ROW ── */}
      <h3 style={{ margin: '2rem 0 1rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Statistiques de la base de données (Supabase)</h3>
      <div className="dashboard-grid">
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon primary"><Users size={24} /></div>
          <div>
            <p className="stat-label">Total Élèves</p>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon accent"><CircleDollarSign size={24} /></div>
          <div>
            <p className="stat-label">Revenu Mensuel (MRR)</p>
            <div className="stat-value">{totalRevenue} Dh</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon warning"><TrendingUp size={24} /></div>
          <div>
            <p className="stat-label">Abonnés Premium</p>
            <div className="stat-value">{totalPremium}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon danger"><BookOpen size={24} /></div>
          <div>
            <p className="stat-label">Concours Actifs</p>
            <div className="stat-value">{exams.length}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
