import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, waitForAuthInit } from '../../stores/authStore';
import { getCsrfTokenFromCookie, setCsrfToken } from '../../utils/csrf';
import { hasActiveSession } from '../../utils/session';

/** Ensures REST paths hit `/api/...` (avoids 404 when env points at server root without `/api`). */
function normalizeApiBaseUrl(raw: string | undefined): string {
  const b = (raw || '').trim();
  if (!b || b === '/') return '/api';
  if (b.endsWith('/api') || b.endsWith('/api/')) return b.replace(/\/$/, '');
  if (b.startsWith('http://') || b.startsWith('https://')) {
    return `${b.replace(/\/$/, '')}/api`;
  }
  return b.startsWith('/') ? b : `/${b}`;
}

const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const PUBLIC_API_PREFIXES = [
  '/users/login',
  '/users/onboard',
  '/users/onboard-invite',
  '/users/invite-details',
  '/users/verify-email',
  '/users/resend-verification',
  '/users/forgot-password',
  '/users/reset-password',
  '/billing/plans',
  '/billing/config',
  '/setup/',
];

/** Allowed during cookie session rehydrate (must not wait on waitForAuthInit). */
const SESSION_BOOTSTRAP_PREFIXES = ['/users/me/context'];

function requestPath(config: InternalAxiosRequestConfig): string {
  const url = String(config.url || '');
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname.replace(/^\/api/, '') || '/';
    } catch {
      return url;
    }
  }
  return url.startsWith('/') ? url : `/${url}`;
}

function isPublicApiRequest(config: InternalAxiosRequestConfig): boolean {
  const path = requestPath(config);
  return PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isSessionBootstrapRequest(config: InternalAxiosRequestConfig): boolean {
  const path = requestPath(config);
  return SESSION_BOOTSTRAP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

let csrfBootstrapInflight: Promise<void> | null = null;
let unauthorizedHandling: Promise<void> | null = null;
let contextBootstrapCooldownUntil = 0;
const CONTEXT_429_COOLDOWN_MS = 60_000;
const CONTEXT_BOOTSTRAP_MIN_INTERVAL_MS = 5_000;
let contextBootstrapLastAt = 0;

async function bootstrapContextForCsrf(): Promise<void> {
  const now = Date.now();
  if (now < contextBootstrapCooldownUntil) return;
  if (getCsrfTokenFromCookie()) return;
  if (now - contextBootstrapLastAt < CONTEXT_BOOTSTRAP_MIN_INTERVAL_MS) return;

  contextBootstrapLastAt = now;
  try {
    const res = await apiClient.get('/users/me/context');
    captureCsrfFromPayload(res.data);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 429) {
      contextBootstrapCooldownUntil = Date.now() + CONTEXT_429_COOLDOWN_MS;
    }
  }
}

function captureCsrfFromPayload(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const token = (data as { csrfToken?: unknown }).csrfToken;
  if (typeof token === 'string' && token.trim()) {
    setCsrfToken(token.trim());
  }
}

async function ensureCsrfCookieBeforeMutate(): Promise<void> {
  if (getCsrfTokenFromCookie()) return;
  const { user, context } = useAuthStore.getState();
  if (!hasActiveSession(user, context)) return;
  if (!csrfBootstrapInflight) {
    csrfBootstrapInflight = bootstrapContextForCsrf().finally(() => {
      csrfBootstrapInflight = null;
    });
  }
  await csrfBootstrapInflight;
}

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  const isPublic = isPublicApiRequest(config);

  const isBootstrap = isSessionBootstrapRequest(config);
  if (!isPublic && !isBootstrap) {
    await waitForAuthInit();
    const { user, context } = useAuthStore.getState();
    if (!hasActiveSession(user, context)) {
      return Promise.reject(new axios.CanceledError('No active session'));
    }
  }

  if (MUTATING_METHODS.has(method) && !isPublic) {
    await ensureCsrfCookieBeforeMutate();
    const csrf = getCsrfTokenFromCookie();
    if (!csrf) {
      const { user, context } = useAuthStore.getState();
      if (hasActiveSession(user, context)) {
        return Promise.reject(
          new Error('CSRF token unavailable — refresh the page or sign in again')
        );
      }
    } else {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }

  const rawOrg =
    useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
  const orgId = typeof rawOrg === 'string' && rawOrg.length > 0 ? rawOrg : undefined;
  const rawGroup = useAuthStore.getState().context?.activeGroupId;
  const activeGroupId =
    typeof rawGroup === 'string' && rawGroup.trim().length > 0 ? rawGroup.trim() : undefined;
  if (orgId) {
    config.headers['X-Org-Id'] = orgId;
    if (method === 'get' || method === 'delete' || method === 'head') {
      config.params = { ...(config.params || {}), orgId };
    } else if (
      config.data &&
      typeof config.data === 'object' &&
      !(config.data instanceof FormData) &&
      !Array.isArray(config.data)
    ) {
      if (!Object.prototype.hasOwnProperty.call(config.data, 'orgId')) {
        config.data = { ...config.data, orgId };
      }
    } else if (config.data instanceof FormData && !config.data.has('orgId')) {
      config.data.append('orgId', orgId);
    }
  }

  if (activeGroupId) {
    config.headers['X-Group-Id'] = activeGroupId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    captureCsrfFromPayload(response.data);
    return response;
  },
  async (error) => {
    const csrfMsg = String(error.response?.data?.message || '');
    if (
      error.response?.status === 403 &&
      csrfMsg.toLowerCase().includes('csrf') &&
      !(error.config as { _csrfRetried?: boolean })?._csrfRetried
    ) {
      try {
        await bootstrapContextForCsrf();
        const csrf = getCsrfTokenFromCookie();
        if (csrf && error.config) {
          const retryConfig = { ...error.config, _csrfRetried: true };
          retryConfig.headers = { ...(retryConfig.headers || {}), 'X-CSRF-Token': csrf };
          return apiClient.request(retryConfig);
        }
      } catch {
        /* fall through */
      }
    }

    if (error.response?.status === 401) {
      const reqUrl = String((error.config as { url?: string })?.url || '');
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthRoute =
        reqUrl.includes('/users/login') ||
        reqUrl.includes('/users/verify-email') ||
        reqUrl.includes('/users/resend-verification') ||
        reqUrl.includes('/users/forgot-password') ||
        reqUrl.includes('/users/reset-password') ||
        reqUrl.includes('/users/change-password');

      const isOnLoginPage = path === '/login' || path.startsWith('/login?');
      const { isRefreshingSession } = useAuthStore.getState();

      if (isAuthRoute || isOnLoginPage || isRefreshingSession) {
        return Promise.reject(error);
      }

      if (!unauthorizedHandling) {
        unauthorizedHandling = (async () => {
          await useAuthStore.getState().logout();
          if (!isOnLoginPage) {
            window.location.href = '/login';
          }
        })().finally(() => {
          unauthorizedHandling = null;
        });
      }
      await unauthorizedHandling;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
