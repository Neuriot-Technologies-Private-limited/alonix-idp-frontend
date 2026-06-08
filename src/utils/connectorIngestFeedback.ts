import type { QueryClient } from '@tanstack/react-query';
import { pipelineDocumentsQueryKey } from './pipelineDocumentsCache';

/** Refresh vault list after connector ingest so Documents → Connectors updates immediately. */
export async function refreshDocumentsAfterConnectorIngest(
  queryClient: QueryClient,
  orgId?: string | null
) {
  const pipelineKey = pipelineDocumentsQueryKey(orgId);
  await queryClient.invalidateQueries({ queryKey: pipelineKey });
  await queryClient.refetchQueries({ queryKey: pipelineKey, type: 'active' });
  await queryClient.invalidateQueries({ queryKey: ['documents', orgId] });
}
