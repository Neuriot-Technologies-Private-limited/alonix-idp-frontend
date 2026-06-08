import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { useAuthStore } from '../../../../stores/authStore';
import { useSessionReady } from '../../../../hooks/useSessionReady';
import { hasProcessingPipelineDocuments } from '../../../../utils/pipelineDocumentsCache';
import { mergePipelineDocumentLists } from '../../../../utils/mergePipelineDocuments';

const PIPELINE_POLL_MS = 5000;

/** Org document list (vault API). Invalidate with `['documents']`. */
export function useDocuments() {
  const sessionReady = useSessionReady();
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['documents', orgId],
    queryFn: () => adminService.getDocuments(),
    enabled: sessionReady && !!orgId,
  });
}

/** Pipeline documents for the Documents page; polls while processing. */
export function usePipelineDocuments() {
  const sessionReady = useSessionReady();
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const enabled = sessionReady && !!orgId;

  const allQuery = useQuery({
    queryKey: ['pipeline-documents', orgId, 'all'],
    queryFn: () => adminService.getPipelineDocuments({ limit: 100 }),
    enabled,
    staleTime: PIPELINE_POLL_MS,
    refetchOnWindowFocus: false,
  });

  const connectorQuery = useQuery({
    queryKey: ['pipeline-documents', orgId, 'connector'],
    queryFn: () => adminService.getPipelineDocuments({ ingestSource: 'connector', limit: 200 }),
    enabled,
    staleTime: PIPELINE_POLL_MS,
    refetchOnWindowFocus: false,
  });

  const merged = React.useMemo(
    () => mergePipelineDocumentLists(allQuery.data, connectorQuery.data),
    [allQuery.data, connectorQuery.data]
  );

  const shouldPoll = React.useMemo(
    () => enabled && hasProcessingPipelineDocuments(merged),
    [enabled, merged]
  );

  const allRefetchRef = React.useRef(allQuery.refetch);
  allRefetchRef.current = allQuery.refetch;
  const connectorRefetchRef = React.useRef(connectorQuery.refetch);
  connectorRefetchRef.current = connectorQuery.refetch;

  React.useEffect(() => {
    if (!shouldPoll) return undefined;
    const timer = window.setInterval(() => {
      void allRefetchRef.current();
      void connectorRefetchRef.current();
    }, PIPELINE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPoll]);

  return {
    data: merged,
    isLoading: allQuery.isLoading || connectorQuery.isLoading,
    isFetching: allQuery.isFetching || connectorQuery.isFetching,
    isError: allQuery.isError || connectorQuery.isError,
    error: allQuery.error || connectorQuery.error,
    refetch: async () => {
      await Promise.all([allQuery.refetch(), connectorQuery.refetch()]);
    },
  };
}
