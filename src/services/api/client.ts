import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

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
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const rawOrg =
    useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
  const orgId = typeof rawOrg === 'string' && rawOrg.length > 0 ? rawOrg : undefined;
  if (orgId) {
    config.headers['X-Org-Id'] = orgId;
    const method = (config.method || 'get').toLowerCase();
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

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      const reqUrl = String((error.config as any)?.url || '');
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthRoute =
        reqUrl.includes('/users/login') ||
        reqUrl.includes('/users/verify-email') ||
        reqUrl.includes('/users/resend-verification') ||
        reqUrl.includes('/users/forgot-password') ||
        reqUrl.includes('/users/reset-password') ||
        reqUrl.includes('/users/change-password');

      const isOnLoginPage = path === '/login' || path.startsWith('/login?');

      // If the 401 happened during the login flow, let the caller (LoginPage) show UI errors.
      if (isAuthRoute || isOnLoginPage) {
        return Promise.reject(error);
      }

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
