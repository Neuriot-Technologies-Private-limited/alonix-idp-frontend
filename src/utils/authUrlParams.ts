/**
 * Auth link params (reset/invite tokens) are read from the URL hash first, then
 * query string for backward compatibility. Sensitive keys are stripped from the
 * visible URL after consumption so tokens are not sent as Referer query params.
 */

export function parseAuthUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);
  const merged = new URLSearchParams(queryParams);
  hashParams.forEach((value, key) => merged.set(key, value));
  return merged;
}

export function stripAuthParamsFromBrowserUrl(keys: string[]): void {
  if (typeof window === 'undefined') return;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  let changed = false;
  for (const key of keys) {
    if (hashParams.has(key)) {
      hashParams.delete(key);
      changed = true;
    }
    if (queryParams.has(key)) {
      queryParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const newHash = hashParams.toString();
  const newSearch = queryParams.toString();
  const url =
    window.location.pathname +
    (newSearch ? `?${newSearch}` : '') +
    (newHash ? `#${newHash}` : '');
  window.history.replaceState(null, '', url);
}

export function consumeAuthUrlParams(keys: string[]): Record<string, string> {
  const merged = parseAuthUrlParams();
  const out: Record<string, string> = {};
  for (const key of keys) {
    out[key] = merged.get(key)?.trim() || '';
  }
  stripAuthParamsFromBrowserUrl(keys);
  return out;
}

/** Build in-app navigation target with token params in the hash fragment. */
export function buildAuthHashUrl(path: string, params: Record<string, string | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = String(value ?? '').trim();
    if (v) sp.set(key, v);
  }
  const qs = sp.toString();
  return qs ? `${path}#${qs}` : path;
}
