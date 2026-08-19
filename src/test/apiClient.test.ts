import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import type { AuthContextPayload, UserDetails } from '../types/auth';

/** Mutable auth state read by the client interceptors via useAuthStore.getState(). */
const authState: {
  user: UserDetails | null;
  context: AuthContextPayload | null;
  isRefreshingSession: boolean;
  logout: ReturnType<typeof vi.fn>;
} = {
  user: null,
  context: null,
  isRefreshingSession: false,
  logout: vi.fn().mockResolvedValue(undefined),
};

const waitForAuthInitMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../stores/authStore', () => ({
  useAuthStore: { getState: () => authState },
  waitForAuthInit: () => waitForAuthInitMock(),
}));

import apiClient, { normalizeApiBaseUrl } from '../services/api/client';
import { clearCsrfToken, getCsrfTokenFromCookie, setCsrfToken } from '../utils/csrf';

/* eslint-disable @typescript-eslint/no-explicit-any -- axios interceptor shapes are not exported */
type AnyConfig = any;

const requestHandlers = (apiClient.interceptors.request as unknown as { handlers: AnyConfig[] })
  .handlers;
const responseHandlers = (apiClient.interceptors.response as unknown as { handlers: AnyConfig[] })
  .handlers;

const requestFulfilled = requestHandlers[0].fulfilled as (config: AnyConfig) => Promise<AnyConfig>;
const responseFulfilled = responseHandlers[0].fulfilled as (response: AnyConfig) => AnyConfig;
const responseRejected = responseHandlers[0].rejected as (error: AnyConfig) => Promise<unknown>;

function makeConfig(overrides: AnyConfig = {}): AnyConfig {
  return { url: '/documents', method: 'get', headers: {}, ...overrides };
}

function activeUser(): UserDetails {
  return {
    username: 'a@x.com',
    email: 'a@x.com',
    preferences: { emailNotifications: true, productUpdates: false, weeklyDigest: true },
  };
}

function activeContext(overrides: Partial<AuthContextPayload> = {}): AuthContextPayload {
  return {
    orgId: 'org-1',
    orgRole: 'MEMBER',
    groups: [],
    activeGroupId: null,
    activeGroupRole: null,
    capabilities: [],
    ...overrides,
  };
}

function setActiveSession(contextOverrides: Partial<AuthContextPayload> = {}): void {
  authState.user = activeUser();
  authState.context = activeContext(contextOverrides);
}

beforeEach(() => {
  authState.user = null;
  authState.context = null;
  authState.isRefreshingSession = false;
  authState.logout.mockClear().mockResolvedValue(undefined);
  waitForAuthInitMock.mockClear().mockResolvedValue(undefined);
  clearCsrfToken();
});

describe('normalizeApiBaseUrl', () => {
  it.each([
    [undefined, '/api'],
    ['', '/api'],
    ['   ', '/api'],
    ['/', '/api'],
  ])('treats %j as unset and returns %j', (input, expected) => {
    expect(normalizeApiBaseUrl(input as string | undefined)).toBe(expected);
  });

  it('leaves a base URL that already ends with /api untouched', () => {
    expect(normalizeApiBaseUrl('/api')).toBe('/api');
  });

  it('strips a trailing slash from an /api/ base URL', () => {
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
  });

  it('appends /api to absolute http(s) base URLs missing it', () => {
    expect(normalizeApiBaseUrl('http://x.com')).toBe('http://x.com/api');
    expect(normalizeApiBaseUrl('https://x.com/')).toBe('https://x.com/api');
  });

  it('does not double-append /api to absolute URLs that already have it', () => {
    expect(normalizeApiBaseUrl('https://x.com/api')).toBe('https://x.com/api');
    expect(normalizeApiBaseUrl('https://x.com/api/')).toBe('https://x.com/api');
  });

  it('prefixes a bare relative path with a leading slash', () => {
    expect(normalizeApiBaseUrl('gateway')).toBe('/gateway');
  });

  it('leaves a relative path that already starts with a slash untouched', () => {
    expect(normalizeApiBaseUrl('/gateway')).toBe('/gateway');
  });
});

