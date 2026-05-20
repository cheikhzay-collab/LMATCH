import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, BrainCircuit, Play, Lock, Zap,
  BookOpen, Trophy, Clock, GraduationCap, FileDown, ScanLine
} from 'lucide-react';
import { generateAnswerSheet } from '../utils/generateAnswerSheet';
import ScanUploadModal from '../components/ScanUploadModal';

const SCHOOL_BRANDS_DEFAULTS = {
  'Médecine / Pharmacie': { emoji:'🏥', gradient:'linear-gradient(135deg,#B91C1C,#7F1D1D)', accent:'var(--danger)', accentSoft:'rgba(239,68,68,0.1)', tag:'Sciences de la Santé' },
  'ENSA':                  { emoji:'⚙️', gradient:'linear-gradient(135deg,#1D4ED8,#1E3A8A)', accent:'#3B82F6', accentSoft:'rgba(59,130,246,0.1)',  tag:'Ingénierie' },
  'ENSAM':                 { emoji:'🔩', gradient:'linear-gradient(135deg,#0F4C75,#1B262C)', accent:'#38BDF8', accentSoft:'rgba(56,189,248,0.1)',  tag:'Arts & Métiers' },
  'ENCG':                  { emoji:'📊', gradient:'linear-gradient(135deg,#065F46,#022C22)', accent:'var(--emerald)', accentSoft:'rgba(16,185,129,0.1)',  tag:'Commerce & Gestion' },
  'INPT':                  { emoji:'📡', gradient:'linear-gradient(135deg,#C2410C,#7C2D12)', accent:'#F97316', accentSoft:'rgba(249,115,22,0.1)',  tag:'Télécommunications' },
  'INSEA':                 { emoji:'📈', gradient:'linear-gradient(135deg,#0F766E,#134E4A)', accent:'#14B8A6', accentSoft:'rgba(20,184,166,0.1)',  tag:'Statistiques & Économية' },
  'Général (Prépa)':       { emoji:'📐', gradient:'linear-gradient(135deg,#6D28D9,#3B0764)', accent:'#A78BFA', accentSoft:'rgba(167,139,250,0.1)', tag:'Classes Préparatoires' },
};

const DEFAULT_BRAND = { emoji:'🎓', gradient:'linear-gradient(135deg,#4338CA,#1E1B4B)', accent:'#818CF8', accentSoft:'rgba(129,140,248,0.1)', tag:'Grande École' };

function getBrand(name, schoolBranding) {
  const custom = schoolBranding?.[name] || {};
  const base   = SCHOOL_BRANDS_DEFAULTS[name] || { ...DEFAULT_BRAND, tag: name };
  return { ...base, ...custom };
}

