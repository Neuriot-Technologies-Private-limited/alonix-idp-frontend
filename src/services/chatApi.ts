/**
 * Chat helpers aligned with alonix-idp-node-backend:
 * `/api/chats/...` or `/api/groups/:groupId/chats/...` (group-scoped preferred).
 * Document calls live in documentApi.ts.
 * Auth context refresh: `authApi.fetchAuthContext()` / `useAuthStore.syncAuthContext()`.
 */
import apiClient from './api/client';

function chatsBase(groupId?: string | null) {
  const g = groupId?.trim();
  return g ? `/groups/${encodeURIComponent(g)}/chats` : '/chats';
}

/** Sessions for the authenticated user (JWT); no email in URL. */
export async function getChatSessions(groupId?: string | null) {
  const base = chatsBase(groupId);
  return apiClient.get<{ sessions: ChatSessionDto[] }>(`${base}/sessions`);
}

export type ChatSessionsPageParams = {
  limit?: number;
  cursor?: string | null;
};

export type ChatSessionsPageResult = {
  sessions: ChatSessionDto[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

/** Paginated sessions (chat sidebar); Dashboard uses {@link getChatSessions} without limit. */
export async function getChatSessionsPage(
  groupId?: string | null,
  params?: ChatSessionsPageParams
) {
  const base = chatsBase(groupId);
  return apiClient.get<ChatSessionsPageResult>(`${base}/sessions`, { params });
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
  fileKey: string | null,
  claimId?: string | null
) {
  const base = chatsBase(groupId);
  const trimmedClaimId = String(claimId || '').trim();
  return apiClient.post<AskResponseDto>(`${base}/qa/ask`, {
    query,
    collectionName,
    sessionId,
    fileKey,
    ...(groupId ? { groupId } : {}),
    claim_id: trimmedClaimId || null,
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

// ---- DTOs (loose; API may vary) ----

export interface ChatSessionDto {
  session_id: string;
  title: string;
  last_updated: string;
  claim_id?: string | null;
}

export type ChatResponseKind = 'answer' | 'clarification';

export interface AskResponseDto {
  session_id?: string;
  /** Mongo ChatMessages _id (sent to Python as query_id). */
  query_id?: string;
  answer?: string;
  response_kind?: ChatResponseKind;
  responseKind?: ChatResponseKind;
  options?: unknown[] | string[] | null;
  clarification_options?: unknown[] | string[] | null;
  clarification_question?: string;
  original_query?: string;
  rewritten_query?: string;
  rewrittenQuery?: string;
  status?: string;
  message?: string;
  sources?: unknown[] | Record<string, unknown>;
  claim_ids?: string[] | null;
  claimIds?: string[] | null;
  claim_id?: string | null;
  classification?: unknown;
  is_valid?: boolean;
  source_files?: unknown;
}
