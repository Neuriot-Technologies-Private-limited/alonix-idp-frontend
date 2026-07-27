import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { AlertProvider } from './components/alert';
import { UploadToastPanel } from './components/ui/UploadToastPanel';
import { useAuthStore } from './stores/authStore';
import AppLayout from './layout/AppLayout';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';
import {
  LoginPage,
  SignupPage,
  SetupPasswordPage,
  VerifyPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  LandingPage,
  Dashboard,
  GroupManagement,
  UserManagement,
  ActivityLogs,
  ReportsPage,
  GroupDetails,
  DocumentsPage,
  ChatPage,
  ProfilePage,
  OrgSettingsPage,
  BillingPage,
  PricingPage,
  ConnectorBrowserPage,
} from './routes/lazyPages';
import ScrollToTop from './components/routing/ScrollToTop';
import { getDefaultAuthedPath, isSearchUserOnly } from './utils/routingAuth';
import { hasActiveSession } from './utils/session';
import { isEnterpriseBuild } from './brand/deploymentProfile';
import { isSelfServeBillingEnabled } from './brand/brandConfig';
import './index.css';

/** Redirects SaaS-only public routes when built for enterprise deployment. */
function EnterpriseRouteGuard({ children }: { children: ReactNode }) {
  if (!isEnterpriseBuild()) return <>{children}</>;
  return <Navigate to="/login" replace />;
}

function PricingRouteGuard({ children }: { children: ReactNode }) {
  if (isEnterpriseBuild()) return <Navigate to="/login" replace />;
  if (!isSelfServeBillingEnabled()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function BillingSettingsRoute() {
  if (!isSelfServeBillingEnabled()) return <Navigate to="/org-settings" replace />;
  return <BillingPage />;
}

const ForbiddenPage = () => (
  <div className="p-8 text-destructive font-display font-black uppercase tracking-widest">
    403 - Forbidden Access Denied
  </div>
);

const AuthBootstrapSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
    Loading session…
  </div>
);

const PrivateRoute = () => {
  const user = useAuthStore((state) => state.user);
  const context = useAuthStore((state) => state.context);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isRefreshingSession = useAuthStore((state) => state.isRefreshingSession);
  if (!isInitialized || isRefreshingSession) {
    return <AuthBootstrapSpinner />;
  }
  if (!hasActiveSession(user, context)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const LoginRoute = () => {
  const user = useAuthStore((state) => state.user);
  const context = useAuthStore((state) => state.context);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isRefreshingSession = useAuthStore((state) => state.isRefreshingSession);
  if (!isInitialized || isRefreshingSession) {
    return <AuthBootstrapSpinner />;
  }
  return hasActiveSession(user, context) ? (
    <Navigate to={getDefaultAuthedPath(context)} replace />
  ) : (
    <LoginPage />
  );
};

const SignupRoute = () => {
  const user = useAuthStore((state) => state.user);
  const context = useAuthStore((state) => state.context);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isRefreshingSession = useAuthStore((state) => state.isRefreshingSession);
  if (!isInitialized || isRefreshingSession) {
    return <AuthBootstrapSpinner />;
  }
  return hasActiveSession(user, context) ? (
    <Navigate to={getDefaultAuthedPath(context)} replace />
  ) : (
    <SignupPage />
  );
};

const SetupPasswordRoute = () => {
  const user = useAuthStore((state) => state.user);
  const context = useAuthStore((state) => state.context);
  return hasActiveSession(user, context) ? (
    <Navigate to={getDefaultAuthedPath(context)} replace />
  ) : (
    <SetupPasswordPage />
  );
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
          <ScrollToTop />
          <Suspense fallback={<AuthBootstrapSpinner />}>
          <Routes>
            <Route
              path="/"
              element={
                <EnterpriseRouteGuard>
                  <LandingPage />
                </EnterpriseRouteGuard>
              }
            />
            <Route path="/login" element={<LoginRoute />} />
            <Route
              path="/signup"
              element={
                <EnterpriseRouteGuard>
                  <SignupRoute />
                </EnterpriseRouteGuard>
              }
            />
            <Route path="/setup-password" element={<SetupPasswordRoute />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/pricing"
              element={
                <PricingRouteGuard>
                  <PricingPage />
                </PricingRouteGuard>
              }
            />

            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardRoute />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/connectors" element={<ConnectorBrowserPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<RoleProtectedRoute requiredOrgRole="COMPANY_ADMIN" />}>
                  <Route path="/org-settings" element={<OrgSettingsPage />} />
                  <Route path="/activity" element={<ActivityLogs />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings/billing" element={<BillingSettingsRoute />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredAnyGroupAdmin />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>

                <Route element={<RoleProtectedRoute requiredWorkspaceMember />}>
                  <Route path="/groups" element={<GroupsRoute />} />
                  <Route path="/groups/:id" element={<GroupDetailsRoute />} />
                </Route>

                <Route path="/admin/*" element={<Navigate to="/documents" replace />} />
              </Route>
            </Route>

            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<Navigate to={isEnterpriseBuild() ? '/login' : '/'} replace />} />
          </Routes>
          </Suspense>
        </Router>
        </AlertProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
