import { marked } from 'marked';
import { sanitizeChatHtml } from '../../../utils/sanitizeChatHtml';

export function mdToHtml(raw: string): string {
  try {
    const out = marked.parse(raw || '', { async: false });
    const html = typeof out === 'string' ? out : '';
    return sanitizeChatHtml(html);
  } catch {
    return sanitizeChatHtml(raw || '');
  }
}
