import { describe, expect, it } from 'vitest';
import { sanitizeChatHtml } from '../utils/sanitizeChatHtml';

describe('sanitizeChatHtml', () => {
  it('strips script tags from markdown HTML', () => {
    const dirty = '<p>Hello</p><script>alert(1)</script>';
    const clean = sanitizeChatHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).toContain('Hello');
  });

  it('preserves source pill data attributes', () => {
    const html =
      '<span class="pill" data-source-key="[Source 1]" data-source-title="doc.pdf">↗</span>';
    const clean = sanitizeChatHtml(html);
    expect(clean).toContain('data-source-key');
    expect(clean).toContain('[Source 1]');
  });
});