export default function SchoolExamsPage() {
  const { schoolName } = useParams();
  const school = decodeURIComponent(schoolName);
  const { exams, user, schoolBranding } = useAuth();
  const navigate = useNavigate();
  const [scanExam, setScanExam] = useState(null);

  const brand = getBrand(school, schoolBranding);
  const schoolExams = exams.filter(e => e.school === school && e.isActive !== false);

  const handleDownloadPDF = async (exam) => {
    await generateAnswerSheet(exam, user);
  };

  return (
    <div className="animate-fade-in">
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
          padding: '3rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Watermark Logo/Emoji Background */}
          <div style={{ 
            position:'absolute', right:'-5%', top:'-5%', 
            width:'320px', height:'320px', 
            opacity:0.15, transform:'rotate(-15deg)', 
            display:'flex', alignItems:'center', justifyContent:'center',
            pointerEvents:'none', zIndex:0
          }}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} style={{ width:'100%', height:'100%', objectFit:'contain' }} alt="" />
            ) : (
              <span style={{ fontSize:'240px' }}>{brand.emoji}</span>
            )}
          </div>

          <div style={{ position:'absolute', top:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:2 }}>
            <button
              onClick={() => navigate('/schools')}
              style={{
                background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
                color:'#fff', borderRadius:'10px', padding:'0.4rem 1rem',
                cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem',
                fontSize:'0.8rem', fontWeight:700, marginBottom:'2rem',
                backdropFilter:'blur(12px)', transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateX(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <ArrowLeft size={16} /> Retour aux écoles
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" style={{ width:100, height:100, objectFit:'contain', filter:'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }} />
              ) : (
                <span style={{ fontSize:'4.5rem', filter:'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}>
                  {brand.emoji}
                </span>
              )}
              
              <div>
                <div style={{
                  display:'inline-flex', alignItems:'center',
                  background:'rgba(255,255,255,0.15)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,0.3)',
                  padding:'0.25rem 0.875rem', borderRadius:'99px',
                  fontSize:'0.72rem', fontWeight:800, color:'#fff',
                  textTransform:'uppercase', letterSpacing:'0.12em',
                  marginBottom:'0.75rem',
                }}>
                  {brand.tag}
                </div>
                <h1 style={{ fontSize:'2.5rem', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.1 }}>
                  {school}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div style={{
          background:'var(--bg-card)', padding:'1rem 2rem',
          display:'flex', gap:'2rem', borderTop:'1px solid var(--border)',
        }}>
          {[
            { icon: BookOpen, label: 'Examens', value: schoolExams.length, color: brand.accent },
            { icon: Trophy,   label: 'QCM Total', value: schoolExams.reduce((s,e) => s + e.questions.length, 0), color: 'var(--warning)' },
            { icon: Zap,      label: 'Premium', value: schoolExams.filter(e => e.tier === 'premium').length, color: 'var(--violet)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{label} :</span>
              <span style={{ fontWeight:800, fontSize:'0.95rem', color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Exams List ── */}
      {schoolExams.length === 0 ? (
        <div style={{
          textAlign:'center', padding:'5rem 2rem',
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'1.5rem', color:'var(--text-muted)',
        }}>
          <GraduationCap size={52} style={{ opacity:0.25, margin:'0 auto 1.25rem' }} />
          <h3 style={{ marginBottom:'0.5rem', fontSize:'1.1rem' }}>Aucun examen pour le moment</h3>
          <p style={{ fontSize:'0.88rem' }}>
            L'administrateur n'a pas encore mis en ligne d'examens pour <strong>{school}</strong>.
          </p>
          <button className="btn" style={{ marginTop:'1.5rem' }} onClick={() => navigate('/dashboard')}>
            Retour au Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {schoolExams.map((exam, idx) => {
            const isLocked  = exam.tier === 'premium' && user?.tier !== 'premium';
            const qCount    = exam.questions.length;

            return (
              <div
                key={exam.id}
                className="exam-list-item"
                style={{
                  borderLeft: `4px solid ${brand.accent}`,
                }}
              >
                {/* Number badge */}
                <div style={{
                  width:44, height:44, borderRadius:'12px', flexShrink:0,
                  background: brand.accentSoft,
                  border:`1px solid ${brand.accent}33`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.1rem', fontWeight:900, color: brand.accent,
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
                    <h3 style={{ fontWeight:700, fontSize:'0.97rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {exam.name}
                    </h3>
                    {exam.tier === 'premium' && (
                      <span className="badge badge-pro"><Zap size={9} /> PRO</span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'1rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <Clock size={12} /> {exam.year}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <BookOpen size={12} /> {qCount} question{qCount > 1 ? 's' : ''}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      <BrainCircuit size={12} /> Algorithme SRS
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                  {isLocked ? (
                    <button className="btn-outline" disabled
                      style={{ opacity:0.5, cursor:'not-allowed', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                      <Lock size={14} /> Verrouillé
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn"
                        onClick={() => navigate(`/study?exam=${exam.id}`)}
                        title="Mode révision SRS"
                      >
                        <BrainCircuit size={15} /> SRS
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => navigate(`/exam?exam=${exam.id}`)}
                        title="Concours blanc chronométré"
                      >
                        <Play size={15} /> Blanc
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => handleDownloadPDF(exam)}
                        title="Télécharger la feuille de réponses PDF"
                        style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}
                      >
                        <FileDown size={15} /> PDF
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => setScanExam(exam)}
                        title="Scanner ma feuille remplie"
                        style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--violet)', borderColor:'var(--violet)' }}
                      >
                        <ScanLine size={15} /> Scanner
                      </button>
                      
                      {exam.pdfUrl && (
                        <a
                          href={exam.pdfUrl}
                          download={`${exam.name}.pdf`}
                          className="btn-outline"
                          title="Télécharger le sujet original PDF"
                          style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--emerald)', borderColor:'var(--emerald)' }}
                        >
                          <FileDown size={15} /> Sujet
                        </a>
                      )}
                    </>
                  )}
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
