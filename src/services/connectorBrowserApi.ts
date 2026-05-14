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
}

export interface BrowseResult {
  currentPath: string;
  rootPath: string;
  items: ConnectorItem[];
  connectorName: string;
  connectorType: string;
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
