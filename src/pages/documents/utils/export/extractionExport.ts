export function getExtractionText(res: unknown, fmt: string): string {
  if (!res) return '';

  const formats =
    res && typeof res === 'object' && 'formats' in res && typeof (res as { formats?: unknown }).formats === 'object'
      ? ((res as { formats: Record<string, unknown> }).formats as Record<string, unknown>)
      : null;
  if (formats && typeof formats[fmt] === 'string') {
    return formats[fmt] as string;
  }
  if (formats && formats[fmt] && fmt === 'json') {
    return JSON.stringify(formats[fmt], null, 2);
  }

  if (fmt === 'json') return JSON.stringify(res, null, 2);

  const pages = Array.isArray((res as { pages?: unknown })?.pages) ? (res as { pages: unknown[] }).pages : [];
  const toCellString = (value: unknown) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  };
  const getPageNumber = (page: Record<string, unknown>, idx: number) => {
    const pageContent = page?.page_content as Record<string, unknown> | undefined;
    const candidate =
      page?.page_number ?? page?.page ?? page?.pageIndex ?? page?.index ?? pageContent?.page_number;
    const n = Number(candidate);
    return Number.isFinite(n) && n > 0 ? n : idx + 1;
  };
  const getPageKeyValues = (page: Record<string, unknown>): Record<string, unknown> | null => {
    const pageContent = page?.page_content as Record<string, unknown> | undefined;
    const kv = page?.key_value_pairs ?? pageContent?.key_value_pairs ?? page?.fields;
    if (!kv || typeof kv !== 'object' || Array.isArray(kv)) return null;
    return kv as Record<string, unknown>;
  };
  const kvRows: Array<{ page: number; key: string; value: unknown }> = [];
  const pageChunks: Array<{ page: number; keyValues: Record<string, unknown> }> = [];
  pages.forEach((p, idx) => {
    const page = p as Record<string, unknown>;
    const pageNum = getPageNumber(page, idx);
    const keyValues = getPageKeyValues(page);
    if (keyValues) {
      pageChunks.push({ page: pageNum, keyValues });
      for (const [k, v] of Object.entries(keyValues)) {
        kvRows.push({ page: pageNum, key: String(k), value: v });
      }
    }
  });

  if (fmt === 'csv') {
    if (kvRows.length > 0) {
      return [
        'page,key,value',
        ...kvRows.map(
          (r) =>
            `${r.page},"${r.key.replace(/"/g, '""')}","${toCellString(r.value).replace(/"/g, '""')}"`
        ),
      ].join('\n');
    }
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      return (
        Object.keys(res).join(',') +
        '\n' +
        Object.values(res as Record<string, unknown>)
          .map((v) => (Array.isArray(v) ? `"${v.join(';')}"` : `"${v}"`))
          .join(',')
      );
    }
    return String(res);
  }

  if (fmt === 'md') {
    if (pageChunks.length > 0) {
      return pageChunks
        .map(({ page, keyValues }) =>
          [`### Page ${page}`, ...Object.entries(keyValues).map(([k, v]) => `- **${k}**: ${toCellString(v)}`)].join(
            '\n'
          )
        )
        .join('\n\n');
    }
    if (pages.length > 0) {
      return pages
        .map((p, idx) => {
          const pageNum = getPageNumber(p as Record<string, unknown>, idx);
          return `### Page ${pageNum}\n\`\`\`json\n${JSON.stringify(p, null, 2)}\n\`\`\``;
        })
        .join('\n\n');
    }
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      return Object.entries(res as Record<string, unknown>)
        .map(([k, v]) => `**${k}**: ${Array.isArray(v) ? v.map(toCellString).join(', ') : toCellString(v)}`)
        .join('\n\n');
    }
    return String(res);
  }
  return '';
}

export function exportExtractionDownload(data: unknown, fmt: string, filename: string): void {
  const text = getExtractionText(data, fmt);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_extracted.${fmt}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
