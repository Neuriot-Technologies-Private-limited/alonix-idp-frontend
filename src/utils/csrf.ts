/** In-memory CSRF token for cross-origin API (cookie not readable from document.cookie). */
let memoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null | undefined): void {
  const trimmed = String(token || '').trim();
  memoryCsrfToken = trimmed || null;
}

export function clearCsrfToken(): void {
  memoryCsrfToken = null;
}

/** CSRF token for X-CSRF-Token header: memory first, then same-origin cookie. */
export function getCsrfTokenFromCookie(): string | null {
  if (memoryCsrfToken) return memoryCsrfToken;
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