describe('apiClient request interceptor — auth gating', () => {
  it('rejects protected requests when there is no active session', async () => {
    const config = makeConfig({ url: '/documents', method: 'get' });
    await expect(requestFulfilled(config)).rejects.toSatisfy(
      (err: unknown) => axios.isCancel(err) === true
    );
    expect(waitForAuthInitMock).toHaveBeenCalledTimes(1);
  });

  it('waits for auth init and proceeds when a session is active', async () => {
    setActiveSession();
    const config = makeConfig({ url: '/documents', method: 'get' });
    const result = await requestFulfilled(config);
    expect(waitForAuthInitMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(config);
  });

  it('skips the session gate for public routes even when logged out', async () => {
    const config = makeConfig({ url: '/users/login', method: 'post', data: { email: 'a@x.com' } });
    await expect(requestFulfilled(config)).resolves.toBe(config);
    expect(waitForAuthInitMock).not.toHaveBeenCalled();
  });

  it('skips the session gate for the session-bootstrap context route', async () => {
    const config = makeConfig({ url: '/users/me/context', method: 'get' });
    await expect(requestFulfilled(config)).resolves.toBe(config);
    expect(waitForAuthInitMock).not.toHaveBeenCalled();
  });

  it('treats a malformed absolute URL as non-public rather than throwing', async () => {
    setActiveSession();
    const config = makeConfig({ url: 'http://', method: 'get' });
    await expect(requestFulfilled(config)).resolves.toBe(config);
    expect(waitForAuthInitMock).toHaveBeenCalledTimes(1);
  });

  it('resolves public prefixes for absolute URLs pointing at the API host', async () => {
    const config = makeConfig({
      url: 'https://api.example.com/api/billing/plans',
      method: 'get',
    });
    await expect(requestFulfilled(config)).resolves.toBe(config);
    expect(waitForAuthInitMock).not.toHaveBeenCalled();
  });
});

describe('apiClient request interceptor — org / group headers', () => {
  it('does not attach org or group headers when there is no org context', async () => {
    // Logged-out state (no user/context): use a public route to reach the header logic.
    const config = makeConfig({ url: '/users/login', method: 'post' });
    const result = await requestFulfilled(config);
    expect(result.headers['X-Org-Id']).toBeUndefined();
    expect(result.headers['X-Group-Id']).toBeUndefined();
  });

  it('adds X-Org-Id, X-Group-Id headers and an orgId query param for read methods', async () => {
    setActiveSession({ activeGroupId: 'g1' });
    setCsrfToken('csrf-token'); // delete is also a CSRF-mutating method
    for (const method of ['get', 'delete', 'head']) {
      const config = makeConfig({ url: '/documents', method, params: { page: 1 } });
      const result = await requestFulfilled(config);
      expect(result.headers['X-Org-Id']).toBe('org-1');
      expect(result.headers['X-Group-Id']).toBe('g1');
      expect(result.params).toEqual({ page: 1, orgId: 'org-1' });
    }
  });

  it('falls back to the user orgId when the context orgId is absent', async () => {
    authState.user = { ...activeUser(), orgId: 'user-org' };
    authState.context = activeContext({ orgId: null });
    // Session gate needs context.orgId too, so use a bootstrap route to reach the header logic.
    const config = makeConfig({ url: '/users/me/context', method: 'get' });
    const result = await requestFulfilled(config);
    expect(result.headers['X-Org-Id']).toBe('user-org');
  });

  it('merges orgId into a plain object JSON body for mutating requests', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const config = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    const result = await requestFulfilled(config);
    expect(result.data).toEqual({ name: 'doc', orgId: 'org-1' });
    expect(result.params).toBeUndefined();
  });

  it('does not overwrite an orgId already present on the request body', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const config = makeConfig({
      url: '/documents',
      method: 'post',
      data: { name: 'doc', orgId: 'preset-org' },
    });
    const result = await requestFulfilled(config);
    expect(result.data).toEqual({ name: 'doc', orgId: 'preset-org' });
  });

  it('appends orgId to FormData bodies that do not already have one', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const form = new FormData();
    form.append('file', 'contents');
    const config = makeConfig({ url: '/documents', method: 'post', data: form });
    const result = await requestFulfilled(config);
    expect(result.data.get('orgId')).toBe('org-1');
  });

  it('does not duplicate orgId on FormData bodies that already have one', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const form = new FormData();
    form.append('orgId', 'preset-org');
    const config = makeConfig({ url: '/documents', method: 'post', data: form });
    const result = await requestFulfilled(config);
    expect(result.data.getAll('orgId')).toEqual(['preset-org']);
  });

  it('leaves array request bodies untouched', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const config = makeConfig({ url: '/documents', method: 'put', data: [1, 2, 3] });
    const result = await requestFulfilled(config);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('trims and only sends a non-empty activeGroupId as a header', async () => {
    setActiveSession({ activeGroupId: '   ' });
    const config = makeConfig({ url: '/documents', method: 'get' });
    const result = await requestFulfilled(config);
    expect(result.headers['X-Group-Id']).toBeUndefined();
  });
});

