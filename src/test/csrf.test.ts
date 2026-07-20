import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCsrfToken, getCsrfTokenFromCookie, setCsrfToken } from '../utils/csrf';

/** jsdom keeps cookies for the whole file; expire everything between tests. */
function clearAllCookies(): void {
  const names = document.cookie
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.split('=')[0]);
  for (const name of names) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

describe('csrf', () => {
  beforeEach(() => {
    clearCsrfToken();
    clearAllCookies();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearCsrfToken();
    clearAllCookies();
  });

  describe('setCsrfToken / clearCsrfToken', () => {
    it('stores a trimmed token in memory', () => {
      setCsrfToken('  abc123  ');
      expect(getCsrfTokenFromCookie()).toBe('abc123');
    });

    it.each([null, undefined, '', '   '])(
      'treats %j as clearing the in-memory token',
      (value) => {
        setCsrfToken('previous-token');
        setCsrfToken(value);
        expect(getCsrfTokenFromCookie()).toBeNull();
      }
    );

    it('clearCsrfToken removes a previously stored in-memory token', () => {
      setCsrfToken('abc');
      clearCsrfToken();
      expect(getCsrfTokenFromCookie()).toBeNull();
    });
  });

  describe('getCsrfTokenFromCookie', () => {
    it('returns null when there is no in-memory token and no cookie', () => {
      expect(getCsrfTokenFromCookie()).toBeNull();
    });

    it('prefers the in-memory token over any cookie value', () => {
      setCsrfToken('mem-token');
      document.cookie = 'alonix_csrf=cookie-token';
      expect(getCsrfTokenFromCookie()).toBe('mem-token');
    });

    it('reads the default alonix_csrf cookie when no custom name is configured', () => {
      document.cookie = 'alonix_csrf=cookie-token-123';
      expect(getCsrfTokenFromCookie()).toBe('cookie-token-123');
    });

    it('URL-decodes cookie values', () => {
      document.cookie = `alonix_csrf=${encodeURIComponent('token with spaces')}`;
      expect(getCsrfTokenFromCookie()).toBe('token with spaces');
    });

    it('reads the configured VITE_AUTH_CSRF_COOKIE_NAME cookie when set', () => {
      vi.stubEnv('VITE_AUTH_CSRF_COOKIE_NAME', 'custom_csrf_name');
      document.cookie = 'custom_csrf_name=custom-token';
      expect(getCsrfTokenFromCookie()).toBe('custom-token');
    });

    it('prefers the configured cookie name over the alonix_csrf fallback', () => {
      vi.stubEnv('VITE_AUTH_CSRF_COOKIE_NAME', 'custom_csrf_name');
      document.cookie = 'alonix_csrf=fallback-token';
      document.cookie = 'custom_csrf_name=preferred-token';
      expect(getCsrfTokenFromCookie()).toBe('preferred-token');
    });

    it('falls back to any cookie ending in _csrf when preferred names are absent', () => {
      document.cookie = 'session=abc';
      document.cookie = 'service_csrf=fallback-token';
      expect(getCsrfTokenFromCookie()).toBe('fallback-token');
    });

    it('returns null when cookies exist but none match csrf naming', () => {
      document.cookie = 'session=abc';
      document.cookie = 'theme=dark';
      expect(getCsrfTokenFromCookie()).toBeNull();
    });

    it('returns the raw value when a preferred-name cookie has malformed percent-encoding', () => {
      document.cookie = 'alonix_csrf=%';
      expect(getCsrfTokenFromCookie()).toBe('%');
    });

    it('returns the raw value when a fallback *_csrf cookie has malformed percent-encoding', () => {
      document.cookie = 'service_csrf=%';
      expect(getCsrfTokenFromCookie()).toBe('%');
    });
  });
});
