import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Layout from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';
import StudyMode from './pages/StudyMode';
import AdminOverview from './pages/AdminOverview';
import AdminExams from './pages/AdminExams';
import AdminUsers from './pages/AdminUsers';
import AdminUpload from './pages/AdminUpload';
import AdminSettings from './pages/AdminSettings';
import MockExamMode from './pages/MockExamMode';
import SchoolsPage from './pages/SchoolsPage';
import SchoolExamsPage from './pages/SchoolExamsPage';
import AdminStudentDetail from './pages/AdminStudentDetail';
import AdminAIImport from './pages/AdminAIImport';
import AdminEbooks from './pages/AdminEbooks';
import AdminMarketing from './pages/AdminMarketing';

import OMRScannerPage from './pages/OMRScannerPage';
import SubscriptionPage from './pages/SubscriptionPage';
import RankingPage from './pages/RankingPage';
import AuthCallback from './pages/AuthCallback';

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
  return (
    <>
      <OAuthRedirectGuard />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          {/* Student Routes */}
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/schools/:schoolName" element={<SchoolExamsPage />} />
          <Route path="/study" element={<StudyMode />} />
          <Route path="/exam" element={<MockExamMode />} />
          <Route path="/scanner" element={<OMRScannerPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminOverview />} />
          <Route path="/admin/exams" element={<AdminExams />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminStudentDetail />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/admin/ai-import" element={<AdminAIImport />} />
          <Route path="/admin/ebooks" element={<AdminEbooks />} />
          <Route path="/admin/marketing" element={<AdminMarketing />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

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
