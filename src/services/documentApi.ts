/**
 * Document API. Paths: `/documents` or `/groups/:groupId/documents`.
 * Human review lives in documentReviewApi.ts.
 */
import apiClient from './api/client';

function documentsBase(groupId?: string | null) {
  const g = groupId?.trim();
  return g ? `/groups/${encodeURIComponent(g)}/documents` : '/documents';
}

export async function getGroupClaimIds(groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.get<{ claimIds: string[] }>(`${base}/claim-ids`);
}

export type UploadDocumentOptions = {
  userId: string;
  groupId?: string | null;
  orgId?: string | null;
  sensitivityLevel?: string | null;
  claimId?: string | null;
  documentId?: string | null;
};

const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export type DedupAction = 'upload' | 'block' | 'choose';

export type DedupMatchedDocument = {
  id: string;
  fileName: string;
  uploadedAt: string;
  relation: string;
};

export type DedupCheckResult = {
  action: DedupAction;
  documentId: string;
  label: string;
  checkFailed: boolean;
  unlinked: boolean;
  hitlTaskId: string | null;
  matched: DedupMatchedDocument | null;
  alsoRelated: DedupMatchedDocument[];
};

export async function checkDocumentDedup(file: File, options: UploadDocumentOptions) {
  const { userId, groupId, orgId } = options;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userId', userId);
  if (groupId) fd.append('groupId', groupId);
  if (orgId) fd.append('orgId', orgId);
  const base = documentsBase(groupId);
  return apiClient.post<DedupCheckResult>(`${base}/dedup-check`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

export async function cancelDocumentDedup(input: {
  documentId: string;
  groupId?: string | null;
  hitlTaskId?: string | null;
}) {
  const base = documentsBase(input.groupId);
  const body: { documentId: string; hitlTaskId?: string } = {
    documentId: input.documentId,
  };
  const hitlTaskId = String(input.hitlTaskId || '').trim();
  if (hitlTaskId) body.hitlTaskId = hitlTaskId;
  return apiClient.post<{ ok: true }>(`${base}/dedup-cancel`, body);
}

export async function uploadDocument(file: File, options: UploadDocumentOptions) {
  const { userId, groupId, orgId, sensitivityLevel, claimId, documentId } = options;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userId', userId);
  if (groupId) fd.append('groupId', groupId);
  if (orgId) fd.append('orgId', orgId);
  fd.append('sensitivityLevel', (sensitivityLevel && String(sensitivityLevel).trim()) || 'INTERNAL_USE');
  const trimmedClaimId = String(claimId || '').trim();
  if (trimmedClaimId) fd.append('claim_id', trimmedClaimId);
  const mintedDocumentId = String(documentId || '').trim();
  if (mintedDocumentId) fd.append('documentId', mintedDocumentId);
  const base = documentsBase(groupId);
  return apiClient.post<{
    id?: string;
    fileName?: string;
    status?: string;
    jobId?: string;
    message?: string;
  }>(
    `${base}/upload`,
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT_MS,
    }
  );
}

export async function deleteDocument(documentId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.delete<{ message?: string; error?: string }>(
    `${base}/${encodeURIComponent(documentId)}`
  );
}

export type BulkDeleteDocumentsResult = {
  deleted: string[];
  failed: Array<{ id: string; status?: number; error?: string; blocking?: unknown }>;
};

export async function bulkDeleteDocuments(ids: string[], groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.post<BulkDeleteDocumentsResult>(`${base}/bulk-delete`, { ids });
}

export async function triggerIngest(
  documentId: string,
  body: { collectionName: string },
  groupId?: string | null
) {
  const base = documentsBase(groupId);
  return apiClient.post<{ status?: string; jobId?: string }>(`${base}/${encodeURIComponent(documentId)}/ingest`, body);
}

export type BatchIngestResultItem = {
  id?: string;
  jobId?: string;
  status?: string;
};

export async function triggerBatchIngest(documentIds: string[], groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.post<{ message?: string; results?: BatchIngestResultItem[] }>(`${base}/batch/ingest`, {
    documentIds,
  });
}

export async function triggerExtract(documentId: string, groupId?: string | null, format: string = 'json') {
  const base = documentsBase(groupId);
  return apiClient.post(`${base}/${encodeURIComponent(documentId)}/extract`, { format });
}

export async function triggerClassify(documentId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.post(`${base}/${encodeURIComponent(documentId)}/classify`, {});
}

export async function getJobStatus(jobId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.get<{ status: string; errorDetails?: string }>(
    `${base}/jobs/${encodeURIComponent(jobId)}`
  );
}

export async function getFreshSourceUrl(
  fileKey: string,
  _mimeHint: string | null,
  groupId?: string | null
) {
  const base = documentsBase(groupId);
  return apiClient.post<{ url: string; fileKey?: string; expiresInSec?: number }>(`${base}/source-url`, {
    fileKey,
  });
}

export async function getDocumentAccessUrl(documentId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.post<{ url: string; fileKey?: string; expiresInSec?: number }>(`${base}/source-url`, {
    documentId,
  });
}

export async function getUserDocuments(userEmail: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.get<{ documents: unknown[] }>(
    `${base}/user/${encodeURIComponent(userEmail)}`
  );
}

export type OrgPipelineDocumentsParams = {
  limit?: number;
  cursor?: string;
  ingestSource?: 'connector';
  connectorId?: string;
};

export async function getOrgPipelineDocuments(params?: OrgPipelineDocumentsParams) {
  return apiClient.get<{ documents: unknown[]; nextCursor?: string | null; hasMore?: boolean }>(
    '/documents/org',
    { params }
  );
}
