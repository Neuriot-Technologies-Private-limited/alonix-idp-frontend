/**
 * Document human-review API (extraction & classification).
 * Paths match documentApi: `/documents` or `/groups/:groupId/documents`.
 */
import apiClient from './api/client';
import { documentsBase } from './documentApi';
import {
  parseDocumentReviewResults,
  extractionReviewPatchBody,
  type DocumentReviewPayload,
} from '../types/documentReview';
import type { ExtractionReviewPage } from '../types/documentReview';

export async function getDocumentReviewResults(
  documentId: string,
  groupId?: string | null
): Promise<DocumentReviewPayload> {
  const base = documentsBase(groupId);
  const { data } = await apiClient.get<unknown>(
    `${base}/${encodeURIComponent(documentId)}/results`
  );
  return parseDocumentReviewResults(data);
}

export async function patchExtractionReview(
  documentId: string,
  groupId: string | null | undefined,
  pages: ExtractionReviewPage[],
  initialPages?: ExtractionReviewPage[]
) {
  const base = documentsBase(groupId);
  return apiClient.patch<{ ok?: boolean; message?: string }>(
    `${base}/${encodeURIComponent(documentId)}/extraction-review`,
    extractionReviewPatchBody(pages, initialPages)
  );
}

export async function patchClassificationReview(
  documentId: string,
  groupId: string | null | undefined,
  body: { labels: Record<string, unknown> }
) {
  const base = documentsBase(groupId);
  return apiClient.patch<{ ok?: boolean; message?: string }>(
    `${base}/${encodeURIComponent(documentId)}/classification-review`,
    body
  );
}

export type { DocumentReviewPayload };
