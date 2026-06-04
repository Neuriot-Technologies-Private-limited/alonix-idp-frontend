import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseAuthUrlParams,
  consumeAuthUrlParams,
  buildAuthHashUrl,
  stripAuthParamsFromBrowserUrl,
} from '../utils/authUrlParams';

describe('authUrlParams', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname: '/reset-password', search: '', hash: '' },
    });
    window.history.replaceState = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  it('prefers hash over query for duplicate keys', () => {
    window.location.search = '?token=query-token&email=a@b.com';
    window.location.hash = '#token=hash-token';
    const merged = parseAuthUrlParams();
    expect(merged.get('token')).toBe('hash-token');
    expect(merged.get('email')).toBe('a@b.com');
  });

  it('consumes and strips sensitive keys from hash and query', () => {
    window.location.search = '?token=abc&email=user@test.com';
    window.location.hash = '#inviteToken=inv123';
    const out = consumeAuthUrlParams(['token', 'inviteToken', 'email']);
    expect(out.token).toBe('abc');
    expect(out.inviteToken).toBe('inv123');
    expect(out.email).toBe('user@test.com');
    expect(window.history.replaceState).toHaveBeenCalled();
    const lastUrl = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2];
    expect(String(lastUrl)).not.toContain('token');
    expect(String(lastUrl)).not.toContain('inviteToken');
  });

  it('buildAuthHashUrl puts params in the hash', () => {
    expect(buildAuthHashUrl('/setup-password', { inviteToken: 'abc123' })).toBe(
      '/setup-password#inviteToken=abc123'
    );
  });

  it('stripAuthParamsFromBrowserUrl removes only listed keys', () => {
    window.location.search = '?token=x&orgId=1';
    stripAuthParamsFromBrowserUrl(['token']);
    const lastUrl = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[2];
    expect(String(lastUrl)).toContain('orgId=1');
    expect(String(lastUrl)).not.toContain('token');
  });
});
