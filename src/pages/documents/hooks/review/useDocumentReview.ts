import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDocumentReviewResults } from '../../../../services/documentReviewApi';
import type { DocumentReviewPayload } from '../../../../types/documentReview';
import { refreshPipelineDocuments } from '../../../../utils/pipelineDocumentsCache';
import { quotaErrorMessage } from '../../../../utils/billingQuota';
import { useAlert } from '../../../../components/alert';
import { exportExtractionDownload } from '../../utils/export/extractionExport';
import type { DocumentRow } from '../../types/documentRow';

export function useDocumentReview() {
  const queryClient = useQueryClient();
  const { alert: appAlert } = useAlert();
  const [resultModal, setResultModal] = useState<DocumentRow | null>(null);
  const [reviewData, setReviewData] = useState<DocumentReviewPayload | null>(null);
  const [resultLoadingDocId, setResultLoadingDocId] = useState<string | null>(null);
  const [extractFormat, setExtractFormat] = useState<'json' | 'csv' | 'md'>('json');

  const handleOpenResults = React.useCallback(
    async (docItem: DocumentRow) => {
      if (!docItem?.id) return;
      const docId = String(docItem.id);
      const gid = docItem?.groupId ? String(docItem.groupId) : undefined;
      setResultModal({ ...docItem });
      setReviewData(null);
      setResultLoadingDocId(docId);
      try {
        const parsed = await getDocumentReviewResults(docId, gid || null);
        setReviewData(parsed);
        setResultModal({
          ...docItem,
          extractionResult:
            parsed.extractionResult ??
            docItem.extractionResult ??
            (parsed.extractionView.pages.length ? { pages: parsed.extractionView.pages } : null),
          classificationData:
            parsed.classificationData ?? docItem.classificationData ?? parsed.classificationView,
        });
      } catch (err: unknown) {
        setResultModal(null);
        setReviewData(null);
        const ax = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
        const isQuota = ax.response?.status === 402;
        await appAlert({
          title: 'Could not fetch results',
          description: isQuota
            ? quotaErrorMessage(err, 'Plan limit reached.')
            : ax.response?.data?.message || ax.response?.data?.error || ax.message || 'Please try again.',
          variant: 'danger',
        });
      } finally {
        setResultLoadingDocId(null);
      }
    },
    [appAlert]
  );

  const handleReviewSaved = React.useCallback(async () => {
    await refreshPipelineDocuments(queryClient);
    if (resultModal?.id) {
      const gid = resultModal.groupId ? String(resultModal.groupId) : undefined;
      try {
        const parsed = await getDocumentReviewResults(String(resultModal.id), gid || null);
        setReviewData(parsed);
      } catch {
        /* keep local draft cleared in drawer */
      }
    }
    await appAlert({
      title: 'Review saved',
      description: 'Extraction and classification updates were applied.',
      variant: 'success',
    });
  }, [appAlert, queryClient, resultModal]);

  const handleReviewError = React.useCallback(
    async (title: string, err: unknown) => {
      const ax = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
      const isQuota = ax.response?.status === 402;
      await appAlert({
        title,
        description: isQuota
          ? quotaErrorMessage(err, 'Plan limit reached.')
          : ax.response?.data?.message || ax.response?.data?.error || ax.message || 'Please try again.',
        variant: 'danger',
      });
    },
    [appAlert]
  );

  const closeReview = React.useCallback(() => {
    setResultModal(null);
    setReviewData(null);
    setResultLoadingDocId(null);
  }, []);

  const handleExport = React.useCallback((data: unknown, fmt: string, filename: string) => {
    exportExtractionDownload(data, fmt, filename);
  }, []);

  return {
    resultModal,
    reviewData,
    resultLoadingDocId,
    extractFormat,
    setExtractFormat,
    handleOpenResults,
    handleReviewSaved,
    handleReviewError,
    closeReview,
    handleExport,
  };
}
