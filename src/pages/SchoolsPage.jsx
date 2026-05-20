import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, BookOpen, ChevronRight, Search,
  Plus, Pencil, Trash2, X, Check, AlertTriangle, Upload, ImageOff,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

/* ─── School Brand Registry ─────────────────────────────────────── */
const SCHOOL_BRANDS = {
  'Médecine / Pharmacie': {
    emoji: '🏥', tag: 'Sciences de la Santé',
    gradient: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
    glow: 'rgba(185, 28, 28, 0.35)', accent: 'var(--danger)', accentSoft: 'rgba(239,68,68,0.12)',
    desc: 'Médecine, Pharmacie, Chirurgie Dentaire — Annales officielles du Maroc.',
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'ENSA': {
    emoji: '⚙️', tag: 'Ingénierie',
    gradient: 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)',
    glow: 'rgba(29, 78, 216, 0.35)', accent: '#3B82F6', accentSoft: 'rgba(59,130,246,0.12)',
    desc: 'École Nationale des Sciences Appliquées — concours CNC & autres.',
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'ENSAM': {
    emoji: '🔩', tag: 'Arts & Métiers',
    gradient: 'linear-gradient(135deg, #0F4C75 0%, #1B262C 100%)',
    glow: 'rgba(15, 76, 117, 0.4)', accent: '#38BDF8', accentSoft: 'rgba(56,189,248,0.12)',
    desc: "École Nationale Supérieure d'Arts et Métiers — sciences de l'ingénieur.",
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'ENCG': {
    emoji: '📊', tag: 'Commerce & Gestion',
    gradient: 'linear-gradient(135deg, #065F46 0%, #022C22 100%)',
    glow: 'rgba(6, 95, 70, 0.35)', accent: 'var(--emerald)', accentSoft: 'rgba(16,185,129,0.12)',
    desc: "École Nationale de Commerce et de Gestion — commerce, finance, management.",
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'INPT': {
    emoji: '📡', tag: 'Télécommunications',
    gradient: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)',
    glow: 'rgba(194, 65, 12, 0.35)', accent: '#F97316', accentSoft: 'rgba(249,115,22,0.12)',
    desc: "Institut National des Postes et Télécommunications — réseaux, systèmes.",
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'INSEA': {
    emoji: '📈', tag: 'Statistiques & Économie',
    gradient: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
    glow: 'rgba(15, 118, 110, 0.35)', accent: '#14B8A6', accentSoft: 'rgba(20,184,166,0.12)',
    desc: "Institut National de Statistique et d'Économie Appliquée.",
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
  'Général (Prépa)': {
    emoji: '📐', tag: 'Classes Préparatoires',
    gradient: 'linear-gradient(135deg, #6D28D9 0%, #3B0764 100%)',
    glow: 'rgba(109, 40, 217, 0.35)', accent: '#A78BFA', accentSoft: 'rgba(167,139,250,0.12)',
    desc: "MPSI, PCSI, TSI — Préparation générale aux grandes écoles marocaines.",
    scoring: { correct: 1, wrong: -0.25, empty: 0 }
  },
};

const DEFAULT_BRAND = {
  emoji: '🎓', tag: 'Grande École',
  gradient: 'linear-gradient(135deg, #4338CA 0%, #1E1B4B 100%)',
  glow: 'rgba(67, 56, 202, 0.35)', accent: '#818CF8', accentSoft: 'rgba(129,140,248,0.12)',
  desc: 'Concours nationaux — Annales et QCM officiels.',
  scoring: { correct: 1, wrong: -0.25, empty: 0 }
};

const EMOJI_PALETTE = [
  '🎓','🏥','⚙️','🔩','📊','📡','📈','📐','🔬','🧬','💡','🖥️',
  '🏗️','✈️','🌍','🔭','📚','🧪','🏛️','⚡','🌱','🎯','💻','🔐',
  '🧠','🏆','🎖️','🌟','🔑','📋','🗺️','🌐','🏄','🎨','🔧','🛡️',
];

const GRADIENT_PALETTE = [
  { label:'Ciel',     value:'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', dot:'#0ea5e9' },
  { label:'Menthe',   value:'linear-gradient(135deg, #10b981 0%, #34d399 100%)', dot:'var(--emerald)' },
  { label:'Pêche',    value:'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', dot:'var(--warning)' },
  { label:'Rose',     value:'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', dot:'#ec4899' },
  { label:'Violet',   value:'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', dot:'#8b5cf6' },
  { label:'Indigo',   value:'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', dot:'var(--violet)' },
  { label:'Corail',   // New addition
    value:'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)', dot:'#f43f5e' },
  { label:'Émeraude', 
    value:'linear-gradient(135deg, #059669 0%, #10b981 100%)', dot:'var(--emerald)' },
  { label:'Or', 
    value:'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', dot:'var(--warning)' },
];

function getBrand(name, schoolBranding) {
  const custom = schoolBranding?.[name] || {};
  const base   = SCHOOL_BRANDS[name] || { ...DEFAULT_BRAND, tag: name };
  return { ...base, ...custom };
}

/* ─── Edit Modal ─────────────────────────────────────────────────── */
function EditModal({ school, brand, onSave, onClose }) {
  const [name,     setName]     = useState(school);
  const [emoji,    setEmoji]    = useState(brand.emoji);
  const [gradient, setGradient] = useState(brand.gradient);
  const [tag,      setTag]      = useState(brand.tag);
  const [logoUrl,  setLogoUrl]  = useState(brand.logoUrl || null);
  const [scoring,  setScoring]  = useState(brand.scoring || { correct: 1, wrong: -0.25, empty: 0 });
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(15, 23, 42, 0.75)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'1.75rem', width:'100%', maxWidth:640,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
        animation:'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Header */}
        <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--bg-card)', zIndex:10 }}>
          <div>
            <h3 style={{ fontWeight:900, fontSize:'1.25rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
              <Pencil size={20} color="var(--violet)" /> Configurer l'Établissement
            </h3>
            <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>Personnalisez l'identité et les règles de calcul.</p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ borderRadius:'12px' }}><X size={20} /></button>
        </div>

        <div style={{ padding:'2rem' }}>
          
          {/* Section 1: Identité */}
          <div className="school-modal-grid" style={{ gap:'1.5rem', marginBottom:'2rem' }}>
            <div className="input-group">
              <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontWeight:700, marginBottom:'0.6rem', fontSize:'0.82rem' }}>
                <BookOpen size={14} /> Nom de l'école
              </label>
              <input className="input-control" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: ENSA Agadir..." />
            </div>
            <div className="input-group">
              <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontWeight:700, marginBottom:'0.6rem', fontSize:'0.82rem' }}>
                <Search size={14} /> Filière / Spécialité
              </label>
              <input className="input-control" value={tag} onChange={e => setTag(e.target.value)} placeholder="Ex: Ingénierie..." />
            </div>
          </div>

          {/* Preview Card */}
          <div style={{ borderRadius:'1.25rem', overflow:'hidden', marginBottom:'2rem', border:'1px solid var(--border)', background:'var(--bg-glass)' }}>
             <div style={{ background: gradient, padding:'1.25rem 1.75rem', display:'flex', alignItems:'center', gap:'1.25rem' }}>
               {logoUrl ? (
                 <div style={{ width:60, height:60, borderRadius:'14px', background:'rgba(255,255,255,0.15)', padding:'5px', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(0,0,0,0.2)' }}>
                   <img src={logoUrl} alt="logo" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
                 </div>
               ) : (
                 <div style={{ fontSize:'2.8rem', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{emoji}</div>
               )}
               <div>
                 <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.15em' }}>Aperçu de la carte</p>
                 <h4 style={{ color:'#fff', fontWeight:900, fontSize:'1.2rem', textShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>{name || "Établissement"}</h4>
               </div>
             </div>
          </div>

          {/* Logo & Emoji Section */}
          <div style={{ marginBottom:'2.5rem' }}>
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <h5 style={{ fontWeight:800, fontSize:'0.88rem' }}>🎨 Identité Visuelle</h5>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn" style={{ fontSize:'0.75rem', padding:'0.4rem 0.8rem' }}>
                   <Upload size={13} style={{ marginRight:'0.3rem' }} /> {logoUrl ? 'Changer' : 'Uploader logo'}
                </button>
             </div>
             <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />

             {!logoUrl ? (
               <div className="glass-panel" style={{ padding:'1rem', borderRadius:'1rem' }}>
                 <div style={{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'0.5rem', marginBottom:'1rem' }}>
                   {EMOJI_PALETTE.map(e => (
                     <button key={e} onClick={() => setEmoji(e)}
                       style={{
                         padding:'0.5rem', borderRadius:'10px', fontSize:'1.4rem', cursor:'pointer', border:'none',
                         background: emoji === e ? 'var(--violet)' : 'transparent',
                         transform: emoji === e ? 'scale(1.15)' : 'scale(1)',
                         transition:'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                       }}>
                       {e}
                     </button>
                   ))}
                 </div>
                 <input className="input-control" placeholder="Ou collez un emoji personnalisé..." style={{ fontSize:'0.85rem' }} value={emoji} onChange={e => setEmoji(e.target.value)} />
               </div>
             ) : (
               <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem', background:'var(--emerald-soft)', borderRadius:'1rem', border:'1px solid var(--emerald)33' }}>
                 <Check size={16} color="var(--emerald)" />
                 <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--emerald)', flex:1 }}>Logo personnalisé actif</span>
                 <button className="btn-ghost" onClick={() => setLogoUrl(null)} style={{ color:'var(--danger)', fontSize:'0.75rem' }}>Supprimer</button>
               </div>
             )}
          </div>

          {/* Theme Colors */}
          <div style={{ marginBottom:'2.5rem' }}>
            <h5 style={{ fontWeight:800, fontSize:'0.88rem', marginBottom:'1rem' }}>✨ Couleurs du thème</h5>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
              {GRADIENT_PALETTE.map(g => (
                <button key={g.label} onClick={() => setGradient(g.value)}
                  style={{
                    width:38, height:38, borderRadius:'50%', background: g.value,
                    border: gradient === g.value ? `3px solid #fff` : '2px solid transparent',
                    boxShadow: gradient === g.value ? `0 0 15px ${g.dot}, 0 0 0 2px var(--violet)` : 'none',
                    cursor:'pointer', transition:'all 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Scoring Section - Bento Style */}
          <div style={{ 
            padding:'1.25rem', background:'linear-gradient(135deg, var(--bg-card), var(--bg-glass))', 
            borderRadius:'1.25rem', border:'1px solid var(--border)',
            boxShadow:'inset 0 0 20px rgba(99, 102, 241, 0.05)',
            width: '100%'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.5rem' }}>
              <div style={{ width:28, height:28, borderRadius:'8px', background:'var(--violet-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Plus size={14} color="var(--violet)" />
              </div>
              <h5 style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text-main)' }}>Système de Notation (Points)</h5>
            </div>
            
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem' }}>
              {[
                { id:'correct', label:'Correct', color:'var(--emerald)', icon:<CheckCircle2 size={12}/> },
                { id:'wrong',   label:'Erreur',  color:'var(--danger)',  icon:<XCircle size={12}/> },
                { id:'empty',   label:'Oubli',   color:'var(--text-muted)', icon:<AlertCircle size={12}/> }
              ].map(field => (
                <div key={field.id} className="input-group" style={{ textAlign:'center' }}>
                  <label style={{ fontSize:'0.7rem', fontWeight:800, color:field.color, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem', marginBottom:'0.6rem' }}>
                    {field.icon} {field.label}
                  </label>
                  <input 
                    type="number" step="0.25" className="input-control" 
                    style={{ textAlign:'center', fontWeight:900, fontSize:'0.95rem', background:'rgba(0,0,0,0.2)', width:'100%', padding:'0.6rem' }}
                    value={scoring[field.id]} 
                    onChange={e => setScoring(s => ({ ...s, [field.id]: parseFloat(e.target.value) || 0 }))} 
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'1rem', fontStyle:'italic', textAlign:'center' }}>
               💡 Ces valeurs seront appliquées à tous les examens de cet établissement.
            </p>
          </div>

          {/* Footer Actions */}
          <div style={{ display:'flex', gap:'1rem', marginTop:'3rem' }}>
            <button className="btn-outline" onClick={onClose} style={{ flex:1, padding:'0.9rem' }}>Annuler</button>
            <button className="btn-emerald" onClick={() => onSave({ name, emoji, gradient, tag, logoUrl, scoring })}
              style={{ flex:2, padding:'0.9rem', fontSize:'1rem', fontWeight:900, boxShadow:'0 10px 25px var(--emerald-glow)' }}>
              <Check size={18} style={{ marginRight:'0.5rem' }} /> Enregistrer les modifications
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ───────────────────────────────────────── */
function DeleteModal({ school, onConfirm, onClose }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'1.5rem', padding:'2rem', width:'100%', maxWidth:400,
        boxShadow:'0 24px 64px rgba(0,0,0,0.5)', textAlign:'center',
        animation:'fadeIn 0.25s ease',
      }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--danger-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
          <AlertTriangle size={26} color="var(--danger)" />
        </div>
        <h3 style={{ fontWeight:800, marginBottom:'0.5rem' }}>Supprimer cette école ?</h3>
        <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'1.75rem' }}>
          L'école <strong>«{school}»</strong> et toutes ses configurations seront supprimées. Les examens liés resteront dans le système.
        </p>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
          <button className="btn-outline" onClick={onClose}>Annuler</button>
          <button onClick={onConfirm}
            style={{ background:'var(--danger)', color:'#fff', border:'none', padding:'0.7rem 1.5rem', borderRadius:'var(--radius-md)', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', fontFamily:'inherit' }}>
            <Trash2 size={15} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── School Card ───────────────────────────────────────────────── */
function SchoolCard({ school, examCount, brand, isAdmin, onEdit, onDelete, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ all:'unset', cursor:'pointer', display:'block', width:'100%' }}
      >
        <div style={{
          borderRadius:'1.5rem', overflow:'hidden',
          border:`1px solid ${hovered ? brand.accent + '55' : 'var(--border)'}`,
          background:'var(--bg-card)',
          boxShadow: hovered ? `0 12px 48px ${brand.glow}, 0 2px 8px rgba(0,0,0,0.15)` : 'var(--shadow-card)',
          transform: hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
          transition:'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Gradient header */}
          <div style={{ background: brand.gradient, padding:'2rem 1.75rem 1.5rem', position:'relative', overflow:'hidden' }}>
            
            {/* Watermark Logo/Emoji Background */}
            <div style={{ 
              position:'absolute', right:'-5%', top:'5%', 
              width:'180px', height:'180px', 
              opacity:0.22, transform: hovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(-12deg) scale(1)', 
              transition:'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none', zIndex:0
            }}>
              {brand.logoUrl ? (
                <img src={brand.logoUrl} style={{ width:'100%', height:'100%', objectFit:'contain' }} alt="" />
              ) : (
                <span style={{ fontSize:'130px' }}>{brand.emoji}</span>
              )}
            </div>

            <div style={{ position:'absolute', top:-30, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
            
            <div style={{ position:'relative', zIndex:1 }}>
              {brand.logoUrl ? (
                <img 
                  src={brand.logoUrl} 
                  alt="" 
                  style={{ 
                    width:72, height:72, objectFit:'contain', 
                    marginBottom:'1rem', 
                    filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.3))', 
                    transition:'all 0.3s', 
                    transform: hovered ? 'translateY(-4px) scale(1.05)' : 'none' 
                  }} 
                />
              ) : (
                <div style={{ fontSize:'3.2rem', marginBottom:'0.75rem', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.3))', transition:'all 0.3s', transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', display:'inline-block' }}>
                  {brand.emoji}
                </div>
              )}
              <div style={{ display:'inline-block', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.25)', padding:'0.2rem 0.75rem', borderRadius:'99px', fontSize:'0.68rem', fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {brand.tag}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:'1.25rem 1.75rem' }}>
            <h3 style={{ fontSize:'1.05rem', fontWeight:800, marginBottom:'0.4rem', color:'var(--text-main)' }}>{school}</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', lineHeight:1.6, marginBottom:'1rem' }}>{brand.desc}</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', background: brand.accentSoft, color: brand.accent, padding:'0.28rem 0.75rem', borderRadius:'99px', fontSize:'0.78rem', fontWeight:700, border:`1px solid ${brand.accent}33` }}>
                <BookOpen size={12} />
                {examCount > 0 ? `${examCount} examen${examCount > 1 ? 's' : ''}` : 'Bientôt'}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', color: hovered ? brand.accent : 'var(--text-subtle)', fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s', transform: hovered ? 'translateX(4px)' : 'translateX(0)' }}>
                Voir <ChevronRight size={15} />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Admin action buttons — overlay top-right */}
      {isAdmin && (
        <div style={{ position:'absolute', top:'0.875rem', right:'0.875rem', display:'flex', gap:'0.35rem', zIndex:10 }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            title="Modifier"
            style={{ width:30, height:30, borderRadius:'8px', border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Supprimer"
            style={{ width:30, height:30, borderRadius:'8px', border:'1px solid rgba(239,68,68,0.5)', background:'rgba(239,68,68,0.25)', backdropFilter:'blur(8px)', color:'#fca5a5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.45)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function SchoolsPage() {
  const { exams, schools, addSchool, removeSchool, renameSchool, schoolBranding, updateSchoolBranding, user } = useAuth();
  const navigate    = useNavigate();
  const isAdmin     = user?.role === 'admin';

  const [search,       setSearch]       = useState('');
  const [editTarget,   setEditTarget]   = useState(null);   // school name being edited
  const [deleteTarget, setDeleteTarget] = useState(null);   // school name being deleted
  const [addName,      setAddName]      = useState('');
  const [showAddForm,  setShowAddForm]  = useState(false);

  const allSchoolNames = Array.from(new Set([
    ...schools,
    ...exams.map(e => e.school).filter(Boolean),
  ]));

  const filtered = allSchoolNames.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const getExamCount = s => exams.filter(e => e.school === s).length;

  const handleEdit = (school) => setEditTarget(school);
  const handleDelete = (school) => setDeleteTarget(school);

  const handleSaveEdit = ({ name, emoji, gradient, tag, logoUrl, scoring }) => {
    const old = editTarget;
    updateSchoolBranding(name, { emoji, gradient, tag, logoUrl, scoring, desc: getBrand(old, schoolBranding).desc });
    if (name !== old) renameSchool(old, name);
    setEditTarget(null);
  };

  const handleConfirmDelete = () => {
    removeSchool(deleteTarget);
    setDeleteTarget(null);
  };

  const handleAdd = () => {
    if (addName.trim()) {
      addSchool(addName.trim());
      setAddName('');
      setShowAddForm(false);
    }
  };

  const editBrand = editTarget ? getBrand(editTarget, schoolBranding) : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.4rem' }}>
            <div style={{ width:40, height:40, borderRadius:'12px', background:'linear-gradient(135deg,var(--violet),var(--emerald))', display:'flex', alignItems:'center', justifyContent: 'center' }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:800, letterSpacing:'-0.02em', margin:0 }}>Grandes Écoles</h1>
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', margin:0 }}>
            {isAdmin
              ? 'Gérez les établissements, personnalisez leurs logos et couleurs.'
              : 'Choisissez votre école pour accéder aux annales et QCM officiels.'}
          </p>
        </div>

        {/* Admin: Add school button */}
        {isAdmin && (
          <button className="btn-emerald" onClick={() => setShowAddForm(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Plus size={16} /> Ajouter une école
          </button>
        )}
      </header>

      {/* Add school form (admin) */}
      {isAdmin && showAddForm && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom:'1.5rem', display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <input
            className="input-control"
            placeholder="Nom de la nouvelle école..."
            value={addName}
            onChange={e => setAddName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex:1, minWidth:200 }}
            autoFocus
          />
          <button className="btn-emerald" onClick={handleAdd} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Check size={15} /> Confirmer
          </button>
          <button className="btn-outline" onClick={() => { setShowAddForm(false); setAddName(''); }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search & Stats */}
      <div style={{ display:'flex', gap:'1rem', alignItems:'center', marginBottom:'2rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'0 0 320px' }}>
          <Search size={16} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', pointerEvents:'none' }} />
          <input className="input-control" placeholder="Rechercher une école..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:'2.5rem', width:'100%' }} />
        </div>
        <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.83rem', color:'var(--text-muted)' }}>
          <span><strong className="text-main">{allSchoolNames.length}</strong> établissements</span>
          <span><strong className="text-emerald">{exams.length}</strong> examens</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
          <GraduationCap size={48} style={{ opacity:0.25, margin:'0 auto 1rem' }} />
          <p>Aucune école trouvée pour «{search}»</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:'1.25rem' }}>
          {filtered.map(school => (
            <SchoolCard
              key={school}
              school={school}
              examCount={getExamCount(school)}
              brand={getBrand(school, schoolBranding)}
              isAdmin={isAdmin}
              onEdit={() => handleEdit(school)}
              onDelete={() => handleDelete(school)}
              onClick={() => navigate(`/schools/${encodeURIComponent(school)}`)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editTarget && editBrand && (
        <EditModal
          school={editTarget}
          brand={editBrand}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          school={deleteTarget}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

