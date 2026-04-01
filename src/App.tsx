import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { AlertProvider } from './components/alert';
import { useAuthStore } from './stores/authStore';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyPage from './pages/auth/VerifyPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LandingPage from './pages/landing/LandingPage';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';

import { Dashboard } from './pages/dashboard/Dashboard';
import { GroupManagement } from './pages/groups/GroupManagement';
import { UserManagement } from './pages/users/UserManagement';
import { ActivityLogs } from './pages/dashboard/ActivityLogs';
import { GroupDetails } from './pages/groups/GroupDetails';

import { DocumentsPage } from './pages/documents/DocumentsPage';
import ChatPage from './pages/chat/ChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import OrgSettingsPage from './pages/profile/OrgSettingsPage';

import './index.css';

const ForbiddenPage = () => (
  <div className="p-8 text-destructive font-display font-black uppercase tracking-widest">
    403 - Forbidden Access Denied
  </div>
);

const PrivateRoute = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const LoginRoute = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Navigate to="/dashboard" replace /> : <LoginPage />;
};

const SignupRoute = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Navigate to="/dashboard" replace /> : <SignupPage />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AlertProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/signup" element={<SignupRoute />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<RoleProtectedRoute requiredOrgRole="COMPANY_ADMIN" />}>
                  <Route path="/org-settings" element={<OrgSettingsPage />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredAnyGroupAdmin />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredWorkspaceMember />}>
                  <Route path="/groups" element={<GroupManagement />} />
                  <Route path="/groups/:id" element={<GroupDetails />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredCapability="ADMIN_DASHBOARD_VIEW" />}>
                  <Route path="/activity" element={<ActivityLogs />} />
                </Route>

                <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </AlertProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
