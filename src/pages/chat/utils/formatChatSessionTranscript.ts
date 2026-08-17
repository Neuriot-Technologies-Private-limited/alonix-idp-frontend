export type ChatTranscriptMessage = {
  query?: unknown;
  answer?: unknown;
  response?: unknown;
  sources?: unknown;
  response_kind?: unknown;
};

export type ChatTranscriptInput = {
  title?: string | null;
  exportedAt?: Date;
  messages: ChatTranscriptMessage[];
};

function toPlainText(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return raw;
}

function answerFromMessage(msg: ChatTranscriptMessage): string {
  const nested =
    msg.response && typeof msg.response === 'object'
      ? (msg.response as Record<string, unknown>).response
      : undefined;
  return toPlainText(msg.answer) || toPlainText(nested) || '';
}

function parseSourcePage(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function sourceLines(sources: unknown): string[] {
  if (!sources) return [];
  const list = Array.isArray(sources)
    ? sources
    : typeof sources === 'object'
      ? Object.values(sources as Record<string, unknown>)
      : [];
  const lines: string[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const title =
      toPlainText(rec.title) ||
      toPlainText(rec.file_name) ||
      toPlainText(rec.fileName) ||
      toPlainText(rec.document);
    if (!title) continue;
    const page = parseSourcePage(rec.page ?? rec.page_number ?? rec.pageNumber);
    lines.push(page != null ? `${title}, page ${page}` : title);
  }
  return lines;
}

function slugTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 48);
  return slug || 'untitled';
}

/** Filesystem-safe transcript name: `chat-{title}-{YYYY-MM-DD}.txt` */
export function buildChatTranscriptFilename(
  title?: string | null,
  now: Date = new Date()
): string {
  const stamp = now.toISOString().slice(0, 10);
  return `chat-${slugTitle(title || 'untitled')}-${stamp}.txt`;
}

export function formatChatSessionTranscript(input: ChatTranscriptInput): string {
  const exportedAt = (input.exportedAt ?? new Date()).toISOString();
  const title = toPlainText(input.title) || 'Untitled';
  const lines: string[] = [
    'Chat session transcript',
    '=======================',
    `Title: ${title}`,
    `Exported: ${exportedAt}`,
    '',
  ];

  if (!input.messages.length) {
    lines.push('No messages in this session.');
    lines.push('');
    return lines.join('\n');
  }

  input.messages.forEach((msg, index) => {
    const kind = String(msg.response_kind || 'answer').trim() || 'answer';
    lines.push(`--- Turn ${index + 1} ---`);
    lines.push('Question:');
    lines.push(toPlainText(msg.query) || '(empty)');
    lines.push('');
    lines.push(kind === 'clarification' ? 'Clarification:' : 'Answer:');
    lines.push(answerFromMessage(msg) || '(empty)');
    const sources = sourceLines(msg.sources);
    if (sources.length > 0) {
      lines.push('');
      lines.push('Sources:');
      for (const src of sources) {
        lines.push(`- ${src}`);
      }
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
