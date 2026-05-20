import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

// Routes that enter Focus Mode (no nav, full-screen)
const FOCUS_ROUTES = ['/exam', '/study'];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFocusMode = FOCUS_ROUTES.some(r => location.pathname.startsWith(r));

  if (isFocusMode) {
    return (
      <div className="focus-layout">
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
