/**
 * connectorBrowserApi.ts
 * API client functions for the Connector Browser feature.
 */
import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';

export interface ConnectorItem {
  name: string;
  type: 'file' | 'folder' | 'email';
  size?: number;
  mtime?: string | number;
  path?: string;
  id?: string;
  from?: string;
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

export interface EmailIngestResult {
  success: boolean;
  status: string;
  uid?: string;
  processed?: number;
  skipped?: number;
  markedProcessed?: boolean;
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

export async function browseConnector(connectorId: string, browsePath?: string): Promise<BrowseResult> {
  const orgId = resolveOrgId();
  const params = browsePath ? `?path=${encodeURIComponent(browsePath)}` : '';
  const { data } = await apiClient.get<BrowseResult>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/browse${params}`
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

export async function fetchEmailDetail(connectorId: string, uid: string): Promise<EmailDetail> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.get<EmailDetail>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/emails/${encodeURIComponent(uid)}`
  );
  return data;
}

export async function ingestEmailAttachments(
  connectorId: string,
  uid: string,
  selection: EmailIngestSelection
): Promise<EmailIngestResult> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.post<EmailIngestResult>(
    `/admin/orgs/${orgId}/connectors/${connectorId}/emails/${encodeURIComponent(uid)}/ingest`,
    {
      ...selection,
      // Queue on the server so the mailroom UI returns immediately (no long IMAP/S3 wait).
      async: selection.async !== false,
    }
  );
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
