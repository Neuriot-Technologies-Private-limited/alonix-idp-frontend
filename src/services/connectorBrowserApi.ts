/**
 * connectorBrowserApi.ts
 * API client functions for the Connector Browser feature.
 */
import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';
import { wrapMailboxCredential } from './wrapMailboxCredential';

export interface ConnectorItem {
  name: string;
  type: 'file' | 'folder' | 'email';
  size?: number;
  mtime?: string | number;
  path?: string;
  id?: string;
  from?: string;
  fromAddress?: string;
  fromName?: string;
  subject?: string;
  downloadUrl?: string;
  seen?: boolean;
  attachmentCount?: number | null;
}

export interface BrowseResult {
  currentPath: string;
  rootPath: string;
  items: ConnectorItem[];
  connectorName: string;
  connectorType: string;
  mailboxStats?: { total: number; unseen: number };
  hasMore?: boolean;
  nextBeforeUid?: string | null;
  searchQuery?: string | null;
  resultCount?: number;
}

export interface BrowseEmailOptions {
  beforeUid?: string;
  limit?: number;
  search?: string;
}

export type AttachmentKind = 'pdf' | 'image' | 'archive' | 'other';

export interface ArchiveEntryPreview {
  fileName: string;
  sourceKey: string;
  size: number;
  ingestable: boolean;
  skipReason?: string | null;
}

export interface EmailAttachmentPreview {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  ingestable: boolean;
  skipReason?: string | null;
  sourceKey: string;
  archiveEntries: ArchiveEntryPreview[] | null;
}

export interface EmailIngestionItem {
  sourceKey: string;
  fileName: string;
  status: 'not_ingested' | 'ingested' | 'pending' | 'failed';
  documentId: string | null;
  ingestionStatus: string | null;
  errorMessage?: string | null;
}

export interface EmailDetail {
  uid: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  date: string;
  seen: boolean;
  body: { text: string | null; html: string | null };
  attachments: EmailAttachmentPreview[];
  ingestion: {
    items: EmailIngestionItem[];
    ingestedCount: number;
    failedCount: number;
  };
}

export interface EmailIngestSelection {
  attachmentIds?: string[];
  archivePaths?: string[];
  ingestAllIngestable?: boolean;
  async?: boolean;
}

export interface ConnectorIngestedDocument {
  documentId: string;
  fileName: string;
  existing?: boolean;
}

export interface EmailIngestSkippedDetail {
  fileName: string;
  code?: string;
  error?: string;
}

export interface EmailIngestResult {
  success: boolean;
  status: string;
  uid?: string;
  processed?: number;
  skipped?: number;
  markedProcessed?: boolean;
  documents?: ConnectorIngestedDocument[];
  skippedDetails?: EmailIngestSkippedDetail[];
  jobId?: string;
  error?: string;
}

export interface ConnectorIngestionRecord {
  documentId: string;
  fileName: string;
  sourceMessageId: string;
  status: string;
  ingestionStatus: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Mailbox {
  _id: string;
  connectorId: string;
  groupId: string;
  groupName?: string;
  emailAddress: string;
  status?: 'ACTIVE' | 'ERROR' | 'PAUSED';
  ingestHistoric?: boolean;
  lastHistoricSyncAt?: string | null;
  createdAt?: string;
}

export interface AddMailboxPayload {
  groupId: string;
  emailAddress: string;
  password: string;
  ingestHistoric?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
  fileCount?: number;
  folderCount?: number;
  preview?: { name: string; type: string; size: number }[];
}

export interface IngestResult {
  success: boolean;
  jobId?: string;
  status?: string;
  path?: string;
  messageId?: string;
  error?: string;
}

// resolveOrgId reads from Zustand store state (NOT a React hook — safe to call outside components)
function resolveOrgId(): string {
  const state = useAuthStore.getState();
  return state.context?.orgId || state.user?.orgId || '';
}

export async function browseConnector(
  connectorId: string,
  browsePath?: string,
  mailboxId?: string,
  emailOptions?: BrowseEmailOptions
): Promise<BrowseResult> {
  const orgId = resolveOrgId();
  const params = new URLSearchParams();
  if (browsePath) params.set('path', browsePath);
  if (emailOptions?.beforeUid) params.set('beforeUid', emailOptions.beforeUid);
  if (emailOptions?.limit) params.set('limit', String(emailOptions.limit));
  if (emailOptions?.search?.trim()) params.set('search', emailOptions.search.trim());
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : '';
  const url = mailboxId
    ? `/admin/orgs/${orgId}/connectors/${connectorId}/mailboxes/${encodeURIComponent(mailboxId)}/browse${suffix}`
    : `/admin/orgs/${orgId}/connectors/${connectorId}/browse${suffix}`;
  const { data } = await apiClient.get<BrowseResult>(url);
  return data;
}

export async function listMailboxes(connectorId: string): Promise<Mailbox[]> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<Mailbox[]>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/mailboxes`
  );
  return data;
}

export async function listAllMailboxes(): Promise<Mailbox[]> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<Mailbox[]>(
    `/admin/orgs/${orgId}/connectors/mailboxes`
  );
  return data;
}

/** Server-scoped lookup — one mailbox per workspace (0 or 1 result). */
export async function listMailboxesForGroup(groupId: string): Promise<Mailbox[]> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<Mailbox[]>(
    `/admin/orgs/${orgId}/connectors/mailboxes`,
    { params: { groupId } }
  );
  return data;
}

export async function deleteMailbox(connectorId: string, mailboxId: string): Promise<void> {
  const orgId = resolveOrgId();
  await apiClient.delete(
    `/admin/orgs/${orgId}/connectors/${connectorId}/mailboxes/${encodeURIComponent(mailboxId)}`
  );
}

export async function updateMailboxPassword(
  connectorId: string,
  mailboxId: string,
  password: string
): Promise<Mailbox> {
  const orgId = resolveOrgId();
  const wrapped = await wrapMailboxCredential(password);
  const { data } = await apiClient.patch<Mailbox>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/mailboxes/${encodeURIComponent(mailboxId)}`,
    wrapped
  );
  return data;
}

