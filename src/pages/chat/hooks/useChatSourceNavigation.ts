import { useCallback } from 'react';
import { getDocumentAccessUrl, getFreshSourceUrl } from '../../../services/chatApi';
import { isAllowedExternalDocumentUrl } from '../../../utils/safeDocumentUrl';
import type { NormSource } from '../types/chatConversation';

function resolveMimeType(source: NormSource): string {
  const mimeType = source.source_type || 'application/pdf';
  if (mimeType && !mimeType.includes('/')) {
    const lower = mimeType.toLowerCase();
    if (lower === 'pdf') return 'application/pdf';
    if (lower === 'png') return 'image/png';
    if (lower === 'jpg' || lower === 'jpeg') return 'image/jpeg';
    return 'application/octet-stream';
  }
  return mimeType;
}

function openUrlWithPage(url: string, mimeType: string, page?: number) {
  let finalUrl = url;
  if (mimeType === 'application/pdf' && page) {
    finalUrl = `${url}#page=${page}`;
  }
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}

export function useChatSourceNavigation(
  activeGroupId: string,
  onError: (msg: string) => void,
  showToast: (msg: string, type?: 'error' | 'ok') => void
) {
  const handleSourceClick = useCallback(
    async (e: React.MouseEvent, source: NormSource) => {
      e.preventDefault();
      try {
        const mimeType = resolveMimeType(source);
        const documentId = source.document_id || source.documentId || null;

        if (documentId) {
          const byId = await getDocumentAccessUrl(documentId, activeGroupId || undefined);
          const freshUrl = byId?.data?.url;
          if (freshUrl) {
            openUrlWithPage(freshUrl, mimeType, source.page);
            return;
          }
        }

        const fileKey = source.file_path || source.fileKey || source.document || null;
        if (fileKey) {
          const fresh = await getFreshSourceUrl(fileKey, null, activeGroupId || undefined);
          const freshUrl = fresh?.data?.url;
          if (freshUrl) {
            openUrlWithPage(freshUrl, mimeType, source.page);
            return;
          }
        }

        if (!source.source_file) return;

        if (typeof source.source_file === 'string') {
          if (
            source.source_file.startsWith('http://') ||
            source.source_file.startsWith('https://')
          ) {
            if (isAllowedExternalDocumentUrl(source.source_file)) {
              openUrlWithPage(source.source_file, mimeType, source.page);
            }
            return;
          }
        }

        let blobUrl: string;
        if (source.source_file instanceof ArrayBuffer) {
          blobUrl = URL.createObjectURL(new Blob([source.source_file], { type: mimeType }));
        } else if (source.source_file instanceof Blob) {
          blobUrl = URL.createObjectURL(source.source_file);
        } else if (typeof source.source_file === 'string') {
          let b64 = source.source_file;
          if (b64.includes(',')) b64 = b64.split(',')[1];
          b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4 !== 0) b64 += '=';
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
        } else return;

        openUrlWithPage(blobUrl, mimeType, source.page);
      } catch (error: unknown) {
        const ax = error as { response?: { data?: { error?: string } }; message?: string };
        const msg =
          ax?.response?.data?.error ||
          (error instanceof Error ? error.message : '') ||
          'Failed to load document.';
        onError(msg);
        showToast(msg, 'error');
      }
    },
    [activeGroupId, onError, showToast]
  );

  return { handleSourceClick };
}
