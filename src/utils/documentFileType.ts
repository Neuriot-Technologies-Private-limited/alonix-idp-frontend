/** Extension label for pipeline rows (matches backend mapDocumentToPipelineRow). */
export function inferDocumentFileType(fileName?: string | null, fallback = 'FILE'): string {
  const name = String(fileName || '').trim();
  if (!name.includes('.')) return fallback;
  const ext = name.split('.').pop()?.trim().toUpperCase().slice(0, 5);
  return ext || fallback;
}

export function normalizeDocumentTypeLabel(type?: string | null, fileName?: string | null): string {
  const raw = String(type ?? '').trim();
  if (raw) return raw.toUpperCase().slice(0, 5);
  return inferDocumentFileType(fileName);
}
