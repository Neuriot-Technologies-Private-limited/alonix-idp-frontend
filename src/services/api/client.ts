import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { getCsrfTokenFromCookie } from '../../utils/csrf';

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

let csrfBootstrapInflight: Promise<void> | null = null;

async function ensureCsrfCookieBeforeMutate(): Promise<void> {
  if (getCsrfTokenFromCookie()) return;
  if (!csrfBootstrapInflight) {
    csrfBootstrapInflight = apiClient
      .get('/users/me/context')
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfBootstrapInflight = null;
      });
  }
  await csrfBootstrapInflight;
}

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (MUTATING_METHODS.has(method)) {
    await ensureCsrfCookieBeforeMutate();
    const csrf = getCsrfTokenFromCookie();
    if (csrf) {
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
  (response) => response,
  async (error) => {
    const csrfMsg = String(error.response?.data?.message || '');
    if (
      error.response?.status === 403 &&
      csrfMsg.toLowerCase().includes('csrf') &&
      !(error.config as { _csrfRetried?: boolean })?._csrfRetried
    ) {
      try {
        await apiClient.get('/users/me/context');
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
      useAuthStore.getState().logout();
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

      if (isAuthRoute || isOnLoginPage) {
        return Promise.reject(error);
      }

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
