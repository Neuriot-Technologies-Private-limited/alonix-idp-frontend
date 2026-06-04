import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteDocument, getDocumentAccessUrl } from '../../../../services/chatApi';
import { refreshPipelineDocuments } from '../../../../utils/pipelineDocumentsCache';
import { useAlert } from '../../../../components/alert';
import type { DocumentRow } from '../../types/documentRow';

export function useDocumentActions(docCanManage: (d: DocumentRow) => boolean) {
  const { confirm, alert: appAlert } = useAlert();
  const queryClient = useQueryClient();
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
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
    openDocBusyId,
    handleDeleteDocument,
    handleOpenDocument,
  };
}
