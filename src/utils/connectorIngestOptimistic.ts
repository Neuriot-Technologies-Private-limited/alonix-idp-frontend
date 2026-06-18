import type { QueryClient } from '@tanstack/react-query';
import type { EmailAttachmentPreview, EmailDetail } from '../services/connectorBrowserApi';
import { mergePipeline, normalizePipelineDocument } from '../services/adminService';
import {
  pipelineDocumentsQueryKey,
} from './pipelineDocumentsCache';

export const CONNECTOR_PENDING_ID_PREFIX = 'connector-pending-';

const PIPELINE_STAGE_IDLE = { status: 'idle' as const, startTime: null, endTime: null };

export type ConnectorIngestCreatedRow = {
  documentId: string;
  fileName: string;
  connectorId: string;
  connectorType?: string;
  existing?: boolean;
};

function pipelineStageProcessing() {
  return { status: 'processing' as const, startTime: new Date().toISOString(), endTime: null };
}

export function isConnectorPendingDocumentId(id: unknown): boolean {
  return String(id || '').startsWith(CONNECTOR_PENDING_ID_PREFIX);
}

export function parseConnectorPendingDocumentId(
  id: unknown
): { connectorId: string; fileName: string } | null {
  const raw = String(id || '');
  if (!isConnectorPendingDocumentId(raw)) return null;
  const rest = raw.slice(CONNECTOR_PENDING_ID_PREFIX.length);
  const sep = rest.indexOf('::');
  if (sep < 0) return null;
  return { connectorId: rest.slice(0, sep), fileName: rest.slice(sep + 2) };
}

export function resolveSelectedIngestFileNames(
  emailDetail: EmailDetail | undefined,
  options: {
    ingestAllIngestable?: boolean;
    attachmentIds?: string[];
    archivePaths?: string[];
  }
): string[] {
  if (!emailDetail) return [];
  const attachmentIdSet = new Set((options.attachmentIds || []).map(String));
  const archivePathSet = new Set((options.archivePaths || []).map(String));
  const ingestAll = Boolean(options.ingestAllIngestable);
  const names: string[] = [];

  emailDetail.attachments.forEach((att: EmailAttachmentPreview, index) => {
    const attId = att.id || `att-${index}`;
    if (att.archiveEntries?.length) {
      for (const entry of att.archiveEntries) {
        if (!entry.ingestable) continue;
        const selected =
          ingestAll || archivePathSet.has(entry.sourceKey) || attachmentIdSet.has(attId);
        if (selected) names.push(entry.fileName);
      }
      return;
    }
    if (!att.ingestable) return;
    if (ingestAll || attachmentIdSet.has(attId)) {
      names.push(att.fileName);
    }
  });

  return [...new Set(names)];
}

export function optimisticAppendConnectorDocuments(
  queryClient: QueryClient,
  files: { fileName: string; connectorId: string; connectorType?: string }[],
  orgId?: string | null,
  groupId?: string | null
) {
  if (!files.length) return;
  const now = new Date().toISOString();
  const rows = files.map((file) =>
    normalizePipelineDocument({
      id: `${CONNECTOR_PENDING_ID_PREFIX}${file.connectorId}::${file.fileName}`,
      fileName: file.fileName,
      title: file.fileName.replace(/\.[^/.]+$/, '') || file.fileName,
      type: file.fileName.includes('.')
        ? file.fileName.split('.').pop()?.toUpperCase().slice(0, 5) || 'FILE'
        : 'FILE',
      groupId: groupId || '',
      group: '',
      uploader: 'SYSTEM_CONNECTOR',
      uploadedBy: 'SYSTEM_CONNECTOR',
      connectorId: file.connectorId,
      sourceType: file.connectorType || 'EMAIL',
      ingestSource: 'connector',
      uploadedAt: now,
      pipeline: {
        ingestion: pipelineStageProcessing(),
        extraction: PIPELINE_STAGE_IDLE,
        classification: PIPELINE_STAGE_IDLE,
      },
    })
  );

  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  queryClient.setQueryData(key, () => {
    const withoutDupes = prev.filter(
      (d) =>
        !rows.some(
          (row) => String(row.fileName) === String(d.fileName) && isConnectorPendingDocumentId(d.id)
        )
    );
    return [...rows, ...withoutDupes];
  });
}

