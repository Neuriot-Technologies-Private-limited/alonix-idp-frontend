import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { AlertProvider } from './components/alert';
import { UploadToastPanel } from './components/ui/UploadToastPanel';
import { useAuthStore } from './stores/authStore';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import SetupPasswordPage from './pages/auth/SetupPasswordPage';
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
import BillingPage from './pages/billing/BillingPage';
import PricingPage from './pages/billing/PricingPage';
import ConnectorBrowserPage from './pages/connectors/ConnectorBrowserPage';

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

const isSearchUserOnly = (context: ReturnType<typeof useAuthStore.getState>['context']) =>
  context?.orgRole === 'MEMBER' && !(context.groups || []).some((g) => g.role === 'GROUP_ADMIN');

const getDefaultAuthedPath = (
  context: ReturnType<typeof useAuthStore.getState>['context']
) => (isSearchUserOnly(context) ? '/documents' : '/dashboard');

const LoginRoute = () => {
  const token = useAuthStore((state) => state.token);
  const context = useAuthStore((state) => state.context);
  return token ? <Navigate to={getDefaultAuthedPath(context)} replace /> : <LoginPage />;
};

const SignupRoute = () => {
  const token = useAuthStore((state) => state.token);
  const context = useAuthStore((state) => state.context);
  return token ? <Navigate to={getDefaultAuthedPath(context)} replace /> : <SignupPage />;
};

const SetupPasswordRoute = () => {
  const token = useAuthStore((state) => state.token);
  const context = useAuthStore((state) => state.context);
  return token ? <Navigate to={getDefaultAuthedPath(context)} replace /> : <SetupPasswordPage />;
};

const DashboardRoute = () => {
  const context = useAuthStore((state) => state.context);
  return isSearchUserOnly(context) ? <Navigate to="/documents" replace /> : <Dashboard />;
};

const GroupsRoute = () => {
  const context = useAuthStore((state) => state.context);
  return isSearchUserOnly(context) ? <Navigate to="/documents" replace /> : <GroupManagement />;
};

const GroupDetailsRoute = () => {
  const context = useAuthStore((state) => state.context);
  return isSearchUserOnly(context) ? <Navigate to="/documents" replace /> : <GroupDetails />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AlertProvider>
          {/* Global upload progress panel — persists across all routes */}
          <UploadToastPanel />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/signup" element={<SignupRoute />} />
            <Route path="/setup-password" element={<SetupPasswordRoute />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardRoute />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/connectors" element={<ConnectorBrowserPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<RoleProtectedRoute requiredOrgRole="COMPANY_ADMIN" />}>
                  <Route path="/org-settings" element={<OrgSettingsPage />} />
                  <Route path="/settings/billing" element={<BillingPage />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredAnyGroupAdmin />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredWorkspaceMember />}>
                  <Route path="/groups" element={<GroupsRoute />} />
                  <Route path="/groups/:id" element={<GroupDetailsRoute />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredCapability="ADMIN_DASHBOARD_VIEW" />}>
                  <Route path="/activity" element={<ActivityLogs />} />
                </Route>

                <Route path="/admin/*" element={<Navigate to="/documents" replace />} />
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
