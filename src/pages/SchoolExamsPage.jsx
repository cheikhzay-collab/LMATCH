import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, BrainCircuit, Play, Zap,
  BookOpen, Clock, GraduationCap, FileDown, ScanLine,
  Stethoscope, Cpu, Wrench, BarChart3, Wifi, TrendingUp, Compass
} from 'lucide-react';
import { generateAnswerSheet } from '../utils/generateAnswerSheet';
import ScanUploadModal from '../components/ScanUploadModal';

/* ─── Icon Mapping ─── */
const ICON_MAP = {
  'stethoscope': Stethoscope,
  'cpu': Cpu,
  'wrench': Wrench,
  'barchart': BarChart3,
  'wifi': Wifi,
  'trendingup': TrendingUp,
  'compass': Compass,
  'graduationcap': GraduationCap
};

const SCHOOL_BRANDS_DEFAULTS = {
  'Médecine / Pharmacie': { iconKey:'stethoscope', gradient:'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)', accent:'#EF4444', accentSoft:'rgba(239, 68, 68, 0.08)', tag:'Sciences de la Santé' },
  'ENSA':                  { iconKey:'cpu', gradient:'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', accent:'#3B82F6', accentSoft:'rgba(59, 130, 246, 0.08)',  tag:'Ingénierie' },
  'ENSAM':                 { iconKey:'wrench', gradient:'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)', accent:'#0EA5E9', accentSoft:'rgba(14, 165, 233, 0.08)',  tag:'Arts & Métiers' },
  'ENCG':                  { iconKey:'barchart', gradient:'linear-gradient(135deg, #10B981 0%, #047857 100%)', accent:'var(--emerald)', accentSoft:'rgba(16, 185, 129, 0.08)',  tag:'Commerce & Gestion' },
  'INPT':                  { iconKey:'wifi', gradient:'linear-gradient(135deg, #F97316 0%, #C2410C 100%)', accent:'#F97316', accentSoft:'rgba(249, 115, 22, 0.08)',  tag:'Télécommunications' },
  'INSEA':                 { iconKey:'trendingup', gradient:'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)', accent:'#14B8A6', accentSoft:'rgba(20, 184, 166, 0.08)',  tag:'Statistiques & Économie' },
  'Général (Prépa)':       { iconKey:'compass', gradient:'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', accent:'#8B5CF6', accentSoft:'rgba(139, 92, 246, 0.08)', tag:'Classes Préparatoires' },
};

const DEFAULT_BRAND = { iconKey:'graduationcap', gradient:'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)', accent:'#818CF8', accentSoft:'rgba(129, 140, 248, 0.08)', tag:'Grande École' };

function getBrand(name, schoolBranding) {
  const custom = schoolBranding?.[name] || {};
  const base   = SCHOOL_BRANDS_DEFAULTS[name] || { ...DEFAULT_BRAND, tag: name };
  return { ...base, ...custom };
}

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