describe('apiClient request interceptor — CSRF on mutating requests', () => {
  it('attaches the X-CSRF-Token header when a token is already available', async () => {
    setActiveSession();
    setCsrfToken('csrf-token');
    const config = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    const result = await requestFulfilled(config);
    expect(result.headers['X-CSRF-Token']).toBe('csrf-token');
  });

  it('does not require a CSRF token for GET requests', async () => {
    setActiveSession();
    const config = makeConfig({ url: '/documents', method: 'get' });
    const result = await requestFulfilled(config);
    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('skips CSRF handling entirely for public mutating routes', async () => {
    const config = makeConfig({ url: '/users/login', method: 'post', data: { email: 'a@x.com' } });
    const result = await requestFulfilled(config);
    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });
});

describe('apiClient response interceptor — CSRF token capture', () => {
  it('captures a csrfToken from a successful response payload and returns the response unchanged', () => {
    const response = { data: { csrfToken: ' new-token ' }, status: 200 };
    const result = responseFulfilled(response);
    expect(result).toBe(response);
    expect(getCsrfTokenFromCookie()).toBe('new-token');
  });

  it('ignores response payloads without a csrfToken field', () => {
    const response = { data: { ok: true }, status: 200 };
    responseFulfilled(response);
    expect(getCsrfTokenFromCookie()).toBeNull();
  });
});

describe('apiClient response interceptor — 403 CSRF retry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retries the original request once with a fresh CSRF token after a 403 CSRF error', async () => {
    const getSpy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValueOnce({ data: { csrfToken: 'retry-token' } } as AnyConfig);
    const requestSpy = vi
      .spyOn(apiClient, 'request')
      .mockResolvedValueOnce({ data: 'ok' } as AnyConfig);

    const originalConfig = { url: '/documents', method: 'post', headers: { 'X-CSRF-Token': 'stale' } };
    const error: AnyConfig = {
      response: { status: 403, data: { message: 'Invalid CSRF token' } },
      config: originalConfig,
    };

    const result = await responseRejected(error);

    expect(getSpy).toHaveBeenCalledWith('/users/me/context');
    expect(requestSpy).toHaveBeenCalledTimes(1);
    const retriedConfig = requestSpy.mock.calls[0][0] as AnyConfig;
    expect(retriedConfig._csrfRetried).toBe(true);
    expect(retriedConfig.headers['X-CSRF-Token']).toBe('retry-token');
    expect(result).toEqual({ data: 'ok' });
  });

  it('does not retry a request that has already failed a CSRF retry, and rewrites the message', async () => {
    const getSpy = vi.spyOn(apiClient, 'get');
    const error: AnyConfig = {
      response: { status: 403, data: { message: 'csrf mismatch' } },
      config: { url: '/documents', method: 'post', headers: {}, _csrfRetried: true },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(getSpy).not.toHaveBeenCalled();
    expect(error.response.data.message).toMatch(/verify your session/);
    expect(error.response.data.originalMessage).toBe('csrf mismatch');
  });

  it('recognizes the CSRF_INVALID code even without "csrf" in the message text', async () => {
    const error: AnyConfig = {
      response: { status: 403, data: { message: 'Forbidden', code: 'CSRF_INVALID' } },
      config: { url: '/documents', method: 'post', headers: {}, _csrfRetried: true },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(error.response.data.message).toMatch(/verify your session/);
    expect(error.response.data.originalMessage).toBe('Forbidden');
  });

  it('leaves non-CSRF 403 errors untouched', async () => {
    const getSpy = vi.spyOn(apiClient, 'get');
    const error: AnyConfig = {
      response: { status: 403, data: { message: 'Forbidden: insufficient role' } },
      config: { url: '/documents', method: 'post', headers: {} },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(getSpy).not.toHaveBeenCalled();
  });
});

describe('apiClient response interceptor — 401 handling', () => {
  const originalLocation = window.location;

  function setLocation(pathname: string): void {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname, href: '' },
    });
  }

  beforeEach(() => {
    setLocation('/dashboard');
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  it('does not log out for a 401 on an auth route such as login', async () => {
    const error: AnyConfig = {
      response: { status: 401 },
      config: { url: '/users/login' },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(authState.logout).not.toHaveBeenCalled();
  });

  it('does not log out for a 401 while already on the login page', async () => {
    setLocation('/login');
    const error: AnyConfig = {
      response: { status: 401 },
      config: { url: '/documents' },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(authState.logout).not.toHaveBeenCalled();
  });

  it('does not log out for a 401 while a session refresh is in flight', async () => {
    authState.isRefreshingSession = true;
    const error: AnyConfig = {
      response: { status: 401 },
      config: { url: '/documents' },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(authState.logout).not.toHaveBeenCalled();
  });

  it('logs out and redirects to /login on a 401 for a protected route', async () => {
    const error: AnyConfig = {
      response: { status: 401 },
      config: { url: '/documents' },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('dedupes concurrent 401s into a single logout call', async () => {
    let resolveLogout: () => void = () => {};
    authState.logout.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve;
        })
    );

    const errorA: AnyConfig = { response: { status: 401 }, config: { url: '/documents' } };
    const errorB: AnyConfig = { response: { status: 401 }, config: { url: '/reports' } };

    const pA = responseRejected(errorA).catch((e) => e);
    const pB = responseRejected(errorB).catch((e) => e);

    resolveLogout();
    const [resultA, resultB] = await Promise.all([pA, pB]);

    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(resultA).toBe(errorA);
    expect(resultB).toBe(errorB);
  });

  it('leaves non-401, non-403 errors untouched', async () => {
    const error: AnyConfig = {
      response: { status: 500 },
      config: { url: '/documents' },
    };
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(authState.logout).not.toHaveBeenCalled();
  });
});

// Placed last: uses fake timers anchored to real time + offsets so its rate-limit
// bookkeeping (module-level cooldown/interval state in client.ts) can never leak
// backward into the real-time tests above.
describe('apiClient request interceptor — CSRF bootstrap for mutating requests', () => {
  const realNowAtStart = Date.now();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(realNowAtStart + 10_000);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bootstraps the CSRF cookie via /users/me/context and attaches the header when available', async () => {
    setActiveSession();
    const getSpy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValueOnce({ data: { csrfToken: 'fresh-token' } } as AnyConfig);

    const config = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    const result = await requestFulfilled(config);

    expect(getSpy).toHaveBeenCalledWith('/users/me/context');
    expect(result.headers['X-CSRF-Token']).toBe('fresh-token');
    expect(getCsrfTokenFromCookie()).toBe('fresh-token');
  });

  it('rejects the mutation when bootstrap cannot obtain a token', async () => {
    vi.setSystemTime(realNowAtStart + 20_000);
    setActiveSession();
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: {} } as AnyConfig);

    const config = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    await expect(requestFulfilled(config)).rejects.toThrow(/verify your session/);
    expect(getSpy).toHaveBeenCalledWith('/users/me/context');
  });

  it('does not attempt a mutation bootstrap when there is no active session', async () => {
    vi.setSystemTime(realNowAtStart + 30_000);
    const getSpy = vi.spyOn(apiClient, 'get');
    // Use a session-bootstrap-prefixed path to bypass the earlier auth gate and
    // isolate the CSRF-bootstrap-without-a-session behavior being tested here.
    const config = makeConfig({ url: '/users/me/context', method: 'post', data: { name: 'doc' } });
    const result = await requestFulfilled(config);
    expect(getSpy).not.toHaveBeenCalled();
    expect(result.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('enters a cooldown after a 429 and skips further bootstrap attempts until it elapses', async () => {
    vi.setSystemTime(realNowAtStart + 40_000);
    setActiveSession();
    const getSpy = vi
      .spyOn(apiClient, 'get')
      .mockRejectedValueOnce({ response: { status: 429 } });

    const first = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    await expect(requestFulfilled(first)).rejects.toThrow(/verify your session/);
    expect(getSpy).toHaveBeenCalledTimes(1);

    // Still within the 429 cooldown window: no second network call is made.
    vi.setSystemTime(realNowAtStart + 45_000);
    const second = makeConfig({ url: '/documents', method: 'post', data: { name: 'doc' } });
    await expect(requestFulfilled(second)).rejects.toThrow(/verify your session/);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
