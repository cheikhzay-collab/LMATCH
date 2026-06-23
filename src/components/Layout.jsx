import { useState, useEffect, Suspense } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import WhatsAppButton from './WhatsAppButton';
import { Crown, CheckCircle2 } from 'lucide-react';

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

// Routes that enter Focus Mode (no nav, full-screen)
const FOCUS_ROUTES = ['/exam', '/study'];

const LayoutLoadingFallback = () => (
  <div style={{
    width: '100%',
    height: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{ position: 'relative', width: '50px', height: '50px', marginBottom: '1rem' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: '3px solid rgba(113, 109, 242, 0.1)',
        borderTop: '3px solid var(--violet)',
        borderRight: '3px solid var(--emerald)',
        animation: 'spinLayout 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
      }} />
    </div>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes spinLayout {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}} />
  </div>
);

export default function Layout() {
  const { user, loading, upgradedPlan, setUpgradedPlan } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, #18181B 0%, #09090B 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {/* Animated glowing spinner */}
        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '1.5rem' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(113, 109, 242, 0.15)',
            borderTop: '3px solid var(--violet)',
            borderRight: '3px solid var(--emerald)',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
          }} />
          <div style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
              animation: 'pulse 1.8s ease-in-out infinite'
            }} />
          </div>
        </div>

        {/* Branding text */}
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #ffffff 30%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          animation: 'pulse 2.2s ease-in-out infinite'
        }}>
          L'CONQ
        </h2>
        
        <p style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
          margin: 0,
          fontWeight: 500
        }}>
          GIMA • Préparation Digitale
        </p>

        {/* Keyframe style injection for spin animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  const publicPaths = ['/schools', '/study/suites-numeriques', '/exam', '/study', '/scanner', '/scan'];
  const isPublicPath = publicPaths.some(p => 
    location.pathname === p || 
    location.pathname.startsWith('/schools/') || 
    location.pathname.startsWith('/exam') ||
    location.pathname.startsWith('/study') ||
    location.pathname.startsWith('/scanner') ||
    location.pathname.startsWith('/scan')
  );

  if (!user && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  const isFocusMode = FOCUS_ROUTES.some(r => location.pathname.startsWith(r)) || location.pathname.endsWith('/edit');

  if (isFocusMode) {
    return (
      <div className="focus-layout" style={{ minHeight: '100vh', width: '100vw', background: 'var(--bg-base)', color: 'var(--text-main)', transition: 'background 0.3s, color 0.3s', paddingTop: '1rem' }}>
        <Suspense fallback={<LayoutLoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <Sidebar />

      {/* Main content area */}
      <main className="main-content">
        <Suspense fallback={<LayoutLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <BottomNav />

      {/* Floating WhatsApp Support Button */}
      <WhatsAppButton />

      {/* ── Premium Upgrade Success Modal (Global) ── */}
      {upgradedPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          {/* Confetti container */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10001 }}>
            {Array.from({ length: 50 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 5;
              const duration = 3 + Math.random() * 4;
              const size = 6 + Math.random() * 8;
              const colors = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div 
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    background: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    opacity: 0.8,
                    animation: `confettiFall ${duration}s linear ${delay}s infinite`
                  }}
                />
              );
            })}
          </div>

          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
            zIndex: 10000
          }} />

          <div className="glass-panel animate-modal" style={{
            maxWidth: '480px', width: '100%',
            padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem', position: 'relative',
            background: 'rgba(20, 20, 25, 0.8)', border: '1px solid rgba(124, 58, 237, 0.3)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
            textAlign: 'center', zIndex: 10002
          }}>
            {/* Crown Icon */}
            <div className="upgrade-success-icon-container">
              <Crown size={42} color="#fff" />
            </div>

            {/* Congratulatory Text */}
            <h2 className="text-gradient" style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: '1.5rem 0 0.5rem 0'
            }}>
              Félicitations ! 👑
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#FFFFFF',
              fontWeight: 700,
              margin: 0
            }}>
              Vous êtes désormais Premium !
            </p>

            {/* Plan Details Summary */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.06)',
              border: '1px solid rgba(124, 58, 237, 0.15)',
              borderRadius: '16px',
              padding: '1.25rem',
              margin: '1.75rem 0',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abonnement activé</span>
                <span className="badge badge-pro" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>Premium</span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                {upgradedPlan.name}
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Durée d'accès : <strong style={{ color: '#FFFFFF' }}>{upgradedPlan.durationDays} jours</strong> complets
              </p>
            </div>

            {/* Unlocked Features Checkmarks */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              textAlign: 'left', marginBottom: '2.25rem', paddingLeft: '0.5rem'
            }}>
              {[
                "Accès illimité à toutes les archives (2010–2025)",
                "Astuces IA (Cheat codes) pour chaque QCM",
                "Simulateur de concours et Heatmaps des faiblesses"
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Action CTA Button */}
            <button 
              onClick={() => {
                setUpgradedPlan(null);
                navigate('/dashboard');
              }}
              className="btn"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--violet), #818cf8)',
                color: '#fff',
                borderRadius: '14px',
                border: 'none',
                boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              C'est parti ! 🚀
            </button>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .animate-modal {
              animation: modalScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .upgrade-success-icon-container {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--violet), #818cf8);
              display: flex;
              align-items: center;
              justifyContent: center;
              margin: 0 auto;
              animation: glowPulse 2.5s infinite ease-in-out, floatIcon 4s infinite ease-in-out;
              box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
            }
            @keyframes modalScale {
              0% { transform: scale(0.92); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes glowPulse {
              0% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
              50% { box-shadow: 0 0 35px rgba(124, 58, 237, 0.7), 0 0 20px rgba(16, 185, 129, 0.4); }
              100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
            }
            @keyframes floatIcon {
              0% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-8px) rotate(3deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
            @keyframes confettiFall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
