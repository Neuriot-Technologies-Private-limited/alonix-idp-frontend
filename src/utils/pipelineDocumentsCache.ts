import type { QueryClient } from '@tanstack/react-query';
import { mergePipeline, normalizePipelineDocument } from '../services/adminService';
import { useAuthStore } from '../stores/authStore';

export type PipelineStageKey = 'ingestion' | 'extraction' | 'classification';

export type PipelineStageStatus = 'idle' | 'processing' | 'done' | 'error';

export function readPipelineStageStatus(
  pipeline: unknown,
  stage: PipelineStageKey
): PipelineStageStatus {
  const p = mergePipeline(pipeline);
  const raw = p[stage]?.status;
  if (raw === 'processing' || raw === 'done' || raw === 'error' || raw === 'idle') {
    return raw;
  }
  return 'idle';
}

export function pipelineDocumentsQueryKey(orgId?: string | null, scope: 'all' | 'connector' = 'all') {
  const oid =
    orgId ?? useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId ?? null;
  return ['pipeline-documents', oid, scope] as const;
}

export function pipelineDocumentsQueryPrefix(orgId?: string | null) {
  const oid =
    orgId ?? useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId ?? null;
  return ['pipeline-documents', oid] as const;
}

export function patchPipelineDocumentsCache(
  queryClient: QueryClient,
  updater: (docs: Record<string, unknown>[]) => Record<string, unknown>[],
  orgId?: string | null
) {
  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key);
  if (!prev) return;
  queryClient.setQueryData(key, updater([...prev]));
}

export type JobUpdatePayload = {
  documentId?: string;
  taskType?: string;
  status?: string;
  error?: string | null;
  timestamps?: { startTime?: string | Date | null; endTime?: string | Date | null };
};

function jobTaskToStage(taskType: string | undefined): PipelineStageKey | null {
  const task = String(taskType || '').toUpperCase();
  if (task === 'INGEST' || task === 'PROCESS_DOCUMENT') return 'ingestion';
  if (task === 'EXTRACT') return 'extraction';
  if (task === 'CLASSIFY') return 'classification';
  return null;
}

function mapJobStatusToStageStatus(status: string | undefined): PipelineStageStatus {
  const u = String(status || '').toUpperCase();
  if (u === 'PENDING' || u === 'PROCESSING' || u === 'RUNNING') return 'processing';
  if (u === 'COMPLETED' || u === 'DONE' || u === 'SUCCESS' || u === 'SUCCEEDED') return 'done';
  if (u === 'FAILED' || u === 'ERROR') return 'error';
  return 'idle';
}

/** Apply websocket job.update to the vault list without refetching the org API. */
export function applyJobUpdateToPipelineCache(
  queryClient: QueryClient,
  payload: JobUpdatePayload,
  orgId?: string | null
) {
  const docId = payload?.documentId ? String(payload.documentId) : '';
  const stage = jobTaskToStage(payload.taskType);
  if (!docId || !stage) return;

  const key = pipelineDocumentsQueryKey(orgId, 'all');
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key);
  const docInCache = prev?.some(
    (d) => String(d.id) === docId || String(d._id ?? '') === docId
  );
  // No HTTP refetch — list is loaded once; optimistic + socket job.update own live state.
  if (!docInCache || !prev) return;

  const status = mapJobStatusToStageStatus(payload.status);
  const startTime =
    payload.timestamps?.startTime != null ? String(payload.timestamps.startTime) : null;
  const endTime = payload.timestamps?.endTime != null ? String(payload.timestamps.endTime) : null;
  const errorMessage = payload.error ? String(payload.error).slice(0, 500) : null;

  patchPipelineDocumentsCache(
    queryClient,
    (docs) =>
      docs.map((d) => {
        if (String(d.id) !== docId && String(d._id ?? '') !== docId) return d;
        const p = mergePipeline(d.pipeline);
        const prevStage = p[stage] as Record<string, unknown> | undefined;
        const nextStage: Record<string, unknown> = {
          ...prevStage,
          status,
          startTime: startTime ?? prevStage?.startTime ?? null,
          endTime:
            endTime ??
            (status === 'done' || status === 'error' ? new Date().toISOString() : null),
        };
        if (status === 'error' && errorMessage) nextStage.errorMessage = errorMessage;
        return normalizePipelineDocument({
          ...d,
          pipeline: { ...p, [stage]: nextStage },
        });
      }),
    orgId
  );
}

export function pipelineActionToStage(
  action: 'ingest' | 'extract' | 'classify'
): PipelineStageKey {
  if (action === 'ingest') return 'ingestion';
  if (action === 'extract') return 'extraction';
  return 'classification';
}

