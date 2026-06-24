import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllProgress, getMockHistory, getLoginLogs } from '../services/userService';
import { 
  ArrowLeft, Crown, User, Calendar, Target, 
  BarChart3, Clock, BookOpen, TrendingUp, Loader2,
  Phone, MapPin, FileDown, FileText
} from 'lucide-react';

const WhatsAppIcon = ({ size = 20, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    {...props}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.79 1.451 5.485.002 9.948-4.463 9.95-9.952.002-2.66-1.033-5.16-2.907-7.037-1.874-1.877-4.374-2.91-7.035-2.911-5.49 0-9.954 4.465-9.956 9.955-.001 1.707.447 3.376 1.3 4.883l-.995 3.637 3.737-.98c1.513.824 3.03 1.25 4.616 1.253zm8.382-3.41c-.226-.113-1.341-.662-1.55-.737-.207-.076-.358-.113-.507.113-.15.225-.578.737-.708.887-.13.15-.26.168-.486.056-.225-.113-.954-.352-1.817-1.122-.671-.598-1.124-1.337-1.255-1.563-.13-.225-.014-.347.1-.459.102-.102.226-.263.338-.395.113-.13.15-.225.226-.375.075-.15.038-.282-.019-.395-.056-.113-.508-1.224-.696-1.677-.183-.44-.37-.38-.507-.387-.13-.007-.28-.008-.43-.008-.15 0-.395.056-.602.282-.206.225-.79.771-.79 1.882 0 1.11.808 2.182.92 2.332.113.15 1.59 2.428 3.853 3.404.538.233.957.371 1.285.475.54.172 1.03.148 1.418.09.432-.064 1.34-.548 1.53-1.076.19-.527.19-.979.133-1.076-.057-.1-.207-.15-.433-.263z" />
  </svg>
);

const getWhatsAppLink = (phone) => {
  if (!phone) return '#';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '212' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+') && !cleaned.startsWith('212') && cleaned.length === 9) {
    cleaned = '212' + cleaned;
  }
  cleaned = cleaned.replace(/^\+/, '');
  return `https://wa.me/${cleaned}`;
};

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

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, plans, activateSubscription, cancelSubscription, deleteStudent } = useAuth();
  const isMobile = useIsMobile();
  
  const [isWaHovered, setIsWaHovered] = useState(false);
  
  const student = users.find(u => u.id === id || u.uid === id);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('365');
  
  const handleDeleteStudent = async () => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement l'élève "${student.name || 'cet étudiant'}" et toutes ses données associées (progression, historique des examens, etc.) ? Cette action est irréversible.`
    );
    if (!confirmDelete) return;

    try {
      await deleteStudent(student.id || student.uid);
      alert("L'élève a été supprimé avec succès.");
      navigate('/admin/users');
    } catch (e) {
      alert("Échec de la suppression de l'élève: " + (e.message || e));
    }
  };
  
  const [realHistory, setRealHistory] = useState([]);
  const [realProgress, setRealProgress] = useState({});
  const [realLoginLogs, setRealLoginLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [examTab, setExamTab] = useState('online');

  useEffect(() => {
    if (!student) return;

    const fetchStudentData = async () => {
      setLoadingStats(true);
      try {
        const uid = student.id || student.uid;
        const [historyData, progressData, logsData] = await Promise.all([
          getMockHistory(uid),
          getAllProgress(uid),
          getLoginLogs(uid)
        ]);
        setRealHistory(historyData || []);
        setRealProgress(progressData || {});
        setRealLoginLogs(logsData || []);
      } catch (e) {
        console.error('[Admin] Failed to load real student stats:', e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStudentData();
  }, [student]);

  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      const timer = setTimeout(() => {
        setSelectedPlanId(plans[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [plans, selectedPlanId]);

  if (!student) return <div style={{ padding: '2rem' }}>Utilisateur non trouvé.</div>;

  // ── Calculate real academic progression parameters ──
  const now = new Date();
  
  // 1. SRS Cards Count
  const cardsLearned = Object.keys(realProgress).length;
  
  // 2. SRS Cards Due
  const cardsDue = Object.values(realProgress).filter(c => {
    return c.nextReviewDate && new Date(c.nextReviewDate) <= now;
  }).length;
  
  // 3. Average Mastery based on stability / repetitions
  const totalCards = Object.values(realProgress).length;
  const cardsMastered = Object.values(realProgress).filter(c => c.repetitions >= 3).length;
  const averageMastery = totalCards > 0 ? Math.round((cardsMastered / totalCards) * 100) : 0;

  // 4. Calculate real performance by Concours School
  const schoolPerformance = {};
  realHistory.forEach(item => {
    if (!schoolPerformance[item.school]) {
      schoolPerformance[item.school] = { totalPct: 0, count: 0 };
    }
    schoolPerformance[item.school].totalPct += item.pct || 0;
    schoolPerformance[item.school].count += 1;
  });

  const colors = ['var(--primary)', 'var(--accent)', 'var(--warning)', 'var(--danger)'];
  const performanceData = Object.keys(schoolPerformance).map((schoolName, idx) => {
    const data = schoolPerformance[schoolName];
    const avg = Math.round(data.totalPct / data.count);
    return {
      subject: `Concours ${schoolName}`,
      score: avg,
      color: colors[idx % colors.length]
    };
  });

  // Default subject masteries if no mock tests were passed yet
  if (performanceData.length === 0) {
    performanceData.push(
      { subject: 'Mathématiques (Global)', score: 0, color: 'var(--primary)' },
      { subject: 'Physique-Chimie (Global)', score: 0, color: 'var(--accent)' },
      { subject: 'SVT (Global)', score: 0, color: 'var(--warning)' }
    );
  }

  // 5. Format real history items by type
  const onlineHistory = realHistory.filter(item => item.mode !== 'omr');
  const omrHistory = realHistory.filter(item => item.mode === 'omr');

  const formatHistoryItem = (item) => {
    const percentage = Math.round(item.pct || 0);
    const dateStr = item.date 
      ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : 'Récemment';
    return {
      exam: item.examName,
      date: dateStr,
      result: `${item.score}/${item.maxScore} (${percentage}%)`,
      status: percentage >= 50 ? 'pass' : 'fail',
      correctCount: item.correctCount,
      wrongCount: item.wrongCount,
      emptyCount: item.emptyCount
    };
  };

  const formattedOnlineHistory = onlineHistory.slice(0, 20).map(formatHistoryItem);
  const formattedOmrHistory = omrHistory.slice(0, 20).map(formatHistoryItem);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', direction: 'ltr', textAlign: 'left' }}>
      
      {/* ── Top Navigation ── */}
      <div style={{ marginBottom: '2rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <button 
          onClick={() => navigate('/admin/users')}
          aria-label="Retour à la liste des élèves"
          style={{ background:'var(--bg-glass)', border:'1px solid var(--border)', borderRadius:'12px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-main)', cursor:'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin:0 }}>Dossier de l'élève</h2>
      </div>

      <div className="dashboard-grid">
        
        {/* ── LEFT COLUMN: Profile & Quick Stats ── */}
        <div className="col-span-4" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          
          {/* Profile Card */}
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              background: 'linear-gradient(45deg, var(--primary), var(--accent))',
              margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'white',
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
            }}>
              {student.name ? student.name.charAt(0) : 'U'}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {student.name || 'Étudiant'}
              {(() => {
                const isOnline = student.updatedAt && (new Date() - new Date(student.updatedAt) < 5 * 60 * 1000);
                return (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '99px',
                    background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.08)',
                    color: isOnline ? '#10B981' : '#9CA3AF',
                    border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(156, 163, 175, 0.15)'}`
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isOnline ? '#10B981' : '#9CA3AF',
                      boxShadow: isOnline ? '0 0 6px #10B981' : 'none'
                    }} />
                    {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                  </span>
                );
              })()}
            </h2>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', color:'var(--text-muted)', marginBottom:'1.5rem' }}>
              <Calendar size={16} />
              <span>Membre depuis {student.joined ? new Date(student.joined).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Mai 2026'}</span>
            </div>
            
            <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:'1rem' }}>
               <div style={{ flex: 1, padding:'1rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Type de Compte</div>
                  <div style={{ fontWeight:800, color: student.tier === 'premium' ? 'var(--warning)' : 'var(--text-main)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                    {student.tier === 'premium' ? <><Crown size={16}/> PREMIUM</> : <><User size={16}/> GRATUIT</>}
                  </div>
               </div>
               <div style={{ flex:1, padding:'1rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Score Total</div>
                  <div style={{ fontWeight:800, color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                    <TrendingUp size={16} /> {student.xp || 0} XP
                  </div>
               </div>
             </div>

              {/* Delete Student Section */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={handleDeleteStudent}
                  className="btn-outline"
                  style={{ 
                    width: '100%', 
                    borderColor: 'rgba(239, 68, 68, 0.4)', 
                    color: 'var(--danger)', 
                    background: 'rgba(239, 68, 68, 0.02)', 
                    padding: '0.65rem', 
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.02)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
                >
                  Supprimer l'élève
                </button>
              </div>
           </div>

          {/* ── Coordonnées de l'élève ── */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={20} color="var(--primary)" /> Coordonnées de l'élève
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Téléphone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
                  <Phone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Téléphone</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: student.phone ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                    {student.phone || 'Non renseigné'}
                  </div>
                </div>
              </div>

              {/* Ville */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--emerald-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}>
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ville</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: student.city ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                    {student.city || 'Non renseignée'}
                  </div>
                </div>
              </div>

              {/* École Ciblée */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                  <Target size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>École Ciblée</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: student.school ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                    {student.school || 'Non renseignée'}
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              {student.phone ? (
                <a 
                  href={getWhatsAppLink(student.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setIsWaHovered(true)}
                  onMouseLeave={() => setIsWaHovered(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: isWaHovered 
                      ? 'linear-gradient(135deg, #20ba5a 0%, #0e7569 100%)' 
                      : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: isWaHovered 
                      ? '0 6px 20px rgba(37, 211, 102, 0.4)' 
                      : '0 4px 12px rgba(37, 211, 102, 0.25)',
                    transform: isWaHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <WhatsAppIcon size={18} />
                  Contacter sur WhatsApp
                </a>
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-subtle)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'not-allowed',
                  }}
                >
                  <WhatsAppIcon size={18} style={{ opacity: 0.5 }} />
                  WhatsApp non disponible
                </div>
              )}
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
                    onClick={() => cancelSubscription(student.id || student.uid)}
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
                  onClick={() => activateSubscription(student.id || student.uid, selectedPlanId, selectedDuration)}
                  className="btn"
                  style={{ width: '100%', padding: '0.65rem', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  Activer l'abonnement
                </button>
              </div>
            )}
          </div>

          {/* ── SRS Objectifs ── */}
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h4 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <Target size={20} color="var(--primary)" /> Objectifs Mémorisation (SRS)
            </h4>
            
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                <Loader2 className="animate-spin" size={24} color="var(--primary)" />
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.9rem' }}>Fiches Apprises</span>
                  <span style={{ fontWeight:800 }}>{cardsLearned}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.9rem' }}>En attente de révision</span>
                  <span style={{ fontWeight:800, color:'var(--warning)' }}>{cardsDue}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.9rem' }}>Taux de Maîtrise</span>
                  <span style={{ fontWeight:800, color:'var(--emerald)' }}>{averageMastery}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Detailed Analytics ── */}
        <div className="col-span-8" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          
          {/* Subject / School Performance */}
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <BarChart3 size={24} color="var(--accent)" /> Maîtrise par Type de Concours
            </h3>
            
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
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
            )}
          </div>

          {/* Exam Result History */}
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={24} color="var(--violet)" /> Historique des Examens
              </h3>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                gap: '2px'
              }}>
                <button
                  onClick={() => setExamTab('online')}
                  style={{
                    border: 'none',
                    background: examTab === 'online' ? 'var(--violet)' : 'transparent',
                    color: examTab === 'online' ? '#fff' : 'var(--text-muted)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Examens en Ligne
                </button>
                <button
                  onClick={() => setExamTab('omr')}
                  style={{
                    border: 'none',
                    background: examTab === 'omr' ? 'var(--violet)' : 'transparent',
                    color: examTab === 'omr' ? '#fff' : 'var(--text-muted)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Scans OMR (Papier)
                </button>
              </div>
            </div>
            
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              </div>
            ) : examTab === 'online' ? (
              formattedOnlineHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  Aucun examen blanc n'a été passé en ligne pour le moment.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {formattedOnlineHistory.map((item, idx) => (
                    <div key={idx} style={{ padding:'1.25rem', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:'1rem', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '1rem' : '0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', textAlign: 'left' }}>
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
                          <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>Date : {item.date}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'1.25rem', fontWeight:900, color: item.status === 'pass' ? 'var(--emerald)' : 'var(--danger)' }}>
                          {item.result}
                        </div>
                        <div style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', color:'var(--text-muted)' }}>
                          {item.status === 'pass' ? 'REÇU' : 'ÉCHEC'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              formattedOmrHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  Aucun scan OMR n'a été importé pour le moment.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {formattedOmrHistory.map((item, idx) => (
                    <div key={idx} style={{ padding:'1.25rem', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:'1rem', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '1rem' : '0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', textAlign: 'left' }}>
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
                          <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>Date : {item.date}</div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--emerald)', fontWeight: 800 }}>
                              {item.correctCount || 0} Corrects
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', fontWeight: 800 }}>
                              {item.wrongCount || 0} Incorrects
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontWeight: 800 }}>
                              {item.emptyCount || 0} Vides
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'1.25rem', fontWeight:900, color: item.status === 'pass' ? 'var(--emerald)' : 'var(--danger)' }}>
                          {item.result}
                        </div>
                        <div style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', color:'var(--text-muted)' }}>
                          {item.status === 'pass' ? 'REÇU' : 'ÉCHEC'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Historique des Téléchargements */}
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <FileDown size={24} color="var(--violet)" /> Historique des Téléchargements
            </h3>
            
            {!student.downloads || student.downloads.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucun téléchargement enregistré pour le moment.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {student.downloads.map((item, idx) => {
                  const dateObj = new Date(item.downloadedAt || item.date || new Date());
                  const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  
                  let TypeIcon = FileText;
                  let typeColor = 'var(--violet)';
                  let typeLabel = 'DOCUMENT';
                  
                  if (item.type === 'sujet') {
                    typeColor = 'var(--primary)';
                    typeLabel = 'SUJET';
                  } else if (item.type === 'corrige') {
                    typeColor = 'var(--emerald)';
                    typeLabel = 'CORRIGÉ';
                  } else if (item.type === 'grille') {
                    typeColor = 'var(--warning)';
                    typeLabel = 'GRILLE OMR';
                  } else if (item.type === 'lesson') {
                    typeColor = 'var(--accent)';
                    typeLabel = 'COURS';
                  } else if (item.type === 'report') {
                    typeColor = '#A78BFA';
                    typeLabel = 'RAPPORT';
                  }
                  
                  return (
                    <div key={idx} style={{ padding:'0.85rem 1.25rem', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:'0.75rem', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.5rem' : '0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', textAlign: 'left' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '8px', 
                          background: `${typeColor}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: typeColor
                        }}>
                          <TypeIcon size={18} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.title || 'Téléchargement'}</span>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: `${typeColor}15`,
                              color: typeColor
                            }}>
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{dateStr} à {timeStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Access Logs History */}
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ margin:'0 0 1.5rem 0', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <Clock size={24} color="var(--primary)" /> Historique des Connexions
            </h3>
            
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              </div>
            ) : realLoginLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucune connexion enregistrée.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {realLoginLogs.slice(0, 50).map((log, idx) => {
                  const dateObj = new Date(log.loggedAt);
                  const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id || idx} style={{ padding:'0.85rem 1.25rem', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:'0.75rem', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.5rem' : '0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', textAlign: 'left' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 8px var(--emerald)' }}></div>
                        <span style={{ fontWeight:700, fontSize:'0.9rem', color: 'var(--text-main)' }}>Connexion réussie</span>
                      </div>
                      <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', fontWeight: 600 }}>{dateStr} à {timeStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
