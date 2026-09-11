import { marked } from 'marked';
import { sanitizeChatHtml } from '../../../utils/sanitizeChatHtml';

/** Keep [Source N] intact so marked does not turn it into a markdown link. */
function protectSourceCitations(raw: string): string {
  return raw
    .replace(/\[Source\s+(\d+)\]\s*\([^)]*\)/gi, (_m, n: string) => `@@FIND_SRC_${n}@@`)
    .replace(/\[Source\s+(\d+)\]/gi, (_m, n: string) => `@@FIND_SRC_${n}@@`);
}

function restoreSourceCitations(html: string): string {
  return html.replace(/@@FIND_SRC_(\d+)@@/gi, (_m, n: string) => `[Source ${n}]`);
}

export function mdToHtml(raw: string): string {
  try {
    const out = marked.parse(protectSourceCitations(raw || ''), { async: false });
    const html = typeof out === 'string' ? out : '';
    return sanitizeChatHtml(restoreSourceCitations(html));
  } catch {
    return sanitizeChatHtml(raw || '');
  }
}
