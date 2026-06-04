import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { useAuthStore } from '../../../../stores/authStore';
import { hasProcessingPipelineDocuments } from '../../../../utils/pipelineDocumentsCache';

/** Org document list (vault API). Invalidate with `['documents']`. */
export function useDocuments() {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['documents', orgId],
    queryFn: () => adminService.getDocuments(),
    enabled: !!orgId,
  });
}

/** Pipeline documents for the Documents page; polls while processing. */
export function usePipelineDocuments() {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['pipeline-documents', orgId],
    queryFn: () => adminService.getPipelineDocuments(),
    enabled: !!orgId,
    staleTime: 0,
    refetchInterval: (query) =>
      hasProcessingPipelineDocuments(query.state.data as Record<string, unknown>[] | undefined)
        ? 2_000
        : false,
  });
}
