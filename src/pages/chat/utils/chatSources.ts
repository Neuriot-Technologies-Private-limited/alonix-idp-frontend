import { sanitizeChatHtml } from '../../../utils/sanitizeChatHtml';
import type { NormSource } from '../types/chatConversation';

/** Referenced in DOM createElement — keep so Tailwind can scan utility strings */
export const SOURCE_PILL_CLASS =
  'inline-block align-baseline rounded-full bg-info/10 px-2 py-0.5 mx-0.5 text-sm cursor-pointer border border-info/20 text-info transition hover:bg-info/20 hover:border-info/30 hover:-translate-y-px';

export function normalizeSource(src: unknown): NormSource {
  if (!src || typeof src !== 'object') {
    return { title: 'Source', url: '#' };
  }
  const s = src as Record<string, unknown>;
  if (typeof s.document === 'string') {
    const fileNameWithUUID = s.document.split('/').pop() || s.document;
    const fileName = fileNameWithUUID.replace(/^[a-f0-9]{32}_/, '');
    const pageNum = s.page ?? s.page_number;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/pdf';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';
    const pathKey =
      (typeof s.file_path === 'string' && s.file_path) ||
      (typeof s.file_key === 'string' && s.file_key) ||
      (typeof s.document === 'string' && s.document) ||
      undefined;
    return {
      title: fileName,
      url: '#',
      page: pageNum ? Number(pageNum) : undefined,
      confidence: s.confidence as number | undefined,
      file_path: pathKey,
      fileKey: pathKey,
      document: typeof s.document === 'string' ? s.document : undefined,
      document_id:
        (typeof s.document_id === 'string' && s.document_id) ||
        (typeof s.documentId === 'string' && s.documentId) ||
        undefined,
      source_file: s.array_buffer ?? s.source_file,
      source_type: (s.type as string) || mimeType,
    };
  }
  const titleRaw = String(
    (s.title as string)?.split('/').pop() ||
      (s.file_name as string)?.split('/').pop() ||
      (s.filename as string)?.split('/').pop() ||
      'Source'
  );
  const fileName = titleRaw.replace(/^[a-f0-9]{32}_/, '');
  const pageNum = s.page ?? s.page_number;
  const pathKey =
    (typeof s.file_path === 'string' && s.file_path) ||
    (typeof s.file_key === 'string' && s.file_key) ||
    (typeof s.document === 'string' && s.document) ||
    undefined;
  return {
    title: fileName,
    url: (s.url as string) || (s.link as string) || '#',
    page: pageNum ? Number(pageNum) : undefined,
    confidence: s.confidence as number | undefined,
    file_path: pathKey,
    fileKey: pathKey,
    document: typeof s.document === 'string' ? s.document : undefined,
    document_id:
      (typeof s.document_id === 'string' && s.document_id) ||
      (typeof s.documentId === 'string' && s.documentId) ||
      undefined,
    source_file: s.source_file,
    source_type: (s.type as string) || 'application/pdf',
  };
}

export function normalizeSourcesPayload(rawSources: unknown): {
  sources: NormSource[];
  sourcesMap: Record<string, NormSource>;
} {
  const sources: NormSource[] = [];
  const sourcesMap: Record<string, NormSource> = {};
  if (!rawSources) return { sources, sourcesMap };

  if (Array.isArray(rawSources)) {
    rawSources.forEach((src, idx) => {
      const normalized = normalizeSource(src);
      const n = idx + 1;
      sources.push(normalized);
      sourcesMap[`[Source ${n}]`] = normalized;
      sourcesMap[`Source ${n}`] = normalized;
      sourcesMap[String(n)] = normalized;
    });
    return { sources, sourcesMap };
  }

  if (typeof rawSources === 'object') {
    Object.keys(rawSources as object).forEach((key) => {
      const normalized = normalizeSource((rawSources as Record<string, unknown>)[key]);
      sources.push(normalized);
      sourcesMap[key] = normalized;
      const numMatch = key.match(/Source\s+(\d+)/i) || (/^\d+$/.test(key) ? [key, key] : null);
      if (numMatch?.[1]) {
        sourcesMap[`[Source ${numMatch[1]}]`] = normalized;
        sourcesMap[`Source ${numMatch[1]}`] = normalized;
        sourcesMap[numMatch[1]] = normalized;
      }
    });
  }

  return { sources, sourcesMap };
}

