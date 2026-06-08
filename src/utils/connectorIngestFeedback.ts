import type { QueryClient } from '@tanstack/react-query';
import {
  clearOptimisticConnectorDocuments,
  replaceOptimisticConnectorDocuments,
} from './connectorIngestOptimistic';
import { refreshPipelineDocuments } from './pipelineDocumentsCache';

/** Refresh vault list after connector ingest so Documents → Connectors updates immediately. */
export async function refreshDocumentsAfterConnectorIngest(
  queryClient: QueryClient,
  orgId?: string | null,
  created?: { documentId: string; fileName: string; connectorId: string; connectorType?: string }[]
) {
  if (created?.length) {
    replaceOptimisticConnectorDocuments(queryClient, created, orgId);
  } else {
    clearOptimisticConnectorDocuments(queryClient, orgId);
  }
  await refreshPipelineDocuments(queryClient, orgId);
  await queryClient.invalidateQueries({ queryKey: ['documents', orgId] });
}
