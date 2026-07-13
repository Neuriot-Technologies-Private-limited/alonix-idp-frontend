import DOMPurify, { type Config } from 'dompurify';

/** Allow source citation pills created by parseHtmlWithSources */
const CHAT_SANITIZE_CONFIG: Config = {
  ADD_ATTR: [
    'data-source-key',
    'data-source-title',
    'data-source-page',
    'data-source-filepath',
    'data-source-confidence',
    'title-set',
  ],
  RETURN_TRUSTED_TYPE: false,
};

export function sanitizeChatHtml(html: string): string {
  return DOMPurify.sanitize(html || '', CHAT_SANITIZE_CONFIG) as string;
}

/**
 * Untrusted HTML from connector-ingested emails is rendered read-only in
 * admin previews. This profile is intentionally stricter than the chat
 * sanitizer: it drops every element/attribute capable of loading a remote
 * resource (the classic 1x1 "tracking pixel" beacon, remote stylesheets,
 * CSS `url()` background beacons) or executing script, and only allows
 * absolute `https:` links and `mailto:` addresses to pass through.
 */
const EMAIL_SANITIZE_CONFIG: Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [
    'iframe', 'object', 'embed', 'form', 'input', 'button', 'style',
    // Remote-load / beacon vectors (tracking pixels, remote CSS, redirects)
    'img', 'picture', 'source', 'video', 'audio', 'track', 'canvas',
    'link', 'base', 'meta',
    // mXSS / script-adjacent vectors
    'svg', 'math', 'template', 'script', 'noscript',
  ],
  FORBID_ATTR: [
    'style', 'srcset', 'background', 'poster', 'formaction', 'ping',
    'longdesc', 'xlink:href', 'autofocus', 'autoplay', 'action',
  ],
  // Only absolute https links and mailto: addresses may pass through — this
  // blocks javascript:, data:, http:, tel:, and every other URI scheme that
  // DOMPurify would otherwise permit on href/src/action-like attributes.
  ALLOWED_URI_REGEXP: /^https:|^mailto:/i,
  ALLOW_DATA_ATTR: false,
  RETURN_TRUSTED_TYPE: false,
};

/** Sanitize untrusted HTML from connector email bodies before render. */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html || '', EMAIL_SANITIZE_CONFIG) as string;
}