const SOURCE_CITE_PATTERN =
  /\[\s*(?:Source\s+\d+\s*(?:,\s*)?)+\s*\]|\(\s*(?:Source\s+\d+\s*(?:,\s*)?)+\s*\)/gi;

function citationNumbers(raw: string): string[] {
  return [...raw.matchAll(/Source\s+(\d+)/gi)].map((m) => m[1]);
}

export function parseHtmlWithSources(html: string, sourcesMap: Record<string, NormSource> = {}): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizeChatHtml(html);

  const lookupSource = (num: string): NormSource | undefined =>
    sourcesMap[`[Source ${num}]`] || sourcesMap[`Source ${num}`] || sourcesMap[num];

  const makePill = (num: string): HTMLElement => {
    const sourceKey = `[Source ${num}]`;
    const source = lookupSource(num);
    const pill = document.createElement('span');
    pill.className = SOURCE_PILL_CLASS;
    pill.setAttribute('data-source-key', sourceKey);
    pill.setAttribute('data-source-title', source?.title || `Source ${num}`);
    pill.setAttribute('data-source-page', source?.page != null ? String(source.page) : '');
    pill.setAttribute('data-source-filepath', source?.file_path ?? '');
    pill.setAttribute('data-source-confidence', String(source?.confidence ?? ''));
    pill.textContent = '↗';
    return pill;
  };

  const appendPills = (fragment: DocumentFragment, nums: string[]) => {
    nums.forEach((num, i) => {
      fragment.appendChild(makePill(num));
      if (i < nums.length - 1) fragment.appendChild(document.createTextNode(' '));
    });
  };

  const replaceCitationsInTextNode = (node: Text) => {
    if (node.parentElement?.closest('[data-source-key]')) return;
    const txt = node.textContent || '';
    const matches = [...txt.matchAll(SOURCE_CITE_PATTERN)];
    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    matches.forEach((match) => {
      if (match.index === undefined) return;
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(txt.substring(lastIndex, match.index)));
      }
      const nums = citationNumbers(match[0]);
      if (nums.length > 0) appendPills(fragment, nums);
      else fragment.appendChild(document.createTextNode(match[0]));
      lastIndex = match.index + match[0].length;
    });
    if (lastIndex < txt.length) {
      fragment.appendChild(document.createTextNode(txt.substring(lastIndex)));
    }
    node.parentNode?.replaceChild(fragment, node);
  };

  const collectTextNodes = (): Text[] => {
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current: Node | null;
    while ((current = walker.nextNode())) {
      if (current.nodeType === Node.TEXT_NODE) textNodes.push(current as Text);
    }
    return textNodes;
  };

  collectTextNodes().forEach(replaceCitationsInTextNode);

  tempDiv.querySelectorAll('a').forEach((anchor) => {
    const existingPill = anchor.querySelector('[data-source-key]');
    if (existingPill) {
      anchor.replaceWith(existingPill);
      return;
    }
    const label = (anchor.textContent || '').trim();
    const nums = citationNumbers(label);
    if (nums.length === 0) return;
    if (!/^\[?\(?\s*Source\s+\d+/i.test(label)) return;
    const fragment = document.createDocumentFragment();
    appendPills(fragment, nums);
    anchor.replaceWith(fragment);
  });

  tempDiv.querySelectorAll('[data-source-key]').forEach((pill) => {
    let sibling = pill.nextSibling;
    while (sibling && sibling.nodeType === Node.TEXT_NODE && !String(sibling.textContent || '').trim()) {
      sibling = sibling.nextSibling;
    }
    if (
      sibling &&
      sibling.nodeType === Node.ELEMENT_NODE &&
      (sibling as Element).getAttribute('data-source-key') === pill.getAttribute('data-source-key')
    ) {
      sibling.parentNode?.removeChild(sibling);
    }
  });

  return sanitizeChatHtml(tempDiv.innerHTML);
}
