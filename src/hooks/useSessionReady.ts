import { useAuthStore } from '../stores/authStore';
import { hasActiveSession } from '../utils/session';

/** True after auth bootstrap and when user + org context are present. */
export function useSessionReady(): boolean {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isRefreshingSession = useAuthStore((s) => s.isRefreshingSession);
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  return isInitialized && !isRefreshingSession && hasActiveSession(user, context);
}
