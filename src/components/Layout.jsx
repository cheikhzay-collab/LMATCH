import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

// Routes that enter Focus Mode (no nav, full-screen)
const FOCUS_ROUTES = ['/exam', '/study'];

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0D1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '1.1rem', fontWeight: 600 }}>Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFocusMode = FOCUS_ROUTES.some(r => location.pathname.startsWith(r)) || location.pathname.endsWith('/edit');

  if (isFocusMode) {
    return (
      <div className="focus-layout" style={{ minHeight: '100vh', width: '100vw', background: 'var(--bg-base)', color: 'var(--text-main)', transition: 'background 0.3s, color 0.3s' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <Sidebar />

      {/* Main content area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <BottomNav />
    </div>
  );
}