export default function SchoolExamsPage() {
  const { schoolName } = useParams();
  const school = decodeURIComponent(schoolName);
  const { exams, user, schoolBranding } = useAuth();
  const navigate = useNavigate();
  const [scanExam, setScanExam] = useState(null);
  const isMobile = useIsMobile();

  const brand = getBrand(school, schoolBranding);
  const schoolExams = exams.filter(e => e.school === school && e.isActive !== false && e.isArchived !== true);

  const handleDownloadPDF = async (exam) => {
    await generateAnswerSheet(exam, user);
  };

  const IconComponent = ICON_MAP[brand.iconKey] || GraduationCap;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* ── School Hero Header ── */}
      <div style={{
        borderRadius: '1.5rem',
        overflow: 'hidden',
        marginBottom: '2rem',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Gradient Hero Section */}
        <div style={{
          background: brand.gradient,
          padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1.25rem, 4vw, 2.5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Watermark Logo Background */}
          <div style={{ 
            position:'absolute', right:'-5%', top:'-5%', 
            width:'320px', height:'320px', 
            opacity: brand.logoUrl ? 0.08 : 0.12, transform:'rotate(-15deg)', 
            display:'flex', alignItems:'center', justifyContent:'center',
            pointerEvents:'none', zIndex:0,
            color: '#fff'
          }}>
            {brand.logoUrl ? (
              <img 
                src={brand.logoUrl} 
                style={{ 
                  width:'100%', 
                  height:'100%', 
                  objectFit:'contain',
                  filter: 'grayscale(100%) contrast(0.8)' 
                }} 
                alt="" 
              />
            ) : (
              <div style={{ transform: 'scale(2.2)' }}>
                <IconComponent size={140} />
              </div>
            )}
          </div>

          <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:2 }}>
            <button
              onClick={() => navigate('/schools')}
              style={{
                background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
                color:'#fff', borderRadius:'10px', padding:'0.45rem 1.15rem',
                cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem',
                fontSize:'0.82rem', fontWeight:700, marginBottom:'2rem',
                backdropFilter:'blur(12px)', transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateX(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <ArrowLeft size={16} /> Retour aux écoles
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" style={{ width:88, height:88, objectFit:'contain', filter:'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }} />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                  color: '#fff'
                }}>
                  <IconComponent size={36} />
                </div>
              )}
              
              <div>
                <div style={{
                  display:'inline-flex', alignItems:'center',
                  background:'rgba(255,255,255,0.15)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,0.3)',
                  padding:'0.28rem 0.95rem', borderRadius:'99px',
                  fontSize:'0.72rem', fontWeight:800, color:'#fff',
                  textTransform:'uppercase', letterSpacing:'0.12em',
                  marginBottom:'0.75rem',
                }}>
                  {brand.tag}
                </div>
                <h1 style={{ fontSize:'2.5rem', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.1, margin: 0 }}>
                  {school}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Under Hero */}
        <div style={{
          background: 'var(--bg-card)',
          padding: isMobile ? '0.75rem 1rem' : '1.25rem 2rem',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'row',
          justifyContent: isMobile ? 'space-between' : 'flex-start',
          gap: isMobile ? '0.5rem' : '2.5rem',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: BookOpen, label: 'Concours', value: schoolExams.length, color: brand.accent },
            { icon: Zap,      label: 'Premium', value: schoolExams.filter(e => e.tier === 'premium').length, color: 'var(--violet)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: isMobile ? '1' : 'none', minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0
              }}>
                <Icon size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {schoolExams.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding:'4rem 2rem' }}>
          <div style={{
            width: '80px', height: '80px', background: brand.accentSoft, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            color: brand.accent,
          }}>
            <BookOpen size={36} />
          </div>
          <h3 style={{ marginBottom:'0.5rem', fontSize:'1.1rem' }}>Aucun examen pour le moment</h3>
          <p style={{ fontSize:'0.88rem', color: 'var(--text-muted)' }}>
            L'administrateur n'a pas encore mis en ligne d'examens pour <strong>{school}</strong>.
          </p>
          <button className="btn" style={{ marginTop:'1.5rem' }} onClick={() => navigate('/dashboard')}>
            Retour au Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {schoolExams.map((exam, idx) => {
            const qCount    = exam.questions.length;

            return (
              <div
                key={exam.id}
                className="exam-list-item"
                style={{
                  borderLeft: `4px solid ${brand.accent}`,
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: isMobile ? '1rem' : '1.25rem',
                  border: '1px solid var(--border)',
                  borderLeftWidth: '4px',
                  borderLeftColor: brand.accent,
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Left side: Badge & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  {/* Number badge */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                    background: brand.accentSoft,
                    border: `1px solid ${brand.accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 900, color: brand.accent,
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.97rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.35 }}>
                        {exam.name}
                      </h3>
                      {exam.tier === 'premium' && (
                        <span className="badge badge-pro" style={{ flexShrink: 0 }}><Zap size={9} /> PRO</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.76rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {exam.year}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <BookOpen size={11} /> {qCount} QCM
                      </span>
                      {!isMobile && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <BrainCircuit size={11} /> Algorithme SRS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center',
                      gap: isMobile ? '0.75rem' : '1rem',
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: isMobile ? 'stretch' : 'flex-end',
                    }}>
                      {/* 1. Primary Interactive Actions */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.4rem', 
                        flex: isMobile ? '1' : 'none',
                        justifyContent: 'stretch',
                      }}>
                        <button
                          className="btn"
                          onClick={() => navigate(`/study?exam=${exam.id}`)}
                          title="Mode révision SRS"
                          style={{ 
                            flex: 1, 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            minHeight: '36px',
                            borderRadius: '10px',
                            fontWeight: 700,
                          }}
                        >
                          <BrainCircuit size={14} /> SRS
                        </button>
                        <button
                          className="btn-outline"
                          onClick={() => navigate(`/exam?exam=${exam.id}`)}
                          title="Concours blanc chronométré"
                          style={{ 
                            flex: 1, 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            minHeight: '36px',
                            borderRadius: '10px',
                            fontWeight: 600,
                          }}
                        >
                          <Play size={14} /> Blanc
                        </button>
                      </div>

                      {/* Vertical Divider (Desktop Only) */}
                      {!isMobile && (
                        <div style={{ 
                          width: '1px', 
                          height: '24px', 
                          background: 'var(--border)', 
                          margin: '0 0.15rem',
                          alignSelf: 'center' 
                        }} />
                      )}

                      {/* 2. Secondary Utility & Resource Actions */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.4rem', 
                        flexWrap: 'wrap',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end',
                      }}>
                        <button
                          className="btn-outline"
                          onClick={() => {
                            if (exam.pdfUrl) {
                              window.open(exam.pdfUrl, '_blank');
                            } else {
                              import('../utils/generateExamPDF').then(({ generateSubjectHTML, openPrintWindow }) => {
                                const html = generateSubjectHTML(exam.name, exam.school, exam.year, exam.questions, { examId: exam.id });
                                openPrintWindow(html);
                              });
                            }
                          }}
                          title="Voir le sujet de l'examen"
                          style={{ 
                            flex: isMobile ? '1' : 'none', 
                            padding: '0.45rem 0.65rem', 
                            fontSize: '0.72rem', 
                            minHeight: '32px', 
                            color: 'var(--text-muted)',
                            borderRadius: '8px',
                          }}
                        >
                          <FileDown size={12} /> Sujet
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => {
                            import('../utils/generateExamPDF').then(({ generateCorrectionHTML, openPrintWindow }) => {
                              const html = generateCorrectionHTML(exam.name, exam.school, exam.year, exam.questions, { examId: exam.id });
                              openPrintWindow(html);
                            });
                          }}
                          title="Voir le corrigé de l'examen"
                          style={{ 
                            flex: isMobile ? '1' : 'none', 
                            padding: '0.45rem 0.65rem', 
                            fontSize: '0.72rem', 
                            minHeight: '32px', 
                            color: 'var(--text-muted)',
                            borderRadius: '8px',
                          }}
                        >
                          <FileDown size={12} /> Corrigé
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => handleDownloadPDF(exam)}
                          title="Télécharger la grille de réponse OMR"
                          style={{ 
                            flex: isMobile ? '1' : 'none', 
                            padding: '0.45rem 0.65rem', 
                            fontSize: '0.72rem', 
                            minHeight: '32px', 
                            color: 'var(--text-muted)',
                            borderRadius: '8px',
                          }}
                        >
                          <FileDown size={12} /> Grille
                        </button>

                        <button
                          className="btn-outline"
                          onClick={() => setScanExam(exam)}
                          title="Scanner ma feuille remplie"
                          style={{ 
                            flex: isMobile ? '1' : 'none', 
                            padding: '0.45rem 0.65rem', 
                            fontSize: '0.72rem', 
                            minHeight: '32px', 
                            color: 'var(--violet)', 
                            borderColor: 'rgba(113, 109, 242, 0.25)', 
                            background: 'var(--violet-soft)', 
                            borderRadius: '8px',
                          }}
                        >
                          <ScanLine size={12} /> Scanner
                        </button>
                      </div>
                    </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scan Upload Modal */}
      {scanExam && (
        <ScanUploadModal
          exam={scanExam}
          onClose={() => setScanExam(null)}
          onSRSLaunch={() => navigate(`/study?exam=${scanExam.id}`)}
        />
      )}
    </div>
  );
}
