import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { useAuthStore } from '../../../../stores/authStore';
import { useSessionReady } from '../../../../hooks/useSessionReady';
import { mergePipelineDocumentLists } from '../../../../utils/mergePipelineDocuments';

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

/**
 * Pipeline documents for the Documents page.
 * Single query merges org-wide + connector rows (parallel fetch, one cache key).
 * No polling while stages run — live updates use socket job.update + explicit invalidation.
 */
export function usePipelineDocuments() {
  const sessionReady = useSessionReady();
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const enabled = sessionReady && !!orgId;

  const query = useQuery({
    queryKey: ['pipeline-documents', orgId, 'all'],
    queryFn: async () => {
      const [primary, connector] = await Promise.all([
        adminService.getPipelineDocuments({ limit: 100 }),
        adminService.getPipelineDocuments({ ingestSource: 'connector', limit: 500 }),
      ]);
      return mergePipelineDocumentLists(primary, connector);
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
