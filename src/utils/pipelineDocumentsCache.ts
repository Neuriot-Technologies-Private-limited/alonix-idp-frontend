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

export function pipelineDocumentsQueryKey(orgId?: string | null) {
  const oid =
    orgId ?? useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId ?? null;
  return ['pipeline-documents', oid] as const;
}

export function patchPipelineDocumentsCache(
  queryClient: QueryClient,
  updater: (docs: Record<string, unknown>[]) => Record<string, unknown>[],
  orgId?: string | null
) {
  const key = pipelineDocumentsQueryKey(orgId);
  const prev = queryClient.getQueryData<Record<string, unknown>[]>(key);
  if (!prev) return;
  queryClient.setQueryData(key, updater([...prev]));
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
    const p = mergePipeline(d.pipeline);
    return (
      p.ingestion.status === 'processing' ||
      p.extraction.status === 'processing' ||
      p.classification.status === 'processing'
    );
  });
}

/** Invalidate and immediately refetch the active documents query (no stale UI gap). */
export async function refreshPipelineDocuments(queryClient: QueryClient, orgId?: string | null) {
  const key = pipelineDocumentsQueryKey(orgId);
  await queryClient.invalidateQueries({ queryKey: key });
  await queryClient.refetchQueries({ queryKey: key, type: 'active' });
}
