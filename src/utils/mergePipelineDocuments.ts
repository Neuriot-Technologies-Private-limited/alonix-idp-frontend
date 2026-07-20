import { normalizePipelineDocument } from '../services/adminService';
import type { DocumentRow } from '../pages/documents/types/documentRow';

function uploadedAtMs(doc: DocumentRow): number {
  const raw = doc.uploadedAt;
  if (raw == null) return 0;
  const dt = new Date(raw as string | number | Date);
  return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
}

/** Merge org-wide and connector-scoped pipeline rows (connector fetch wins on id collision). */
export function mergePipelineDocumentLists(
  primary: DocumentRow[] | undefined,
  secondary: DocumentRow[] | undefined
): DocumentRow[] {
  const byId = new Map<string, DocumentRow>();
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
