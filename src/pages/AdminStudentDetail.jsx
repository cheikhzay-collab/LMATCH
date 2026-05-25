import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Crown, User, Calendar, Target, Award, 
  BarChart3, Clock, CheckCircle2, XCircle, BookOpen, TrendingUp 
} from 'lucide-react';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, exams, plans, activateSubscription, cancelSubscription } = useAuth();
  
  const student = users.find(u => u.id === id);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('365');

  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  if (!student) return <div style={{ padding: '2rem' }}>Utilisateur non trouvé.</div>;

  // Mock stats for the student
  const performanceData = [
    { subject: 'Mathématiques', score: 85, color: 'var(--primary)' },
    { subject: 'Physique', score: 72, color: 'var(--accent)' },
    { subject: 'Chimie', score: 91, color: 'var(--emerald)' },
    { subject: 'SVT', score: 64, color: 'var(--warning)' },
  ];

  const recentHistory = [
    { exam: 'Concours Médecine Oujda', date: '15 Mai 2026', result: '18/20', status: 'pass' },
    { exam: 'ENSA Casablanca 2023', date: '12 Mai 2026', result: '14/20', status: 'pass' },
    { exam: 'Concours Pharmacie Rabat', date: '10 Mai 2026', result: '08/20', status: 'fail' },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Top Navigation ── */}
      <div style={{ marginBottom: '2rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <button 
          onClick={() => navigate('/admin/users')}
          style={{ background:'var(--bg-glass)', border:'1px solid var(--border)', borderRadius:'12px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-main)', cursor:'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin:0 }}>Dossier de l'élève</h2>
      </div>

      <div className="dashboard-grid">
        {/* ── LEFT COLUMN: Profile & Quick Stats ── */}
        <div className="col-span-4" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              background: 'linear-gradient(45deg, var(--primary), var(--accent))',
              margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'white',
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
            }}>
              {student.name.charAt(0)}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{student.name}</h2>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>
              <Calendar size={16} />
              <span>Membre depuis {student.joined || 'Mai 2026'}</span>
            </div>
            
            <div style={{ display:'flex', gap:'1rem' }}>
               <div style={{ flex:1, padding:'1rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Type de Compte</div>
                  <div style={{ fontWeight:800, color: student.tier === 'premium' ? 'var(--warning)' : 'var(--text-main)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                    {student.tier === 'premium' ? <><Crown size={16}/> PREMIUM</> : <><User size={16}/> GRATUIT</>}
                  </div>
               </div>
               <div style={{ flex:1, padding:'1rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Score Total</div>
                  <div style={{ fontWeight:800, color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                    <TrendingUp size={16} /> {student.xp} XP
                  </div>
               </div>
             </div>
          </div>

          {/* ── Subscription Management Card ── */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Crown size={20} color="var(--warning)" /> Abonnement de l'élève
            </h4>
            
            {student.subscription && student.subscription.status === 'active' ? (() => {
              const activePlan = plans.find(p => p.id === student.subscription.planId);
              const daysLeft = Math.ceil((new Date(student.subscription.endDate) - new Date()) / (1000 * 3600 * 24));
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Baque Active
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {activePlan ? activePlan.name : 'Abonnement Spécial'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Expire le : {new Date(student.subscription.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: daysLeft > 10 ? 'var(--emerald)' : 'var(--danger)', marginTop: '0.25rem' }}>
                      {daysLeft > 0 ? `${daysLeft} jours restants` : 'Expiré aujourd\'hui'}
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => cancelSubscription(student.id)}
                    className="btn-outline"
                    style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.5)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '0.6rem', fontSize: '0.85rem' }}
                  >
                    Résilier l'abonnement
                  </button>
                </div>
              );
            })() : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sélectionner une offre</label>
                  <select 
                    value={selectedPlanId} 
                    onChange={e => setSelectedPlanId(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} DH)</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Durée de l'activation</label>
                  <select 
                    value={selectedDuration} 
                    onChange={e => setSelectedDuration(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    <option value="30">30 Jours (1 Mois)</option>
                    <option value="90">90 Jours (3 Mois)</option>
                    <option value="180">180 Jours (6 Mois)</option>
                    <option value="365">365 Jours (1 An)</option>
                  </select>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => activateSubscription(student.id, selectedPlanId, selectedDuration)}
                  className="btn"
                  style={{ width: '100%', padding: '0.65rem', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  Activer l'abonnement
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h4 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <Target size={20} color="var(--primary)" /> Objectifs SRS
            </h4>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.9rem' }}>Cartes Apprises</span>
                <span style={{ fontWeight:800 }}>124</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.9rem' }}>En attente (Due)</span>
                <span style={{ fontWeight:800, color:'var(--warning)' }}>12</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.9rem' }}>Maîtrise Totale</span>
                <span style={{ fontWeight:800, color:'var(--emerald)' }}>85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Detailed Analytics ── */}
        <div className="col-span-8" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <BarChart3 size={24} color="var(--accent)" /> Maîtrise des Matières
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
              {performanceData.map(data => (
                <div key={data.subject}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', fontSize:'0.9rem' }}>
                    <span style={{ fontWeight:600 }}>{data.subject}</span>
                    <span style={{ fontWeight:900, color: data.color }}>{data.score}%</span>
                  </div>
                  <div style={{ height:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'5px' }}>
                    <div style={{ width:`${data.score}%`, height:'100%', background:data.color, borderRadius:'5px', boxShadow:`0 0 10px ${data.color}40` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <Clock size={24} color="var(--violet)" /> Historique des Examens
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {recentHistory.map((item, idx) => (
                <div key={idx} style={{ padding:'1.25rem', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
                    <div style={{ 
                      width:'48px', height:'48px', borderRadius:'12px', 
                      background: item.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: item.status === 'pass' ? 'var(--emerald)' : 'var(--danger)'
                    }}>
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{item.exam}</div>
                      <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>Passé le {item.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'1.25rem', fontWeight:900, color: item.status === 'pass' ? 'var(--emerald)' : 'var(--danger)' }}>
                      {item.result}
                    </div>
                    <div style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', color:'var(--text-muted)' }}>
                      {item.status === 'pass' ? 'RÉUSSI' : 'ÉCHEC'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
