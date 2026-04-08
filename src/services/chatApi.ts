/**
 * Chat + document helpers aligned with alonix-idp-node-backend:
 * - `/api/users/me/context`
 * - `/api/chats/...` or `/api/groups/:groupId/chats/...` (group-scoped preferred)
 * - `/api/documents/...` or `/api/groups/:groupId/documents/...`
 */
import apiClient from './api/client';
import type { AuthContextPayload } from '../types/auth';

function chatsBase(groupId?: string | null) {
  const g = groupId?.trim();
  return g ? `/groups/${encodeURIComponent(g)}/chats` : '/chats';
}

function documentsBase(groupId?: string | null) {
  const g = groupId?.trim();
  return g ? `/groups/${encodeURIComponent(g)}/documents` : '/documents';
}

export async function getMyContext() {
  return apiClient.get<{ user: unknown; context: AuthContextPayload }>('/users/me/context');
}

/** Sessions for the authenticated user (JWT); no email in URL. */
export async function getChatSessions(groupId?: string | null) {
  const base = chatsBase(groupId);
  return apiClient.get<{ sessions: ChatSessionDto[] }>(`${base}/sessions`);
}

export async function getChatHistory(sessionId: string, groupId?: string | null) {
  const base = chatsBase(groupId);
  return apiClient.get<unknown[]>(`${base}/session/${encodeURIComponent(sessionId)}`);
}

export async function askQuestion(
  query: string,
  collectionName: string,
  groupId: string,
  sessionId: string,
  fileKey: string | null
) {
  const base = chatsBase(groupId);
  return apiClient.post<AskResponseDto>(`${base}/qa/ask`, {
    query,
    collectionName,
    sessionId,
    fileKey,
    ...(groupId ? { groupId } : {}),
  });
}

export async function deleteChat(sessionId: string, groupId?: string | null) {
  const base = chatsBase(groupId);
  return apiClient.delete<{ status?: boolean; msg?: string }>(`${base}/delete`, {
    data: {
      sessionId,
      ...(groupId ? { groupId } : {}),
    },
  });
}

export type UploadDocumentOptions = {
  /** Mongo user id — must match JWT user; preferred over email. */
  userId: string;
  groupId?: string | null;
  /** Org scope from auth context — validated server-side against session. */
  orgId?: string | null;
};

export async function uploadDocument(file: File, options: UploadDocumentOptions) {
  const { userId, groupId, orgId } = options;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userId', userId);
  if (groupId) fd.append('groupId', groupId);
  if (orgId) fd.append('orgId', orgId);
  const base = documentsBase(groupId);
  return apiClient.post<{ id?: string; status?: string; jobId?: string; message?: string }>(
    `${base}/upload`,
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
}

/** `documentId` is the MongoDB document `_id` (24-char hex). */
export async function deleteDocument(documentId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.delete<{ message?: string; error?: string }>(
    `${base}/${encodeURIComponent(documentId)}`
  );
}

export async function triggerIngest(
  documentId: string,
  body: { collectionName: string },
  groupId?: string | null
) {
  const base = documentsBase(groupId);
  return apiClient.post<{ status?: string; jobId?: string }>(`${base}/${encodeURIComponent(documentId)}/ingest`, body);
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

export async function getDocumentResults(documentId: string, groupId?: string | null) {
  const base = documentsBase(groupId);
  return apiClient.get<{
    id: string;
    fileName: string;
    status: string;
    ingestionStatus?: string | null;
    extractionStatus?: string | null;
    classificationStatus?: string | null;
    extractionResult?: unknown;
    classificationData?: unknown;
    extractedData?: unknown;
    jobs?: unknown[];
  }>(`${base}/${encodeURIComponent(documentId)}/results`);
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

/** Org-wide pipeline rows for dashboard / documents (authenticated, org-scoped). */
export async function getOrgPipelineDocuments() {
  return apiClient.get<{ documents: unknown[] }>('/documents/org');
}

// ---- DTOs (loose; API may vary) ----

export interface ChatSessionDto {
  session_id: string;
  title: string;
  last_updated: string;
}

export interface AskResponseDto {
  session_id?: string;
  answer?: string;
  sources?: unknown[] | Record<string, unknown>;
}