export async function addMailbox(connectorId: string, payload: AddMailboxPayload): Promise<Mailbox> {
  const orgId = resolveOrgId();
  const wrapped = await wrapMailboxCredential(payload.password);
  const { data } = await apiClient.post<Mailbox>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/mailboxes`,
    {
      groupId: payload.groupId,
      emailAddress: payload.emailAddress,
      ingestHistoric: payload.ingestHistoric,
      wrapKeyId: wrapped.wrapKeyId,
      wrappedPassword: wrapped.wrappedPassword,
    }
  );
  return data;
}

export async function ingestFile(
  connectorId: string,
  payload: { path?: string; messageId?: string; itemId?: string }
): Promise<IngestResult> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.post<IngestResult>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/ingest`,
    payload
  );
  return data;
}

export async function testSftpConnection(connectorId: string): Promise<TestConnectionResult> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.post<TestConnectionResult>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/test`
  );
  return data;
}

export async function updateConnector(
  connectorId: string,
  updates: { name?: string; autoIngest?: boolean; pollIntervalMs?: number; remotePath?: string }
): Promise<void> {
  const orgId = resolveOrgId();
  await apiClient.patch(`/admin/orgs/${orgId}/connectors/${connectorId}`, updates);
}

export async function fetchEmailDetail(
  connectorId: string,
  uid: string,
  mailboxId?: string
): Promise<EmailDetail> {
  const orgId = resolveOrgId();
  const url = mailboxId
    ? `/admin/orgs/${orgId}/mailboxes/${encodeURIComponent(mailboxId)}/emails/${encodeURIComponent(uid)}`
    : `/admin/orgs/${orgId}/connectors/${connectorId}/emails/${encodeURIComponent(uid)}`;
  const { data } = await apiClient.get<EmailDetail>(url);
  return data;
}

export async function ingestEmailAttachments(
  connectorId: string,
  uid: string,
  selection: EmailIngestSelection,
  mailboxId?: string
): Promise<EmailIngestResult> {
  const orgId = resolveOrgId();
  const url = mailboxId
    ? `/admin/orgs/${orgId}/mailboxes/${encodeURIComponent(mailboxId)}/emails/${encodeURIComponent(uid)}/ingest`
    : `/admin/orgs/${orgId}/connectors/${connectorId}/emails/${encodeURIComponent(uid)}/ingest`;
  const { data } = await apiClient.post<EmailIngestResult>(url, {
    ...selection,
    async: selection.async === true,
  });
  return data;
}

export async function listConnectorIngestions(
  connectorId: string,
  limit = 50
): Promise<{ items: ConnectorIngestionRecord[]; connectorId: string }> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<{ items: ConnectorIngestionRecord[]; connectorId: string }>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/ingestions`,
    { params: { limit } }
  );
  return data;
}

export async function listMailboxIngestions(
  mailboxId: string,
  limit = 50
): Promise<{ items: ConnectorIngestionRecord[]; connectorId: string; mailboxId: string }> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<{
    items: ConnectorIngestionRecord[];
    connectorId: string;
    mailboxId: string;
  }>(`/admin/orgs/${orgId}/mailboxes/${encodeURIComponent(mailboxId)}/ingestions`, {
    params: { limit },
  });
  return data;
}
