import { normalizePipelineDocument } from '../services/adminService';

function uploadedAtMs(doc: Record<string, unknown>): number {
  const raw = doc.uploadedAt;
  if (raw == null) return 0;
  const dt = new Date(raw as string | number | Date);
  return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
}

/** Merge org-wide and connector-scoped pipeline rows (connector fetch wins on id collision). */
export function mergePipelineDocumentLists(
  primary: Record<string, unknown>[] | undefined,
  secondary: Record<string, unknown>[] | undefined
): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of primary || []) {
    const normalized = normalizePipelineDocument(row);
    byId.set(String(normalized.id), normalized);
  }
  for (const row of secondary || []) {
    const normalized = normalizePipelineDocument(row);
    byId.set(String(normalized.id), normalized);
  }
  return [...byId.values()].sort((a, b) => uploadedAtMs(b) - uploadedAtMs(a));
}
