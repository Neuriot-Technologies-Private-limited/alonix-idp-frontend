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

const EMAIL_SANITIZE_CONFIG: Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
};

/** Sanitize untrusted HTML from connector email bodies before render. */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html || '', EMAIL_SANITIZE_CONFIG) as string;
}
