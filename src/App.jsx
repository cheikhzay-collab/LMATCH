import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Core pages kept statically for instant initial render
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Layout from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';

// Secondary/Admin pages lazy-loaded to reduce main bundle size
const StudyMode = lazy(() => import('./pages/StudyMode'));
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const AdminExams = lazy(() => import('./pages/AdminExams'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminUpload = lazy(() => import('./pages/AdminUpload'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const MockExamMode = lazy(() => import('./pages/MockExamMode'));
const SchoolsPage = lazy(() => import('./pages/SchoolsPage'));
const SchoolExamsPage = lazy(() => import('./pages/SchoolExamsPage'));
const AdminStudentDetail = lazy(() => import('./pages/AdminStudentDetail'));
const AdminAIImport = lazy(() => import('./pages/AdminAIImport'));
const AdminEbooks = lazy(() => import('./pages/AdminEbooks'));
const AdminExamEdit = lazy(() => import('./pages/AdminExamEdit'));
const SuitesNumeriquesPage = lazy(() => import('./pages/SuitesNumeriquesPage'));
const OMRScannerPage = lazy(() => import('./pages/OMRScannerPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const PrintView = lazy(() => import('./pages/PrintView'));

/**
 * OAuthRedirectGuard — detects when Supabase redirected back with a hash-based
 * access_token (i.e. #access_token=...) and navigates to /dashboard once
 * the AuthContext has populated the user object.
 * This handles the case where the Supabase redirect URL in the dashboard is the
 * Site URL (e.g. lconq.vercel.app) rather than /auth/callback.
 */
function OAuthRedirectGuard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=') && window.location.pathname !== '/auth/callback') {
      // Clear the hash from the address bar (cosmetic + security)
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  React.useEffect(() => {
    // If we landed here with a hash token AND now the user is authenticated,
    // redirect them to the dashboard
    const hash = window.location.hash;
    const alreadyCleared = !hash.includes('access_token=');
    const wasOAuthRedirect = sessionStorage.getItem('_oauth_in_progress') === '1';

    if (user && wasOAuthRedirect) {
      sessionStorage.removeItem('_oauth_in_progress');
      const pathname = window.location.pathname;
      if (pathname === '/' || pathname === '/login' || pathname === '/register') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  return null;
}

function AppContent() {
  const location = useLocation();

  React.useEffect(() => {
    const path = location.pathname;
    let title = "L'CONQ";

    if (path === '/') {
      title = "L'CONQ — Préparation aux Concours Grandes Écoles du Maroc";
    } else if (path === '/login') {
      title = "Connexion — L'CONQ";
    } else if (path === '/register') {
      title = "Inscription — L'CONQ";
    } else if (path === '/dashboard') {
      title = "Tableau de Bord — L'CONQ";
    } else if (path === '/subscription') {
      title = "Mon Abonnement — L'CONQ";
    } else if (path === '/schools') {
      title = "Choix des Écoles — L'CONQ";
    } else if (path.startsWith('/schools/')) {
      const school = decodeURIComponent(path.split('/')[2] || '');
      title = school ? `${school} — L'CONQ` : "Concours — L'CONQ";
    } else if (path === '/study/suites-numeriques') {
      title = "Fiche Interactive : Suites Numériques — L'CONQ";
    } else if (path === '/study') {
      title = "Mode Révision (SRS) — L'CONQ";
    } else if (path === '/exam') {
      title = "Examen Blanc Chronométré — L'CONQ";
    } else if (path === '/scanner') {
      title = "Scanner Intelligent OMR — L'CONQ";
    } else if (path === '/ranking') {
      title = "Classement National — L'CONQ";
    } else if (path === '/admin/dashboard') {
      title = "Admin : Vue d'ensemble — L'CONQ";
    } else if (path === '/admin/exams') {
      title = "Admin : Bibliothèque Concours — L'CONQ";
    } else if (path.startsWith('/admin/exams/') && path.endsWith('/edit')) {
      title = "Admin : Édition du Concours — L'CONQ";
    } else if (path === '/admin/users') {
      title = "Admin : Gestion des Élèves — L'CONQ";
    } else if (path.startsWith('/admin/users/')) {
      title = "Admin : Dossier de l'Élève — L'CONQ";
    } else if (path === '/admin/upload') {
      title = "Admin : Upload de Sujets — L'CONQ";
    } else if (path === '/admin/ai-import') {
      title = "Admin : Importateur de Sujets IA — L'CONQ";
    } else if (path === '/admin/ebooks') {
      title = "Admin : Générateur d'E-Books — L'CONQ";
    } else if (path === '/admin/settings') {
      title = "Admin : Paramètres Système — L'CONQ";
    }

    document.title = title;
  }, [location]);

  return (
    <>
      <OAuthRedirectGuard />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/print" element={<PrintView />} />
          
          {/* Protected Routes inside Layout */}
          <Route element={<Layout />}>
            {/* Student Routes */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/schools/:schoolName" element={<SchoolExamsPage />} />
            <Route path="/study" element={<StudyMode />} />
            <Route path="/study/suites-numeriques" element={<SuitesNumeriquesPage />} />
            <Route path="/exam" element={<MockExamMode />} />
            <Route path="/scanner" element={<OMRScannerPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route path="/admin/exams/:id/edit" element={<AdminExamEdit />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/admin/ai-import" element={<AdminAIImport />} />
            <Route path="/admin/ebooks" element={<AdminEbooks />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

const LoadingFallback = () => (
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
    <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '1.2rem' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: '3px solid rgba(113, 109, 242, 0.15)',
        borderTop: '3px solid var(--violet)',
        borderRight: '3px solid var(--emerald)',
        animation: 'spinApp 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
      }} />
    </div>
    <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0, fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
      L'CONQ
    </h3>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes spinApp {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}} />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
