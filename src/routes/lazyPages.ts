import { lazy } from 'react';

/**
 * Lazy-loaded route components (F-003: code-split the main bundle).
 * Each entry maps to its own chunk, loaded on first navigation to that route.
 * Components with only a named export are re-wrapped as `{ default }` for React.lazy.
 */

// Authenticated pages
export const Dashboard = lazy(() =>
  import('../pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })),
);
export const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage'));
export const ChatPage = lazy(() => import('../pages/chat/ChatPage'));
export const ConnectorBrowserPage = lazy(() => import('../pages/connectors/ConnectorBrowserPage'));
export const ReportsPage = lazy(() =>
  import('../pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
export const OrgSettingsPage = lazy(() => import('../pages/profile/OrgSettingsPage'));
export const UserManagement = lazy(() =>
  import('../pages/users/UserManagement').then((m) => ({ default: m.UserManagement })),
);
export const GroupManagement = lazy(() =>
  import('../pages/groups/GroupManagement').then((m) => ({ default: m.GroupManagement })),
);
export const GroupDetails = lazy(() =>
  import('../pages/groups/GroupDetails').then((m) => ({ default: m.GroupDetails })),
);
export const ActivityLogs = lazy(() =>
  import('../pages/dashboard/ActivityLogs').then((m) => ({ default: m.ActivityLogs })),
);
export const BillingPage = lazy(() => import('../pages/billing/BillingPage'));
export const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));

// Auth / public pages
export const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
export const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
export const SetupPasswordPage = lazy(() => import('../pages/auth/SetupPasswordPage'));
export const VerifyPage = lazy(() => import('../pages/auth/VerifyPage'));
export const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
export const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
export const PricingPage = lazy(() => import('../pages/billing/PricingPage'));
