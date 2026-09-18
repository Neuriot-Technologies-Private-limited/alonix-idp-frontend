import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { bulkDeleteDocuments, deleteDocument, getDocumentAccessUrl } from '../../../../services/chatApi';
import { mergePipeline } from '../../../../services/adminService';
import { refreshPipelineDocuments } from '../../../../utils/pipelineDocumentsCache';
import { isConnectorPendingDocumentId } from '../../../../utils/connectorIngestOptimistic';
import { useAlert } from '../../../../components/alert';
import type { DocumentRow } from '../../types/documentRow';

const BULK_DELETE_CHUNK = 50;

function isBulkDeletableDoc(doc: DocumentRow) {
  if (isConnectorPendingDocumentId(doc.id)) return false;
  const p = mergePipeline(doc.pipeline);
  return (
    p.ingestion.status !== 'processing' &&
    p.extraction.status !== 'processing' &&
    p.classification.status !== 'processing'
  );
}

export function useDocumentActions(docCanManage: (d: DocumentRow) => boolean) {
  const { confirm, alert: appAlert } = useAlert();
  const queryClient = useQueryClient();
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [openDocBusyId, setOpenDocBusyId] = useState<string | null>(null);

  const handleDeleteDocument = React.useCallback(
    async (docItem: DocumentRow, onDeleted?: (id: string) => void) => {
      if (!docCanManage(docItem)) return;
      const name = docItem.fileName || 'this document';
      const ok = await confirm({
        title: 'Remove document?',
        description: (
          <>
            Remove <span className="font-semibold text-foreground/95">“{name}”</span>? This cannot be
            undone.
          </>
        ),
        variant: 'danger',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
      });
      if (!ok) return;
      setDeleteBusyId(docItem.id);
      try {
        const gid = docItem.groupId ? String(docItem.groupId) : undefined;
        await deleteDocument(docItem.id, gid || null);
        onDeleted?.(docItem.id);
        await refreshPipelineDocuments(queryClient);
        await queryClient.invalidateQueries({ queryKey: ['documents'] });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } }; message?: string };
        const msg = ax.response?.data?.error || ax.message || 'Could not delete document.';
        await appAlert({ title: 'Could not delete', description: msg, variant: 'danger' });
      } finally {
        setDeleteBusyId(null);
      }
    },
    [appAlert, confirm, docCanManage, queryClient]
  );

  const handleBulkDeleteDocuments = React.useCallback(
    async (
      selectedIds: Set<string> | string[],
      documents: DocumentRow[] | undefined,
      onDeleted?: (ids: string[]) => void
    ) => {
      const idList = Array.isArray(selectedIds) ? selectedIds : Array.from(selectedIds);
      const targets = idList
        .map((id) => documents?.find((d) => d.id === id))
        .filter((d): d is DocumentRow => Boolean(d && docCanManage(d) && isBulkDeletableDoc(d)));
      if (targets.length === 0) return;

      const ok = await confirm({
        title: 'Remove documents?',
        description: (
          <>
            Remove{' '}
            <span className="font-semibold text-foreground/95">
              {targets.length} document{targets.length === 1 ? '' : 's'}
            </span>
            ? This cannot be undone.
          </>
        ),
        variant: 'danger',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
      });
      if (!ok) return;

      setBulkDeleteBusy(true);
      const deletedIds: string[] = [];
      const failures: string[] = [];
      try {
        const byGroup = new Map<string, DocumentRow[]>();
        for (const doc of targets) {
          const key = doc.groupId ? String(doc.groupId) : '';
          const list = byGroup.get(key) || [];
          list.push(doc);
          byGroup.set(key, list);
        }

        for (const [groupKey, docs] of byGroup) {
          const gid = groupKey || null;
          for (let i = 0; i < docs.length; i += BULK_DELETE_CHUNK) {
            const chunk = docs.slice(i, i + BULK_DELETE_CHUNK);
            const ids = chunk.map((d) => d.id);
            try {
              const res = await bulkDeleteDocuments(ids, gid);
              const deleted = Array.isArray(res.data?.deleted) ? res.data.deleted : [];
              const failed = Array.isArray(res.data?.failed) ? res.data.failed : [];
              deletedIds.push(...deleted.map(String));
              for (const f of failed) {
                const row = chunk.find((d) => d.id === String(f.id));
                failures.push(`${row?.fileName || f.id}: ${f.error || 'Could not delete'}`);
              }
            } catch (err: unknown) {
              const ax = err as { response?: { data?: { error?: string } }; message?: string };
              const msg = ax.response?.data?.error || ax.message || 'Could not delete documents.';
              for (const d of chunk) {
                failures.push(`${d.fileName || d.id}: ${msg}`);
              }
            }
          }
        }

        if (deletedIds.length) {
          onDeleted?.(deletedIds);
          await refreshPipelineDocuments(queryClient);
          await queryClient.invalidateQueries({ queryKey: ['documents'] });
        }

        if (failures.length) {
          await appAlert({
            title: deletedIds.length ? 'Some deletes failed' : 'Could not delete',
            description: failures.slice(0, 5).join('\n'),
            variant: 'danger',
          });
        }
      } finally {
        setBulkDeleteBusy(false);
      }
    },
    [appAlert, confirm, docCanManage, queryClient]
  );

  const handleOpenDocument = React.useCallback(
    async (docItem: DocumentRow) => {
      setOpenDocBusyId(String(docItem.id));
      try {
        const gid = docItem.groupId ? String(docItem.groupId) : undefined;
        const access = await getDocumentAccessUrl(String(docItem.id), gid || null);
        const url = String(access?.data?.url || '').trim();
        if (!url) throw new Error('Document URL is unavailable');

        const fileName = String(docItem.fileName || 'document');
        const lower = fileName.toLowerCase();
        const isPdf = lower.endsWith('.pdf') || String(docItem.type || '').toUpperCase() === 'PDF';

        const a = document.createElement('a');
        a.href = url;
        if (isPdf) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        } else {
          a.download = fileName;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string; error?: string } }; message?: string };
        await appAlert({
          title: 'Could not open document',
          description:
            ax.response?.data?.message ||
            ax.response?.data?.error ||
            ax.message ||
            'Unable to load this document right now.',
          variant: 'danger',
        });
      } finally {
        setOpenDocBusyId(null);
      }
    },
    [appAlert]
  );

  return {
    deleteBusyId,
    bulkDeleteBusy,
    openDocBusyId,
    handleDeleteDocument,
    handleBulkDeleteDocuments,
    handleOpenDocument,
  };
}
