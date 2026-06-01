/**
 * Optional Sentry — initializes only when VITE_SENTRY_DSN is set.
 */

const SENSITIVE_KEY_RE =
  /password|secret|token|api[_-]?key|authorization|cookie|alonix_access/i;

function scrubObject(obj: Record<string, unknown> | undefined) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      obj[key] = '[Filtered]';
      continue;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      scrubObject(obj[key] as Record<string, unknown>);
    }
  }
}

export function initSentry(): void {
  const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
  if (!dsn) return;

  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        beforeSend(event) {
          if (event.request?.headers) scrubObject(event.request.headers as Record<string, unknown>);
          if (event.extra) scrubObject(event.extra as Record<string, unknown>);
          return event;
        },
      });
    })
    .catch(() => {
      console.warn('[sentry] @sentry/react not installed');
    });
}
