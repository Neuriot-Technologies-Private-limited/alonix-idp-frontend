import type { QueryClient } from '@tanstack/react-query';
import {
  clearOptimisticConnectorDocuments,
  ensureConnectorDocumentsInCache,
  replaceOptimisticConnectorDocuments,
  type ConnectorIngestCreatedRow,
} from './connectorIngestOptimistic';
import { refreshPipelineDocuments } from './pipelineDocumentsCache';

/** Refresh vault list after connector ingest so Documents → Connectors updates immediately. */
export async function refreshDocumentsAfterConnectorIngest(
  queryClient: QueryClient,
  orgId?: string | null,
  created?: ConnectorIngestCreatedRow[],
  groupId?: string | null
) {
  const snapshot = created?.length ? [...created] : [];

  if (snapshot.length) {
    replaceOptimisticConnectorDocuments(queryClient, snapshot, orgId, groupId);
  }

  await refreshPipelineDocuments(queryClient, orgId);

  if (snapshot.length) {
    ensureConnectorDocumentsInCache(queryClient, snapshot, orgId, groupId);
  } else {
    clearOptimisticConnectorDocuments(queryClient, orgId);
  }
}
