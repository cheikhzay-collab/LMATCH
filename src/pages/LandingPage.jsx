import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Zap, CheckCircle2, Trophy, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

const features = [
  {
    icon: BrainCircuit,
    iconColor: 'var(--violet)',
    bg: 'var(--violet-soft)',
    title: 'Spaced Repetition (SRS)',
    desc: "L'algorithme analyse vos erreurs et vous fait réviser exactement ce qu'il faut, au moment où vous l'oubliez.",
  },
  {
    icon: Sparkles,
    iconColor: 'var(--warning)',
    bg: 'var(--warning-soft)',
    title: 'Astuces de Résolution IA',
    desc: 'Chaque question est accompagnée d\'un "cheat code" pour résoudre en moins de 60 secondes.',
  },
  {
    icon: Trophy,
    iconColor: 'var(--emerald)',
    bg: 'var(--emerald-soft)',
    title: 'Classement National',
    desc: 'Comparez vos performances en temps réel avec des milliers de bacheliers à travers le Maroc.',
  },
];

export default function LandingPage() {
  const { theme, toggleTheme, plans, user } = useAuth();
  const isLight = theme === 'light';

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-main)', transition: 'background 0.3s, color 0.3s' }}>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: isLight ? '0 1px 8px rgba(15,23,42,0.08)' : 'none',
        padding: '0 1.25rem', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>L'Conq</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isLight ? 'Mode sombre' : 'Mode clair'}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: isLight ? 'var(--violet)' : 'var(--warning)',
              cursor: 'pointer', padding: '6px 10px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {/* Hide Connexion on very small screens */}
          {user ? (
            <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="btn" style={{ textDecoration: 'none', padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
              Mon Espace <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost landing-nav-cta" style={{ textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                Connexion
              </Link>
              <Link to="/login" className="btn" style={{ textDecoration: 'none', padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
                Commencer <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: '900px', margin: '0 auto',
        padding: 'clamp(3.5rem, 10vw, 7rem) 1.25rem clamp(3rem, 8vw, 6rem)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--violet-soft)', border: '1px solid rgba(99,102,241,0.3)',
            padding: '0.35rem 1rem', borderRadius: '99px',
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--violet)',
            marginBottom: '2rem'
          }}>
            <Zap size={13} /> Propulsé par l'Intelligence Artificielle
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            La préparation aux concours,{' '}
            <span className="text-gradient">repensée pour 2026.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Médecine, ENSA, ENSAM. Transformez les annales en sessions interactives avec des astuces de résolution rapide et un algorithme SRS qui s'adapte à vous.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 0.5rem' }}>
            {user ? (
              <>
                <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="btn-emerald" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  <Zap size={18} /> Tableau de Bord
                </Link>
                <Link to="/schools" className="btn-outline" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  Parcourir les écoles <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-emerald" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  <Zap size={18} /> Démarrer gratuitement
                </Link>
                <Link to="/login" className="btn-outline" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.875rem 2rem' }}>
                  Voir la démo <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <p style={{ marginTop: '2rem', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            Rejoint par <strong className="text-muted">+2 000</strong> étudiants · Médecine · ENSA · ENSAM
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
            La méthode qui fonctionne
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Conçu par des étudiants admis, optimisé par l'IA.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {features.map(({ icon: Icon, iconColor, bg, title, desc }) => (
            <div key={title} className="glass-panel" style={{
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Icon size={24} color={iconColor} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.625rem', fontSize: '1rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.25rem 6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>Choisissez votre plan</h2>
          <p className="text-muted">Commencez gratuitement. Passez Pro quand vous êtes prêt.</p>
        </div>

        <div className="pricing-grid" style={{ alignItems: 'stretch' }}>
          {/* Freemium */}
          <div className="glass-panel" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            background: isLight ? '#ffffff' : 'var(--bg-card)',
            border: isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid var(--border)',
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.03)' : 'var(--shadow-card)',
          }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)' }}>Freemium</h3>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.25rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)' }}>
                0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>Dh/mois</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '1.5rem' }}>Pour tester la méthode.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem', padding: 0 }}>
                {[
                  { ok: true, label: 'Annales des 2 dernières années' },
                  { ok: true, label: 'Correction basique' },
                  { ok: false, label: 'Astuces IA (Cheat codes)' },
                  { ok: false, label: 'Classement National' },
                ].map(({ ok, label }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem', color: ok ? 'var(--text-main)' : 'var(--text-subtle)', textDecoration: ok ? 'none' : 'line-through' }}>
                    {ok ? <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} /> : <XIcon />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={user ? "/dashboard" : "/login"} className="btn-outline" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>
              {user ? "Accéder à mon espace" : "S'inscrire"}
            </Link>
          </div>

          {/* Dynamic Premium Plans */}
          {plans && plans.map((plan, index) => {
            const isRecommended = !!plan.isRecommended;
            const formatPriceLabel = (price, days) => {
              if (days === 30 || days === 31) return 'Dh/mois';
              if (days === 365) return 'Dh/an';
              return `Dh / ${days} j`;
            };

            return (
              <div 
                key={plan.id}
                className="glass-panel" 
                style={{
                  border: isRecommended ? '1.5px solid rgba(99,102,241,0.5)' : (isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid var(--border)'),
                  background: isRecommended 
                    ? (isLight 
                        ? 'linear-gradient(145deg, #ffffff, #f0f3ff)' 
                        : 'linear-gradient(145deg, rgba(99,102,241,0.1), rgba(15,23,42,0.85))')
                    : (isLight ? '#ffffff' : 'var(--bg-card)'),
                  boxShadow: isRecommended 
                    ? (isLight ? '0 15px 35px rgba(99,102,241,0.15)' : '0 15px 35px rgba(99,102,241,0.3)')
                    : (isLight ? '0 10px 30px rgba(0,0,0,0.03)' : 'var(--shadow-card)'),
                  position: 'relative', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transform: isRecommended ? 'scale(1.02)' : 'none',
                  zIndex: isRecommended ? 5 : 1
                }}
              >
                {/* Shimmer top for recommended */}
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                  }} />
                )}
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 800, margin: 0, color: isRecommended ? 'var(--violet)' : (isLight ? 'var(--navy-900)' : 'var(--text-main)') }}>
                      {plan.name}
                    </h3>
                    {isRecommended && (
                      <span className="badge badge-pro"><Zap size={9} fill="currentColor" /> RECOMMANDÉ</span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.25rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    {plan.price} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>{formatPriceLabel(plan.price, plan.durationDays)}</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '1.5rem' }}>
                    {plan.description || "Le pack complet pour la réussite."}
                  </p>
                  
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0 }}>
                    {plan.features && plan.features.map(label => (
                      <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem' }}>
                        <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                      </li>
                    ))}
                    
                    {plan.allowedSchools && plan.allowedSchools.length > 0 && (
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.85rem', borderTop: isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0, opacity: 0.7 }} />
                        <div>
                          <strong style={{ color: isLight ? 'var(--navy-800)' : 'var(--text-main)' }}>Écoles incluses :</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                            {plan.allowedSchools.join(', ')}
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                
                <Link to={user ? "/subscription" : "/login"} className="btn" style={{ 
                  width: '100%', 
                  textDecoration: 'none', 
                  justifyContent: 'center', 
                  background: isRecommended ? 'linear-gradient(135deg, var(--violet), #818cf8)' : undefined, 
                  marginTop: 'auto',
                  gap: '0.5rem',
                  fontWeight: 700
                }}>
                  <Zap size={15} fill={isRecommended ? "currentColor" : "none"} /> {user ? "S'abonner à l'offre" : "Passer Premium"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
