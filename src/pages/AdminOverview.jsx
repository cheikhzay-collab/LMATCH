import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, CircleDollarSign, TrendingUp, Camera, 
  Sparkles, AlertTriangle, CheckCircle, RefreshCw, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label, showDerivative }) => {
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
            <span>Moyenne f(t) :</span>
            <strong style={{ color: '#E2B874', fontSize: '1rem' }}>{payload[0].value}/100</strong>
          </p>
          {showDerivative && payload[1] && (
            <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
              <span>Vitesse f'(t) :</span>
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
  const totalRevenue = totalPremium * 99; // 99 DH per premium user
  const totalQuestions = exams.reduce((acc, exam) => acc + (exam.questions?.length || 0), 0);

  // AI-OMR Engine simulation
  const [omrStatus, setOmrStatus] = useState('processing'); // 'idle' or 'processing'
  const [omrProgress, setOmrProgress] = useState(28);

  useEffect(() => {
    let interval;
    if (omrStatus === 'processing') {
      interval = setInterval(() => {
        setOmrProgress(prev => {
          if (prev >= 60) {
            setOmrStatus('idle');
            return 60;
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
  const [selectedConcours, setSelectedConcours] = useState('Medecine'); // 'Medecine' or 'ENSA'
  const [showDerivative, setShowDerivative] = useState(false);

  const baseProgressionData = {
    Medecine: [
      { name: 'Semaine 1', f_t: 48 },
      { name: 'Semaine 2', f_t: 52 },
      { name: 'Semaine 3', f_t: 58 },
      { name: 'Semaine 4', f_t: 56 }, // light dip
      { name: 'Semaine 5', f_t: 64 },
      { name: 'Semaine 6', f_t: 72 },
      { name: 'Semaine 7', f_t: 79 },
      { name: 'Semaine 8', f_t: 82 },
    ],
    ENSA: [
      { name: 'Semaine 1', f_t: 42 },
      { name: 'Semaine 2', f_t: 46 },
      { name: 'Semaine 3', f_t: 50 },
      { name: 'Semaine 4', f_t: 54 },
      { name: 'Semaine 5', f_t: 60 },
      { name: 'Semaine 6', f_t: 59 }, // light dip
      { name: 'Semaine 7', f_t: 66 },
      { name: 'Semaine 8', f_t: 74 },
    ]
  };

  const progressionData = baseProgressionData[selectedConcours].map((d, idx, arr) => {
    const prev = arr[idx - 1];
    const rate = prev ? d.f_t - prev.f_t : 0;
    return {
      ...d,
      f_prime_t: rate
    };
  });

  // Action Hub state (Moroccan Concours / EdTech Specific)
  const [actionItems, setActionItems] = useState([
    {
      id: 'omr-1',
      type: 'omr',
      title: 'Alerte Double Marquage OMR',
      student: 'Yassine Kamel',
      details: 'Concours Blanc Médecine (Rabat 2025) - Question 14 à corriger manuellement (Confiance 45%).',
      time: 'Il y a 5 min',
      severity: 'high',
    },
    {
      id: 'parent-1',
      type: 'parent',
      title: 'Aide d\'Orientation demandée',
      student: 'Amal Alami',
      details: 'Demande de conseil d\'étude sur le module "Limites et Continuité" après chute d\'évaluation.',
      time: 'Il y a 20 min',
      severity: 'medium',
    },
    {
      id: 'code-1',
      type: 'code',
      title: 'Validation de paiement manuelle',
      student: 'Amine Ouadadi',
      details: 'Reçu CIH Bank importé pour un abonnement Premium L\'Conq (99 DH) à débloquer.',
      time: 'Il y a 1h',
      severity: 'high',
    },
    {
      id: 'diff-1',
      type: 'alert',
      title: 'Alerte IA : Sujet Difficile',
      student: 'Statistiques globales',
      details: 'Le taux de réussite sur le QCM "Électricité : Circuits RLC (ENSA)" est tombé sous 40%.',
      time: 'Il y a 3h',
      severity: 'low',
    }
  ]);

  const handleResolve = (id) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  };


  return (
    <div className="animate-fade-in" style={{ direction: 'ltr', textAlign: 'left', position: 'relative' }}>
      
      {/* Background glow blobs for true premium glassmorphism */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(113, 109, 242, 0.07) 0%, transparent 70%)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '-5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        top: '30%',
        right: '35%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(226, 184, 116, 0.04) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Main content wrapper above the background blobs */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ── HEADER WITH AI-OMR ENGINE STATUS ── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, var(--violet), var(--emerald))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(113, 109, 242, 0.2)' }}>
                <LayoutDashboard size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                L'<span style={{ background: 'linear-gradient(135deg, var(--violet), var(--emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CONQ</span> Concours • Administration
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Gestion et analyse prédictive des préparations aux concours marocains (Médecine, ENSA, ENSAM).</p>
          </div>

          {/* AI-OMR Status Hub */}
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
                  {omrStatus === 'processing' ? `Scanner OMR : Lot ${omrProgress}/60` : 'Lecteur OMR : En attente'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {omrStatus === 'processing' ? 'Lecture intelligente des copies...' : 'Cliquez pour lancer une simulation'}
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
              <Camera size={15} /> Scanner les copies
            </button>
          </div>
        </header>

        {/* ── PREDICTIVE KPI CARDS (4 COLUMNS) ── */}
        <div className="dashboard-grid stats-row" style={{ marginBottom: '2.5rem' }}>
          
          {/* Card 1: Registered candidates */}
          <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Candidats Préparés</span>
              <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--violet-soft)', color: 'var(--violet)' }}><Users size={18} /></div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{users.length} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>élèves</span></div>
              <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                <Sparkles size={12} /> Projection +250 à l'approche des concours
              </div>
            </div>
          </div>

          {/* Card 2: Scanned OMR papers */}
          <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Copies OMR Traitées</span>
              <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--emerald-soft)', color: 'var(--emerald)' }}><Camera size={18} /></div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>1,840 <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>fiches</span></div>
              <div style={{ fontSize: '0.78rem', color: '#E2B874', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                <Sparkles size={12} /> Taux d'exactitude IA : 99.4%
              </div>
            </div>
          </div>

          {/* Card 3: Action Hub Items */}
          <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Alertes et Contrôles</span>
              <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--danger-soft)', color: 'var(--danger)' }}><AlertTriangle size={18} /></div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{actionItems.length} en suspens</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                <RefreshCw size={12} className={omrStatus === 'processing' ? 'animate-spin' : ''} /> Diagnostic IA actif
              </div>
            </div>
          </div>

          {/* Card 4: Questions & QCM library */}
          <div className="col-span-3 glass-panel stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Banque de Questions QCM</span>
              <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'var(--warning-soft)', color: 'var(--warning)' }}><BookOpen size={18} /></div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{totalQuestions || 240} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>items</span></div>
              <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                <Sparkles size={12} /> {exams.length} concours référencés
              </div>
            </div>
          </div>

        </div>

        {/* ── MAIN CONTENT GRID: DATA VIZ & ACTION HUB ── */}
        <div className="dashboard-grid">
          
          {/* Left Column: Mathematical Progress Analytics */}
          <div className="col-span-8 glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Suivi de Taux d'Assimilation du Concours</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Moyenne globale aux examens blancs f(t) et accélération d'apprentissage f'(t)</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {/* Concours Switcher */}
                <select 
                  value={selectedConcours} 
                  onChange={e => setSelectedConcours(e.target.value)}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <option value="Medecine">Concours Médecine (FMPC)</option>
                  <option value="ENSA">Concours ENSA (Ingénierie)</option>
                </select>

                {/* Mathematical Toggles */}
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-glass)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <button 
                    onClick={() => setShowDerivative(false)}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px',
                      border: 'none',
                      background: !showDerivative ? 'var(--violet)' : 'transparent',
                      color: !showDerivative ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Courbe f(t)
                  </button>
                  <button 
                    onClick={() => setShowDerivative(true)}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px',
                      border: 'none',
                      background: showDerivative ? 'var(--violet)' : 'transparent',
                      color: showDerivative ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Dérivée f'(t)
                  </button>
                </div>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#E2B874" fontSize={11} tickLine={false} axisLine={false} domain={[30, 95]} />
                  {showDerivative && (
                    <YAxis yAxisId="right" orientation="right" stroke="var(--violet)" fontSize={11} tickLine={false} axisLine={false} domain={[-5, 15]} />
                  )}
                  <Tooltip content={<CustomTooltip showDerivative={showDerivative} />} />
                  
                  {/* Main spline f(t) */}
                  <Area 
                    type="monotone" 
                    yAxisId="left"
                    dataKey="f_t" 
                    name="Moyenne"
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
                      name="Vitesse"
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
                <span>f(t) : Niveau moyen d'acquisition de l'échantillon d'élèves (/100)</span>
              </div>
              {showDerivative && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px dashed var(--violet)' }}></div>
                  <span>f'(t) : Taux de progression hebdomadaire (variation d'assimilation)</span>
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
                  <span style={{ fontSize: '0.75rem' }}>Aucune intervention humaine requise.</span>
                </div>
              ) : (
                actionItems.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '1rem', 
                      background: 'var(--bg-glass)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '14px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
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
                          Cible : {item.student}
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
                              <Camera size={12} /> Résoudre
                            </button>
                          )}
                          {item.type === 'parent' && (
                            <button 
                              className="btn"
                              onClick={() => {
                                alert(`Appel téléphonique au tuteur de l'élève : ${item.student}`);
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
                                navigate('/admin/users');
                              }}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                            >
                              Activer Premium
                            </button>
                          )}
                          {item.type === 'alert' && (
                            <button 
                              className="btn"
                              onClick={() => {
                                alert(`Astuce publiée sur le tableau de bord des élèves !`);
                                handleResolve(item.id);
                              }}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'linear-gradient(135deg, var(--violet) 0%, #4f46e5 100%)' }}
                            >
                              <Sparkles size={12} /> Publier Astuce ⚡
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
      <h3 style={{ margin: '2.5rem 0 1.25rem 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>Indicateurs de la base de données réelle (Supabase)</h3>
      <div className="dashboard-grid">
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon primary"><Users size={24} /></div>
          <div>
            <p className="stat-label">Comptes Inscrits</p>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon accent"><CircleDollarSign size={24} /></div>
          <div>
            <p className="stat-label">Chiffre d'Affaires Actuel</p>
            <div className="stat-value">{totalRevenue} DH</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon warning"><TrendingUp size={24} /></div>
          <div>
            <p className="stat-label">Abonnements Premium</p>
            <div className="stat-value">{totalPremium}</div>
          </div>
        </div>
        <div className="col-span-3 glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-icon danger"><BookOpen size={24} /></div>
          <div>
            <p className="stat-label">Concours en Bibliothèque</p>
            <div className="stat-value">{exams.length}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
  );
}
