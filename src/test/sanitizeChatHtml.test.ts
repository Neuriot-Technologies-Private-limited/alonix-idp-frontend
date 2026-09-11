import { describe, expect, it } from 'vitest';
import { sanitizeChatHtml, sanitizeEmailHtml } from '../utils/sanitizeChatHtml';

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

  it('preserves claim chip data attributes', () => {
    const html = '<span class="pill" data-claim-id="CLM-2026-001"># CLM-2026-001</span>';
    const clean = sanitizeChatHtml(html);
    expect(clean).toContain('data-claim-id');
    expect(clean).toContain('CLM-2026-001');
  });
});

describe('sanitizeEmailHtml', () => {
  it('strips script tags and inline event handlers', () => {
    const dirty = '<p onclick="steal()">Hi</p><script>alert(1)</script>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('Hi');
  });

  it('strips <img> tags entirely to block remote tracking pixels', () => {
    const dirty = '<p>Hello</p><img src="https://tracker.example.com/open.gif?id=123" width="1" height="1" />';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('<img');
    expect(clean).not.toContain('tracker.example.com');
    expect(clean).toContain('Hello');
  });

  it('strips picture/source/video/audio remote-load vectors', () => {
    const dirty = '<picture><source srcset="https://evil.example.com/x.webp" /></picture><video src="https://evil.example.com/x.mp4"></video>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('evil.example.com');
    expect(clean).not.toContain('<picture');
    expect(clean).not.toContain('<video');
  });

  it('strips remote stylesheet, base, and meta-refresh vectors', () => {
    const dirty =
      '<link rel="stylesheet" href="https://evil.example.com/x.css" />' +
      '<base href="https://evil.example.com/" />' +
      '<meta http-equiv="refresh" content="0;url=https://evil.example.com/" />' +
      '<p>Body</p>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('evil.example.com');
    expect(clean).not.toContain('<link');
    expect(clean).not.toContain('<base');
    expect(clean).not.toContain('<meta');
    expect(clean).toContain('Body');
  });

  it('strips the style attribute (CSS url() beacon vector)', () => {
    const dirty = '<div style="background:url(https://tracker.example.com/beacon.png)">Hi</div>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('style=');
    expect(clean).not.toContain('tracker.example.com');
  });

  it('allows absolute https links', () => {
    const dirty = '<a href="https://example.com/invoice">View invoice</a>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).toContain('href="https://example.com/invoice"');
    expect(clean).toContain('View invoice');
  });

  it('allows mailto links', () => {
    const dirty = '<a href="mailto:billing@example.com">Contact billing</a>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).toContain('href="mailto:billing@example.com"');
  });

  it('strips javascript:, data:, and other non-allowlisted URI schemes', () => {
    const dirty =
      '<a href="javascript:alert(1)">click</a>' +
      '<a href="data:text/html,<script>alert(1)</script>">data</a>' +
      '<a href="http://example.com/insecure">insecure</a>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('javascript:');
    expect(clean).not.toContain('data:text/html');
    expect(clean).not.toContain('href="http://example.com/insecure"');
  });

  it('strips svg/math mXSS-adjacent tags', () => {
    const dirty = '<svg><script>alert(1)</script></svg><math><mtext></mtext></math><p>Text</p>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('<svg');
    expect(clean).not.toContain('<math');
    expect(clean).toContain('Text');
  });

  it('strips iframe, object, embed, and form elements', () => {
    const dirty =
      '<iframe src="https://evil.example.com"></iframe>' +
      '<object data="https://evil.example.com"></object>' +
      '<embed src="https://evil.example.com" />' +
      '<form action="https://evil.example.com"><input /></form>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<object');
    expect(clean).not.toContain('<embed');
    expect(clean).not.toContain('<form');
    expect(clean).not.toContain('<input');
  });

  it('preserves plain text formatting content', () => {
    const dirty = '<p>Hello <strong>World</strong></p><ul><li>Item</li></ul>';
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).toContain('Hello');
    expect(clean).toContain('<strong>World</strong>');
    expect(clean).toContain('<li>Item</li>');
  });
});