export function clearOptimisticConnectorDocuments(
  queryClient: QueryClient,
  orgId?: string | null,
  fileNames?: string[]
) {
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key);
  if (!prev?.length) return;
  const nameSet = fileNames?.length ? new Set(fileNames.map(String)) : null;
  queryClient.setQueryData(key, prev.filter((d) => {
    if (!isConnectorPendingDocumentId(d.id)) return true;
    if (!nameSet) return false;
    return !nameSet.has(String(d.fileName));
  }));
}

export function failOptimisticConnectorDocuments(
  queryClient: QueryClient,
  fileNames: string[],
  orgId?: string | null,
  groupId?: string | null,
  errorMessage = 'Connector ingest failed'
) {
  if (!fileNames.length) return;
  const nameSet = new Set(fileNames.map(String));
  const now = new Date().toISOString();
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  let changed = false;
  const next = prev.map((d) => {
    if (!isConnectorPendingDocumentId(d.id)) return d;
    if (!nameSet.has(String(d.fileName))) return d;
    changed = true;
    const pipeline = mergePipeline(d.pipeline);
    return normalizePipelineDocument({
      ...d,
      groupId: groupId || d.groupId || '',
      pipeline: {
        ...pipeline,
        ingestion: {
          status: 'error',
          startTime: pipeline.ingestion.startTime || now,
          endTime: now,
          errorMessage,
        },
      },
    });
  });
  if (changed) queryClient.setQueryData(key, next);
}

export function replaceOptimisticConnectorDocuments(
  queryClient: QueryClient,
  created: ConnectorIngestCreatedRow[],
  orgId?: string | null,
  groupId?: string | null
) {
  if (!created.length) return;
  clearOptimisticConnectorDocuments(
    queryClient,
    orgId,
    created.map((row) => row.fileName)
  );

  const now = new Date().toISOString();
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  const existingIds = new Set(prev.map((d) => String(d.id)));
  const newRows = created
    .filter((row) => !existingIds.has(row.documentId))
    .map((row) =>
      normalizePipelineDocument({
        id: row.documentId,
        fileName: row.fileName,
        title: row.fileName.replace(/\.[^/.]+$/, '') || row.fileName,
        groupId: groupId || '',
        connectorId: row.connectorId,
        sourceType: row.connectorType || 'EMAIL',
        ingestSource: 'connector',
        uploadedBy: 'SYSTEM_CONNECTOR',
        uploader: 'SYSTEM_CONNECTOR',
        uploadedAt: now,
        pipeline: {
          ingestion: row.existing
            ? { status: 'done' as const, startTime: now, endTime: now }
            : pipelineStageProcessing(),
          extraction: PIPELINE_STAGE_IDLE,
          classification: PIPELINE_STAGE_IDLE,
        },
      })
    );
  queryClient.setQueryData(key, [...newRows, ...prev]);
}

/** Re-insert ingested rows if the org pipeline refetch did not include them yet. */
export function ensureConnectorDocumentsInCache(
  queryClient: QueryClient,
  created: ConnectorIngestCreatedRow[],
  orgId?: string | null,
  groupId?: string | null
) {
  if (!created.length) return;
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  const existingIds = new Set(prev.map((d) => String(d.id)));
  const missing = created.filter((row) => !existingIds.has(row.documentId));
  if (!missing.length) return;
  replaceOptimisticConnectorDocuments(queryClient, missing, orgId, groupId);
}

export function hasConnectorPendingDocuments(docs: Record<string, unknown>[] | undefined): boolean {
  return Boolean(docs?.some((d) => isConnectorPendingDocumentId(d.id)));
}

export function listPendingConnectorFileNames(
  queryClient: QueryClient,
  orgId?: string | null
): string[] {
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  return prev
    .filter((d) => isConnectorPendingDocumentId(d.id))
    .map((d) => String(d.fileName));
}
