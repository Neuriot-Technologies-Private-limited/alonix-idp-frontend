import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatDiscoveryUploadedAt } from '../utils/formatDateTime';

describe('formatDiscoveryUploadedAt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns em dash for empty values', () => {
    expect(formatDiscoveryUploadedAt(null)).toBe('—');
    expect(formatDiscoveryUploadedAt('')).toBe('—');
    expect(formatDiscoveryUploadedAt('not-a-date')).toBe('—');
  });

  it('formats valid ISO timestamps', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Jan 15, 2026, 10:00 AM');
    expect(formatDiscoveryUploadedAt('2026-01-15T10:00:00.000Z')).toBe('Jan 15, 2026, 10:00 AM');
  });
});
