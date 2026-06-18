import type { QueryClient } from '@tanstack/react-query';
import {
  ensureConnectorDocumentsInCache,
  failOptimisticConnectorDocuments,
  replaceOptimisticConnectorDocuments,
  type ConnectorIngestCreatedRow,
} from './connectorIngestOptimistic';
import { refreshPipelineDocuments } from './pipelineDocumentsCache';

export type ConnectorIngestRefreshOptions = {
  failedFileNames?: string[];
  errorMessage?: string;
};

/** Refresh vault list after connector ingest so Documents → Connectors updates immediately. */
export async function refreshDocumentsAfterConnectorIngest(
  queryClient: QueryClient,
  orgId?: string | null,
  created?: ConnectorIngestCreatedRow[],
  groupId?: string | null,
  options?: ConnectorIngestRefreshOptions
) {
  const snapshot = created?.length ? [...created] : [];

  if (snapshot.length) {
    replaceOptimisticConnectorDocuments(queryClient, snapshot, orgId, groupId);
  }

  await refreshPipelineDocuments(queryClient, orgId);

  if (snapshot.length) {
    ensureConnectorDocumentsInCache(queryClient, snapshot, orgId, groupId);
  }

  if (options?.failedFileNames?.length) {
    failOptimisticConnectorDocuments(
      queryClient,
      options.failedFileNames,
      orgId,
      groupId,
      options.errorMessage
    );
  }
}
