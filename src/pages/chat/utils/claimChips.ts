import { sanitizeChatHtml } from '../../../utils/sanitizeChatHtml';

/** Referenced in DOM createElement — keep so Tailwind can scan utility strings */
export const CLAIM_PILL_CLASS =
  'claim-id-pill inline-flex align-baseline items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 mx-0.5 text-[11px] font-semibold text-primary cursor-pointer transition hover:bg-primary/20 hover:border-primary/40';

export function normalizeClaimIds(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const value = String(item ?? '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Turn known claim IDs in answer HTML into the same chip language as source pills. */
export function highlightClaimIdsInHtml(html: string, claimIds: string[]): string {
  const ids = normalizeClaimIds(claimIds).sort((a, b) => b.length - a.length);
  if (ids.length === 0) return html;
  const pattern = new RegExp(
    `(?<![A-Za-z0-9_])(${ids.map(escapeRegExp).join('|')})(?![A-Za-z0-9_])`,
    'g'
  );

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizeChatHtml(html);
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current.parentElement?.closest('[data-claim-id],[data-source-key]')) continue;
    if (current.nodeType === Node.TEXT_NODE) textNodes.push(current as Text);
  }

  textNodes.forEach((node) => {
    const txt = node.textContent || '';
    const matches = [...txt.matchAll(pattern)];
    if (matches.length === 0) return;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    matches.forEach((match) => {
      if (match.index === undefined) return;
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(txt.substring(lastIndex, match.index)));
      }
      const id = match[1];
      const pill = document.createElement('span');
      pill.className = CLAIM_PILL_CLASS;
      pill.setAttribute('data-claim-id', id);
      pill.setAttribute('title', `Claim ID ${id}`);
      pill.textContent = `# ${id}`;
      fragment.appendChild(pill);
      lastIndex = match.index + match[0].length;
    });
    if (lastIndex < txt.length) {
      fragment.appendChild(document.createTextNode(txt.substring(lastIndex)));
    }
    node.parentNode?.replaceChild(fragment, node);
  });

  return sanitizeChatHtml(tempDiv.innerHTML);
}
