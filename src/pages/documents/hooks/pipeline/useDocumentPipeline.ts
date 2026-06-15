import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  triggerIngest,
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
import { useAlert } from '../../../../components/alert';
import type { DocumentRow } from '../../types/documentRow';

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
    try {
      for (const id of selectedIds) {
        const docItem = documents?.find((d: DocumentRow) => d.id === id);
        if (!docItem?.pipeline || !docCanManage(docItem)) continue;
        const p = docItem.pipeline;
        if (action === 'ingest' && (p.ingestion.status === 'processing' || p.ingestion.status === 'done'))
          continue;
        if (action === 'extract' && (p.extraction.status === 'processing' || p.extraction.status === 'done'))
          continue;
        if (action === 'classify' && (p.classification.status === 'processing' || p.classification.status === 'done'))
          continue;
        const docRow = documents?.find((d: DocumentRow) => d.id === id);
        const gid = docRow?.groupId ? String(docRow.groupId) : undefined;
        const collectionName = (docRow?.group && String(docRow.group)) || gid || id;
        optimisticSetPipelineStage(queryClient, id, stage);
        try {
          if (action === 'ingest') {
            await triggerIngest(id, { collectionName }, gid || null);
          } else if (action === 'extract') {
            await triggerExtract(id, gid || null);
          } else {
            await triggerClassify(id, gid || null);
          }
        } catch (err: unknown) {
          markPipelineStageFailed(queryClient, id, stage);
          failedIds.push(id);
          const ax = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
          const msg =
            action === 'ingest'
              ? quotaErrorMessage(err, `Could not start ${action}.`)
              : ax.response?.data?.detail ||
                ax.response?.data?.error ||
                ax.message ||
                `Could not start ${action}.`;
          failures.push(`${docItem.fileName || id}: ${msg}`);
        }
      }
      if (action === 'ingest' && selectedIds.size > failedIds.length) {
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
