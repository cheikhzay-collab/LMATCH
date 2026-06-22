import { Suspense } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import WhatsAppButton from './WhatsAppButton';

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
  const { user, loading } = useAuth();
  const location = useLocation();

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
    </div>
  );
}