/** Immediate UI: mark a pipeline stage as in-flight before the API round-trip completes. */
export function optimisticSetPipelineStage(
  queryClient: QueryClient,
  docId: string,
  stage: PipelineStageKey,
  status: PipelineStageStatus = 'processing',
  orgId?: string | null
) {
  const now = new Date().toISOString();
  patchPipelineDocumentsCache(queryClient, (docs) =>
    docs.map((d) => {
      if (String(d.id) !== String(docId)) return d;
      const p = mergePipeline(d.pipeline);
      const nextPipeline = {
        ...p,
        [stage]: { status, startTime: now, endTime: null },
      };
      return normalizePipelineDocument({
        ...d,
        pipeline: nextPipeline,
      });
    }),
    orgId
  );
}

/** Undo a failed optimistic update (restore stage before the API call). */
export function revertPipelineStage(
  queryClient: QueryClient,
  docId: string,
  stage: PipelineStageKey,
  previousStatus: PipelineStageStatus,
  orgId?: string | null
) {
  optimisticSetPipelineStage(queryClient, docId, stage, previousStatus, orgId);
}

/** API failed to start this stage — show error on lifecycle (not idle). */
export function markPipelineStageFailed(
  queryClient: QueryClient,
  docId: string,
  stage: PipelineStageKey,
  orgId?: string | null
) {
  const now = new Date().toISOString();
  patchPipelineDocumentsCache(
    queryClient,
    (docs) =>
      docs.map((d) => {
        if (String(d.id) !== String(docId)) return d;
        const p = mergePipeline(d.pipeline);
        return normalizePipelineDocument({
          ...d,
          pipeline: {
            ...p,
            [stage]: { status: 'error', startTime: now, endTime: now },
          },
        });
      }),
    orgId
  );
}

/** Show a newly uploaded file in the vault list as soon as upload API returns. */
export function optimisticAppendUploadedDocument(
  queryClient: QueryClient,
  payload: {
    id: string;
    fileName: string;
    groupId: string;
    groupName?: string;
    uploader?: string;
    sensitivityLevel?: string;
  },
  orgId?: string | null
) {
  const row = normalizePipelineDocument({
    id: payload.id,
    fileName: payload.fileName,
    groupId: payload.groupId,
    group: payload.groupName || '',
    uploader: payload.uploader,
    sensitivityLevel: payload.sensitivityLevel,
    uploadedAt: new Date().toISOString(),
    pipeline: mergePipeline(null),
  });

  const key = pipelineDocumentsQueryKey(orgId);
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key) ?? [];
  queryClient.setQueryData(key, () => {
    if (prev.some((d) => String(d.id) === String(payload.id))) return prev;
    return [row, ...prev];
  });
}

export function hasProcessingPipelineDocuments(docs: Record<string, unknown>[] | undefined): boolean {
  if (!docs?.length) return false;
  return docs.some((d) => {
    const id = String(d.id || '');
    if (id.startsWith('connector-pending-')) return true;
    const p = mergePipeline(d.pipeline);
    return (
      p.ingestion.status === 'processing' ||
      p.extraction.status === 'processing' ||
      p.classification.status === 'processing'
    );
  });
}

const REFRESH_DEBOUNCE_MS = 1500;
let refreshDebounceTimer: number | null = null;
let refreshResolvers: Array<() => void> = [];
let refreshInFlight = false;
let refreshQueued = false;

async function runPipelineDocumentsRefresh(queryClient: QueryClient, orgId?: string | null) {
  if (refreshInFlight) {
    refreshQueued = true;
    return;
  }
  refreshInFlight = true;
  try {
    const prefix = pipelineDocumentsQueryPrefix(orgId);
    await queryClient.invalidateQueries({ queryKey: prefix });
    await queryClient.refetchQueries({ queryKey: prefix, type: 'active' });
  } finally {
    refreshInFlight = false;
    if (refreshQueued) {
      refreshQueued = false;
      await runPipelineDocumentsRefresh(queryClient, orgId);
    }
  }
}

/** Invalidate and refetch pipeline lists (debounced to avoid request storms). */
export function refreshPipelineDocuments(
  queryClient: QueryClient,
  orgId?: string | null
): Promise<void> {
  return new Promise((resolve) => {
    refreshResolvers.push(resolve);
    if (refreshDebounceTimer) window.clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = window.setTimeout(() => {
      refreshDebounceTimer = null;
      const resolvers = refreshResolvers;
      refreshResolvers = [];
      void (async () => {
        try {
          await runPipelineDocumentsRefresh(queryClient, orgId);
        } finally {
          resolvers.forEach((done) => done());
        }
      })();
    }, REFRESH_DEBOUNCE_MS);
  });
}
