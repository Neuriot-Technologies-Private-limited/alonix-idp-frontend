import { describe, expect, it } from 'vitest';
import { defaultUserPreferences } from '../types/auth';

describe('defaultUserPreferences', () => {
  it('returns expected defaults', () => {
    expect(defaultUserPreferences()).toEqual({
      emailNotifications: true,
      productUpdates: false,
      weeklyDigest: true,
    });
  });

  it('returns a fresh object each call', () => {
    const a = defaultUserPreferences();
    const b = defaultUserPreferences();
    expect(a).not.toBe(b);
    a.emailNotifications = false;
    expect(b.emailNotifications).toBe(true);
  });
});
