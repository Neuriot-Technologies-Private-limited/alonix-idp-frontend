import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  triggerIngest,
  triggerBatchIngest,
  triggerExtract,
  triggerClassify,
} from '../../../../services/chatApi';
import { connectSocket, getSocket } from '../../../../services/chatSocket';
import { billingSubscriptionQueryKey } from '../../../../hooks/useOrgQuota';
import { quotaErrorMessage } from '../../../../utils/billingQuota';
import {
  applyJobUpdateToPipelineCache,
  markPipelineStageFailed,
  optimisticSetPipelineStage,
  pipelineActionToStage,
  type JobUpdatePayload,
} from '../../../../utils/pipelineDocumentsCache';
import { refreshDocumentsAfterConnectorIngest } from '../../../../utils/connectorIngestFeedback';
import type { ConnectorIngestCreatedRow } from '../../../../utils/connectorIngestOptimistic';
import {
  isConnectorPendingDocumentId,
  parseConnectorPendingDocumentId,
} from '../../../../utils/connectorIngestOptimistic';
import { useAlert } from '../../../../components/alert';
import type { DocumentRow } from '../../types/documentRow';
import {
  BATCH_INGEST_CHUNK,
  chunkList,
  collectBatchIngestFailures,
  groupTargetsByGroup,
  selectBulkPipelineTargets,
} from './bulkIngestBatch';

type PipelineAction = 'ingest' | 'extract' | 'classify';

type ConnectorIngestSocketPayload = {
  orgId?: string;
  groupId?: string;
  connectorId?: string;
  connectorType?: string;
  documents?: ConnectorIngestCreatedRow[];
};

