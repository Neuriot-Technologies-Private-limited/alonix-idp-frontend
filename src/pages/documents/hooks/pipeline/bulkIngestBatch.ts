import { mergePipeline } from '../../../../services/adminService';
import { isConnectorPendingDocumentId } from '../../../../utils/connectorIngestOptimistic';
import type { DocumentRow } from '../../types/documentRow';

/** Matches the server `MAX_BATCH_INGEST` default. One HTTP call per chunk. */
export const BATCH_INGEST_CHUNK = 50;

export type BulkPipelineAction = 'ingest' | 'extract' | 'classify';

export type BulkPipelineTarget = {
  id: string;
  fileName: string;
  groupId?: string;
  collectionName: string;
};

export type BatchIngestItemResult = {
  id?: string;
  status?: string;
};

const BATCH_ITEM_ERRORS: Record<string, string> = {
  FAILED: 'Could not start ingest.',
  INVALID_ID: 'Invalid document id.',
  NOT_FOUND: 'Document not found.',
  FORBIDDEN: 'You do not have access to this document.',
  INVALID_GROUP: 'Workspace is missing a collection name.',
};

export function chunkList<T>(items: T[], size: number): T[][] {
  if (size < 1) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function groupTargetsByGroup(targets: BulkPipelineTarget[]): Map<string, BulkPipelineTarget[]> {
  const byGroup = new Map<string, BulkPipelineTarget[]>();
  for (const target of targets) {
    const key = target.groupId ? String(target.groupId) : '';
    const list = byGroup.get(key) || [];
    list.push(target);
    byGroup.set(key, list);
  }
  return byGroup;
}

/** Null when the batch item was queued. Otherwise a user-facing reason. */
export function batchIngestItemError(status: string | undefined): string | null {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDING') return null;
  return BATCH_ITEM_ERRORS[normalized] || 'Could not start ingest.';
}

/** Failure lines for the alert. A `PENDING` result is success and is omitted. */
export function collectBatchIngestFailures(
  targets: Array<{ id: string; fileName: string }>,
  results: BatchIngestItemResult[] | undefined
): Array<{ id: string; message: string }> {
  const byId = new Map((results || []).map((item) => [String(item.id), item]));
  const failures: Array<{ id: string; message: string }> = [];
  for (const target of targets) {
    const itemError = batchIngestItemError(byId.get(target.id)?.status);
    if (!itemError) continue;
    failures.push({ id: target.id, message: `${target.fileName}: ${itemError}` });
  }
  return failures;
}

export function selectBulkPipelineTargets(
  documents: DocumentRow[] | undefined,
  selectedIds: Set<string>,
  action: BulkPipelineAction,
  docCanManage: (d: DocumentRow) => boolean
): BulkPipelineTarget[] {
  const targets: BulkPipelineTarget[] = [];
  for (const id of selectedIds) {
    const docItem = documents?.find((d) => d.id === id);
    if (!docItem?.pipeline || !docCanManage(docItem)) continue;
    if (action === 'ingest' && isConnectorPendingDocumentId(id)) continue;
    const pipeline = mergePipeline(docItem.pipeline);
    if (action === 'ingest' && (pipeline.ingestion.status === 'processing' || pipeline.ingestion.status === 'done')) {
      continue;
    }
    if (action === 'extract' && (pipeline.extraction.status === 'processing' || pipeline.extraction.status === 'done')) {
      continue;
    }
    if (
      action === 'classify' &&
      (pipeline.classification.status === 'processing' || pipeline.classification.status === 'done')
    ) {
      continue;
    }
    const groupId = docItem.groupId ? String(docItem.groupId) : undefined;
    targets.push({
      id,
      fileName: docItem.fileName || id,
      groupId,
      collectionName: (docItem.group && String(docItem.group)) || groupId || id,
    });
  }
  return targets;
}
