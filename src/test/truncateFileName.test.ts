import { describe, expect, it } from 'vitest';
import { truncateFileName } from '../utils/truncateFileName';

describe('truncateFileName', () => {
  it('returns short names unchanged', () => {
    expect(truncateFileName('short.pdf')).toBe('short.pdf');
  });

  it('preserves extension when truncating', () => {
    const out = truncateFileName('very-long-file-name-document-extra.pdf', 32);
    expect(out.endsWith('.pdf')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(32);
    expect(out).toContain('…');
  });

  it('truncates names without extension', () => {
    const out = truncateFileName('no-extension-at-all-very-long-name', 20);
    expect(out.length).toBe(20);
    expect(out.endsWith('…')).toBe(true);
  });
});
