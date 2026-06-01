import type { UserDetails, AuthContextPayload } from '../types/auth';

/** Session is valid when user + org context are present (JWT lives in httpOnly cookie). */
export function hasActiveSession(
  user: UserDetails | null,
  context: AuthContextPayload | null
): boolean {
  return Boolean(user?.email && context?.orgId);
}