export function useDocumentPipeline(
  documents: DocumentRow[] | undefined,
  docCanManage: (d: DocumentRow) => boolean,
  orgId: string | null | undefined,
  userEmail: string | undefined,
  userGroupId: string | undefined
) {
  const queryClient = useQueryClient();
  const { alert: appAlert } = useAlert();
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<PipelineAction | null>(null);

  const bustKey = (docId: string, action: string) => `${docId}:${action}`;
  const bulkBusyActive = bulkBusy !== null;

  const runPipeline = async (docId: string, action: PipelineAction) => {
    const docRow = documents?.find((d: DocumentRow) => d.id === docId);
    if (docRow && !docCanManage(docRow)) return;
    if (action === 'ingest' && isConnectorPendingDocumentId(docId)) {
      const parsed = parseConnectorPendingDocumentId(docId);
      await appAlert({
        title: 'Re-ingest from connector',
        description: parsed
          ? `“${parsed.fileName}” was not saved to the vault yet. Open Connectors, find the email, and ingest the attachment again.`
          : 'This connector file must be re-ingested from Connectors.',
        variant: 'warning',
      });
      return;
    }
    const gid = docRow?.groupId ? String(docRow.groupId) : undefined;
    const collectionName = (docRow?.group && String(docRow.group)) || gid || docId;
    const k = bustKey(docId, action);
    const stage = pipelineActionToStage(action);
    optimisticSetPipelineStage(queryClient, docId, stage);
    setActionBusyKey(k);
    try {
      if (action === 'ingest') {
        await triggerIngest(docId, { collectionName }, gid || null);
      } else if (action === 'extract') {
        await triggerExtract(docId, gid || null);
      } else {
        await triggerClassify(docId, gid || null);
      }
      if (action === 'ingest') {
        void queryClient.invalidateQueries({
          queryKey: billingSubscriptionQueryKey(orgId),
        });
      }
    } catch (err: unknown) {
      markPipelineStageFailed(queryClient, docId, stage);
      const ax = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
      const msg =
        action === 'ingest'
          ? quotaErrorMessage(err, `Could not start ${action}.`)
          : ax.response?.data?.detail ||
            ax.response?.data?.error ||
            ax.message ||
            `Could not start ${action}.`;
      await appAlert({
        title: `Could not start ${action}`,
        description: msg,
        variant: 'danger',
      });
    } finally {
      setActionBusyKey(null);
    }
  };

  const runBulkPipeline = async (action: PipelineAction, selectedIds: Set<string>) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(action);
    const stage = pipelineActionToStage(action);
    const failures: string[] = [];
    const failedIds: string[] = [];
    let started = 0;
    try {
      const targets = selectBulkPipelineTargets(documents, selectedIds, action, docCanManage);
      if (action === 'ingest') {
        for (const [groupKey, groupTargets] of groupTargetsByGroup(targets)) {
          const gid = groupKey || null;
          for (const chunk of chunkList(groupTargets, BATCH_INGEST_CHUNK)) {
            for (const target of chunk) {
              optimisticSetPipelineStage(queryClient, target.id, stage);
            }
            try {
              const res = await triggerBatchIngest(
                chunk.map((target) => target.id),
                gid
              );
              const results = Array.isArray(res.data?.results) ? res.data.results : [];
              const chunkFailures = collectBatchIngestFailures(chunk, results);
              const failedInChunk = new Set(chunkFailures.map((item) => item.id));
              started += chunk.length - failedInChunk.size;
              for (const item of chunkFailures) {
                markPipelineStageFailed(queryClient, item.id, stage);
                failedIds.push(item.id);
                failures.push(item.message);
              }
            } catch (err: unknown) {
              const msg = quotaErrorMessage(err, 'Could not start ingest.');
              for (const target of chunk) {
                markPipelineStageFailed(queryClient, target.id, stage);
                failedIds.push(target.id);
                failures.push(`${target.fileName}: ${msg}`);
              }
            }
          }
        }
      } else {
        for (const target of targets) {
          optimisticSetPipelineStage(queryClient, target.id, stage);
          try {
            if (action === 'extract') {
              await triggerExtract(target.id, target.groupId || null);
            } else {
              await triggerClassify(target.id, target.groupId || null);
            }
          } catch (err: unknown) {
            markPipelineStageFailed(queryClient, target.id, stage);
            failedIds.push(target.id);
            const ax = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
            const msg =
              ax.response?.data?.detail ||
              ax.response?.data?.error ||
              ax.message ||
              `Could not start ${action}.`;
            failures.push(`${target.fileName}: ${msg}`);
          }
        }
      }
      if (action === 'ingest' && started > 0) {
        void queryClient.invalidateQueries({
          queryKey: billingSubscriptionQueryKey(orgId),
        });
      }
      for (const id of failedIds) {
        markPipelineStageFailed(queryClient, id, stage);
      }
      if (failures.length) {
        await appAlert({
          title: `Some ${action} actions failed`,
          description: failures.slice(0, 5).join('\n'),
          variant: 'danger',
        });
      }
    } finally {
      setBulkBusy(null);
    }
  };

  React.useEffect(() => {
    const email = String(userEmail || '').trim();
    const gid = String(userGroupId || '').trim();
    if (!email) return;

    connectSocket(email, gid);
    const socket = getSocket();
    if (!socket) return;

    const onJobUpdate = (payload: JobUpdatePayload) => {
      applyJobUpdateToPipelineCache(queryClient, payload, orgId);
    };

    const onConnectorIngest = (payload: ConnectorIngestSocketPayload) => {
      if (payload?.orgId && orgId && String(payload.orgId) !== String(orgId)) return;
      const created = payload.documents || [];
      if (!created.length) return;
      void refreshDocumentsAfterConnectorIngest(
        queryClient,
        orgId,
        created,
        payload.groupId || gid || null
      );
    };

    socket.on('job.update', onJobUpdate);
    socket.on('connector.ingest', onConnectorIngest);
    return () => {
      socket.off('job.update', onJobUpdate);
      socket.off('connector.ingest', onConnectorIngest);
    };
  }, [queryClient, orgId, userEmail, userGroupId]);

  return {
    actionBusyKey,
    bulkBusy,
    bulkBusyActive,
    bustKey,
    runPipeline,
    runBulkPipeline,
  };
}
