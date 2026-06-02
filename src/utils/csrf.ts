/** Read CSRF token from non-httpOnly cookie set at login. */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const configuredName = String(import.meta.env.VITE_AUTH_CSRF_COOKIE_NAME || '').trim();
  const preferredNames = [configuredName, 'alonix_csrf'].filter(Boolean);

  const pairs = document.cookie
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf('=');
      if (idx === -1) return [chunk, ''] as const;
      return [chunk.slice(0, idx), chunk.slice(idx + 1)] as const;
    });

  const map = new Map<string, string>(pairs);
  for (const name of preferredNames) {
    const raw = map.get(name);
    if (!raw) continue;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  // Last-resort compatibility fallback: any cookie name ending in "_csrf".
  for (const [name, raw] of map.entries()) {
    if (!name.endsWith('_csrf')) continue;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}
