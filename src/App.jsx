import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      
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
