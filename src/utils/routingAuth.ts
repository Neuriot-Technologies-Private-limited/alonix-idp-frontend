import type { AuthContextPayload } from '../types/auth';

/** Member with no GROUP_ADMIN workspace — search-only experience. */
export function isSearchUserOnly(context: AuthContextPayload | null | undefined): boolean {
  return (
    context?.orgRole === 'MEMBER' &&
    !(context.groups || []).some((g) => g.role === 'GROUP_ADMIN')
  );
}

/** Default landing path after login for the current auth context. */
export function getDefaultAuthedPath(context: AuthContextPayload | null | undefined): string {
  return isSearchUserOnly(context) ? '/documents' : '/dashboard';
}
