import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';
import { getOrgPipelineDocuments } from './chatApi';
import { normalizeDocumentTypeLabel } from '../utils/documentFileType';
import type { PiiHandlingPolicy } from '../constants/piiHandlingPolicy';
import type { DocumentPipelineStages } from '../pages/documents/types/documentRow';
import type { DocumentRow } from '../pages/documents/types/documentRow';

function requireOrgId(): string {
  const id = useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
  if (!id || String(id).length === 0) {
    throw new Error('Missing organization context');
  }
  return String(id);
}

export interface TrendingInfo {
  value: string;
  label: string;
  isPositive: boolean;
}

export interface PipelineMetrics {
  totalDocuments: number;
  ingestCompleted: number;
  ingestFailed: number;
  extractCompleted: number;
  classifyCompleted: number;
  failedDocuments: number;
  successRatePercent: number;
  jobsProcessing: number;
  pipelineBusy: number;
}

export interface AdminStats {
  totalGroups: number;
  totalUsers: number;
  totalDocuments: number;
  ingestionCount: number;
  groupsTendency: TrendingInfo;
  usersTendency: TrendingInfo;
  docsTendency: TrendingInfo;
  ingestionTendency: TrendingInfo;
  confidenceScore: string;
  pipeline?: PipelineMetrics;
}

export interface AuditLogsQuery {
  from?: string;
  to?: string;
  actorEmail?: string;
  groupId?: string;
  action?: string;
  limit?: number;
  skip?: number;
}

export interface AuditLogsResult {
  logs: AuditLog[];
  total: number;
  skip: number;
  limit: number;
}

export interface ActivitySeriesPoint {
  period: string;
  auditEvents: number;
  documentUploads: number;
}

export interface ActivitySeriesResult {
  from: string;
  to: string;
  granularity: 'day' | 'month';
  series: ActivitySeriesPoint[];
}

/** Single response from `GET /admin/orgs/:orgId/dashboard-state` */
export interface DashboardState {
  orgId: string;
  orgName?: string;
  orgSlug?: string;
  orgRole: 'COMPANY_ADMIN' | 'MEMBER' | null;
  /** Group role for the active workspace (from auth context). */
  activeGroupRole: 'GROUP_ADMIN' | 'SEARCH_USER' | null;
  /** True if user is GROUP_ADMIN in at least one workspace. */
  hasGroupAdminMembership: boolean;
  /** Org-wide totals vs only workspaces the user can access. */
  statsScope: 'organization' | 'workspaces';
  /** Max rows per preview list (documents, users, audit). */
  previewLimit?: number;
  /** Active workspace id when previews are scoped to navbar selection. */
  previewScopedGroupId?: string | null;
  stats: AdminStats;
  groups: GroupHealth[];
  usersPreview: User[];
  auditLogs: AuditLog[];
  documents: unknown[];
}

export interface GroupHealth {
  id: string;
  name: string;
  slug?: string;
  users: number;
  docs: number;
  status: 'Healthy' | 'Pending' | 'Error';
  statusLabel: string;
  /** Present on dashboard-state: caller’s role in this workspace. */
  membershipRole?: 'GROUP_ADMIN' | 'SEARCH_USER' | null;
  piiHandlingPolicy?: PiiHandlingPolicy | null;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'Group Admin' | 'Search User';
  /** API key for membership updates */
  roleCode?: 'GROUP_ADMIN' | 'SEARCH_USER';
  /** Max document sensitivity this search user may access */
  maxDocumentSensitivity?: string;
  avatar?: string;
  membershipState?: 'joined' | 'invited' | 'expired';
  inviteId?: string;
}

export interface GroupActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
}

export interface GroupDocument {
  id: string;
  name: string;
  size: string;
  status: 'Healthy' | 'Pending';
  date: string;
  type: string;
  sensitivityLevel?: string | null;
}

export interface GroupDetail extends GroupHealth {
  description: string;
  createdOn: string;
  storageUsed: string;
  confidenceScore: string;
  members: GroupMember[];
  documents: GroupDocument[];
  recentActivity: GroupActivity[];
  /** When set, only these sensitivity tiers may be used for documents in this workspace; null/undefined means all tiers allowed. */
  enabledDocumentSensitivityLevels?: string[] | null;
}

export interface AuditLog {
  id: string;
  user: string;
  actorEmail?: string;
  actorName?: string;
  action: string;
  actionLabel?: string;
  target: string;
  targetName?: string;
  targetType?: string;
  targetId?: string;
  groupId?: string | null;
  groupName?: string;
  timestamp: string;
  timestampDisplay?: string;
  type: 'invite' | 'ingestion' | 'creation' | 'warning' | 'info';
  metadata?: Record<string, unknown>;
}

export interface User {
  _id: string;
  name: string;
  role: string;
  lastActive: string;
  status: string;
  groupID?: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  status: 'ingested' | 'pending' | 'uploaded' | 'processed' | 'processing';
  updatedAt: string;
}

export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OPEN_SOURCE';

export type InferenceMode = 'LOCAL_ONLY' | 'CLOUD_ALLOWED';

export interface OrgAiSettings {
  orgId: string;
  inferenceMode?: InferenceMode;
  cloudLlmEnabled?: boolean;
  /** When true, forces LOCAL_ONLY and disables cloud LLMs (HIPAA / PHI tenants). */
  hipaaRegulated?: boolean;
  provider: AiProvider;
  model: string;
  providerModels?: Record<AiProvider, string>;
  openSourceBaseUrl: string;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
  hasOpenSourceKey: boolean;
  updatedAt: string | null;
}

export interface UpdateOrgAiSettingsInput {
  inferenceMode?: InferenceMode;
  cloudLlmEnabled?: boolean;
  hipaaRegulated?: boolean;
  provider?: AiProvider;
  model?: string;
  openSourceBaseUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  openSourceApiKey?: string;
}

export type SharePointCredentialSource = 'org' | 'env' | null;

export interface OrgSharePointSettings {
  orgId: string;
  orgConfigured?: boolean;
  configured: boolean;
  clientId: string;
  hasClientSecret: boolean;
  redirectUri: string;
  credentialSource: SharePointCredentialSource;
  updatedAt: string | null;
}

export interface UpdateOrgSharePointSettingsInput {
  clientId?: string;
  clientSecret?: string;
}

export type CreateGroupResult =
  | { ok: true; group: { id: string; name: string; users: number; docs: number; status: string; statusLabel: string; piiHandlingPolicy?: PiiHandlingPolicy | null } }
  | { ok: false; error: string };

const PIPELINE_STAGE_IDLE = { status: 'idle', startTime: null, endTime: null };

export interface MergedPipelineStage {
  status: string;
  startTime: string | null;
  endTime: string | null;
  errorMessage?: string | null;
}

function normalizePipelineStage(raw: unknown): MergedPipelineStage {
  const s = raw as Record<string, unknown> | null | undefined;
  if (!s) return { ...PIPELINE_STAGE_IDLE };
  return {
    status: typeof s.status === 'string' ? s.status : 'idle',
    startTime: s.startTime != null ? String(s.startTime) : null,
    endTime: s.endTime != null ? String(s.endTime) : null,
    ...(s.errorMessage != null ? { errorMessage: String(s.errorMessage) } : {}),
  };
}

export interface MergedPipeline {
  ingestion: MergedPipelineStage;
  extraction: MergedPipelineStage;
  classification: MergedPipelineStage;
}

/** Safe pipeline for UI when API omits stages (avoids crash on `p.ingestion.status`). */
export function mergePipeline(raw: unknown): MergedPipeline {
  const p = raw as Record<string, unknown> | null | undefined;
  if (!p) {
    return {
      ingestion: { ...PIPELINE_STAGE_IDLE },
      extraction: { ...PIPELINE_STAGE_IDLE },
      classification: { ...PIPELINE_STAGE_IDLE },
    };
  }
  return {
    ingestion: normalizePipelineStage(p.ingestion),
    extraction: normalizePipelineStage(p.extraction),
    classification: normalizePipelineStage(p.classification),
  };
}

function coalesceUploadIso(d: Record<string, unknown>): string | undefined {
  const candidates = [d.uploadedAt, d.uploadDate, d.createdAt];
  for (const raw of candidates) {
    if (raw == null || raw === '') continue;
    const dt = new Date(raw as string | number | Date);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }
  return undefined;
}

export function normalizePipelineDocument(d: Record<string, unknown>): DocumentRow {
  const fileName = String(d.fileName ?? d.title ?? '').trim();
  const uploaderRaw = d.uploader ?? d.uploadedBy;
  const uploader =
    uploaderRaw != null && String(uploaderRaw).trim() !== '' ? String(uploaderRaw) : 'Unknown';
  const uploadedBy: string | undefined =
    d.uploadedBy != null && String(d.uploadedBy).trim() !== ''
      ? String(d.uploadedBy)
      : String(uploader).trim().toUpperCase() === 'SYSTEM_CONNECTOR'
        ? 'SYSTEM_CONNECTOR'
        : undefined;
  const sourceType =
    d.sourceType != null && String(d.sourceType).trim() !== ''
      ? String(d.sourceType).toUpperCase()
      : uploadedBy === 'SYSTEM_CONNECTOR'
        ? 'EMAIL'
        : 'UPLOAD';
  const connectorId =
    d.connectorId != null && String(d.connectorId).trim() !== '' ? String(d.connectorId) : undefined;
  const ingestSource =
    d.ingestSource === 'connector' ||
    connectorId ||
    uploadedBy === 'SYSTEM_CONNECTOR' ||
    (sourceType !== 'UPLOAD' && sourceType !== '')
      ? 'connector'
      : 'upload';
  const uploadedAt = coalesceUploadIso(d);
  const rawLevel = d.sensitivityLevel;
  const sensitivityLevel =
    rawLevel != null && String(rawLevel).trim() !== ''
      ? String(rawLevel).trim().toUpperCase().replace(/-/g, '_')
      : 'INTERNAL_USE';
  const type = normalizeDocumentTypeLabel(d.type != null ? String(d.type) : null, fileName);
  const id = String(d.id ?? d._id ?? '');
  const { claimId: rawClaimCamel, claim_id: rawClaimSnake, ...rest } = d;
  const rawClaim = rawClaimCamel ?? rawClaimSnake;
  const claimId =
    rawClaim != null && String(rawClaim).trim() !== '' ? String(rawClaim).trim() : undefined;
  return {
    ...rest,
    id,
    ...(fileName ? { fileName } : {}),
    type,
    pipeline: mergePipeline(d.pipeline) as DocumentPipelineStages,
    uploader,
    uploadedBy,
    sourceType,
    connectorId,
    ingestSource,
    sensitivityLevel,
    ...(claimId ? { claimId } : {}),
    ...(uploadedAt != null ? { uploadedAt } : {}),
  };
}

export interface GroupDeleteImpact {
  groupId: string;
  groupName: string;
  documents: number;
  members: number;
  chatSessions: number;
  chatMessages: number;
  s3Objects: number;
  warnings: string[];
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<AdminStats>(`/admin/orgs/${encodeURIComponent(orgId)}/stats`);
    return data;
  },

  /** Org dashboard in one request: stats, workspaces, doc pipeline preview, audit/users preview (admin). */
  getDashboardState: async (): Promise<DashboardState> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<DashboardState>(
      `/admin/orgs/${encodeURIComponent(orgId)}/dashboard-state`
    );
    return data;
  },

  getGroupHealth: async (): Promise<GroupHealth[]> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ groups: Record<string, unknown>[] }>(`/admin/orgs/${encodeURIComponent(orgId)}/groups`);
    const groups = data.groups || [];
    return groups.map((g) => {
      const idRaw = g.id ?? g._id;
      const id =
        typeof idRaw === 'object' && idRaw && 'toString' in idRaw
          ? String((idRaw as { toString: () => string }).toString())
          : String(idRaw ?? '');
      const policy = g.piiHandlingPolicy;
      const piiHandlingPolicy =
        policy === 'RAW_PII_ALLOWED' ||
        policy === 'MASK_PII_NO_STORAGE' ||
        policy === 'MASK_PII_STORE_ENCRYPTED'
          ? policy
          : null;
      return {
        id,
        name: String(g.name || g.groupName || ''),
        slug: g.slug != null ? String(g.slug) : undefined,
        users: typeof g.memberCount === 'number' ? g.memberCount : 0,
        docs: typeof g.documentCount === 'number' ? g.documentCount : 0,
        status: 'Healthy' as const,
        statusLabel: 'Healthy',
        membershipRole:
          g.membershipRole === 'GROUP_ADMIN' || g.membershipRole === 'SEARCH_USER'
            ? g.membershipRole
            : undefined,
        piiHandlingPolicy,
      };
    });
  },

  getAuditLogs: async (query: AuditLogsQuery = {}): Promise<AuditLogsResult> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<AuditLogsResult>(
      `/admin/orgs/${encodeURIComponent(orgId)}/audit-logs`,
      { params: { limit: 80, ...query } }
    );
    return {
      logs: (data.logs || []).map((l) => ({
        ...l,
        type: (l.type as AuditLog['type']) || 'info',
        timestamp: l.timestampDisplay || l.timestamp,
      })),
      total: data.total ?? data.logs?.length ?? 0,
      skip: data.skip ?? 0,
      limit: data.limit ?? 80,
    };
  },

  getGroupAuditLogs: async (groupId: string, query: AuditLogsQuery = {}): Promise<AuditLogsResult> => {
    const { data } = await apiClient.get<AuditLogsResult>(
      `/admin/groups/${encodeURIComponent(groupId)}/audit-logs`,
      { params: { limit: 40, ...query } }
    );
    return {
      logs: (data.logs || []).map((l) => ({
        ...l,
        type: (l.type as AuditLog['type']) || 'info',
        timestamp: l.timestampDisplay || l.timestamp,
      })),
      total: data.total ?? data.logs?.length ?? 0,
      skip: data.skip ?? 0,
      limit: data.limit ?? 40,
    };
  },

  getActivitySeries: async (query: {
    from?: string;
    to?: string;
    granularity?: 'day' | 'month';
    groupId?: string;
  }): Promise<ActivitySeriesResult> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<ActivitySeriesResult>(
      `/admin/orgs/${encodeURIComponent(orgId)}/metrics/activity-series`,
      { params: query }
    );
    return data;
  },

  getMetricsByUser: async (query?: { from?: string; to?: string; limit?: number }) => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{
      from: string;
      to: string;
      users: { actorEmail: string; eventCount: number }[];
    }>(`/admin/orgs/${encodeURIComponent(orgId)}/metrics/by-user`, { params: query });
    return data;
  },

  exportActivityCsv: async (query: AuditLogsQuery = {}): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/activity`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  getUsageSummaryReport: async (query?: { from?: string; to?: string }) => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{
      from: string;
      to: string;
      documentUploads: number;
      storageBytesAdded: number;
      auditEvents: number;
      activeUsers: number;
    }>(`/admin/orgs/${encodeURIComponent(orgId)}/reports/usage-summary`, { params: query });
    return data;
  },

  getPipelineMetrics: async (): Promise<PipelineMetrics> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<PipelineMetrics>(
      `/admin/orgs/${encodeURIComponent(orgId)}/metrics/pipeline`
    );
    return data;
  },

  getUsers: async (): Promise<User[]> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ users: Record<string, unknown>[] }>(`/admin/orgs/${encodeURIComponent(orgId)}/users`);
    return (data.users || []).map((u) => {
      const row = u as Record<string, unknown>;
      return {
      _id: row._id as string,
      name: (row.name as string) || (row.email as string),
      role: row.orgRole === 'COMPANY_ADMIN' ? 'COMPANY_ADMIN' : 'MEMBER',
      lastActive: '—',
      status: row.emailVerified ? 'Active' : 'Pending',
      groupID: row.groupID as string | undefined,
    };
    });
  },

  getDocuments: async (): Promise<DocumentRow[]> => {
    const { data } = await getOrgPipelineDocuments();
    return (data.documents || []).map((row) => normalizePipelineDocument(row as Record<string, unknown>));
  },

  getPipelineDocuments: async (params?: {
    limit?: number;
    ingestSource?: 'connector';
    connectorId?: string;
  }): Promise<DocumentRow[]> => {
    const { data } = await getOrgPipelineDocuments(params);
    return (data.documents || []).map((row) => normalizePipelineDocument(row as Record<string, unknown>));
  },

  getGroupDetail: async (id: string): Promise<GroupDetail> => {
    requireOrgId();

    // Resolve the group first. A deleted/missing workspace must not fan out
    // members/invites/audit calls (those also 404 and spam the network panel).
    let g: Record<string, unknown>;
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/groups/${encodeURIComponent(id)}`);
      g = res.data;
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } };
      if (ax.response?.status === 404) {
        const notFound = new Error(ax.response?.data?.message || 'Group not found') as Error & {
          status?: number;
          code?: string;
        };
        notFound.status = 404;
        notFound.code = 'GROUP_NOT_FOUND';
        throw notFound;
      }
      throw err;
    }

    const [{ data: mem }, { data: pipe }, { data: inv }, auditResult] = await Promise.all([
      apiClient
        .get<{ members: Record<string, unknown>[] }>(`/admin/groups/${encodeURIComponent(id)}/members`)
        .catch(() => ({ data: { members: [] as Record<string, unknown>[] } })),
      getOrgPipelineDocuments(),
      apiClient
        .get<{ invites: Record<string, unknown>[] }>(`/admin/groups/${encodeURIComponent(id)}/invites`)
        .catch(() => ({ data: { invites: [] as Record<string, unknown>[] } })),
      apiClient
        .get<AuditLogsResult>(`/admin/groups/${encodeURIComponent(id)}/audit-logs`, {
          params: { limit: 25 },
        })
        .then(({ data }) => data)
        .catch(
          (): AuditLogsResult => ({
            logs: [],
            total: 0,
            skip: 0,
            limit: 25,
          })
        ),
    ]);

    const groupName = String(g.groupName || g.name || 'Workspace');
    const docsRaw = (pipe.documents || []).filter(
      (d) => String((d as Record<string, unknown>).groupId) === String(id)
    );

    const members: GroupMember[] = (mem.members || []).map((m) => {
      const row = m as Record<string, unknown>;
      return {
      id: row.userEmail as string,
      name: row.userEmail as string,
      email: row.userEmail as string,
      role: row.role === 'GROUP_ADMIN' ? 'Group Admin' : 'Search User',
      roleCode: row.role === 'GROUP_ADMIN' ? 'GROUP_ADMIN' : 'SEARCH_USER',
      maxDocumentSensitivity: (row.maxDocumentSensitivity as string) || 'INTERNAL_USE',
      membershipState: 'joined' as const,
    };
    });

    const inviteMembers: GroupMember[] = (inv.invites || []).map((item) => {
      const row = item as Record<string, unknown>;
      return {
      id: `invite:${String(row.id)}`,
      inviteId: String(row.id),
      name: String(row.inviteeName || row.email || ''),
      email: String(row.email || ''),
      role: 'Search User',
      membershipState: row.status === 'expired' ? 'expired' : 'invited',
    };
    });

    const dedupedInviteMembers = inviteMembers.filter(
      (im) => !members.some((m) => m.email.toLowerCase() === im.email.toLowerCase())
    );
    const mergedMembers = [...members, ...dedupedInviteMembers];

    const documents: GroupDocument[] = docsRaw.slice(0, 24).map((d) => {
      const row = d as Record<string, unknown>;
      const pipeline = row.pipeline as { ingestion?: { status?: string } } | undefined;
      return {
      id: String(row.id),
      name: String(row.title || row.fileName),
      size: String(row.size || '—'),
      status: pipeline?.ingestion?.status === 'done' ? 'Healthy' : 'Pending',
      date: row.uploadedAt ? new Date(String(row.uploadedAt)).toLocaleDateString() : '—',
      type: String(row.type || 'FILE'),
      sensitivityLevel: String(row.sensitivityLevel || 'INTERNAL_USE'),
    };
    });

    const groupIdRaw = g._id as { toString?: () => string } | string | undefined;
    const groupId =
      typeof groupIdRaw === 'object' && groupIdRaw?.toString
        ? groupIdRaw.toString()
        : String(groupIdRaw || id);

    return {
      id: groupId,
      name: groupName,
      slug: g.slug != null ? String(g.slug) : undefined,
      users: members.length,
      docs: typeof g.documentCount === 'number' ? g.documentCount : docsRaw.length,
      status: 'Healthy',
      statusLabel: 'Healthy',
      description: String(g.description || 'Workspace details from your organization.'),
      createdOn: g.createdAt
        ? new Date(String(g.createdAt)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
      storageUsed: '—',
      confidenceScore: '—',
      enabledDocumentSensitivityLevels: Array.isArray(g.enabledDocumentSensitivityLevels)
        ? (g.enabledDocumentSensitivityLevels as string[])
        : null,
      piiHandlingPolicy:
        g.piiHandlingPolicy === 'RAW_PII_ALLOWED' ||
        g.piiHandlingPolicy === 'MASK_PII_NO_STORAGE' ||
        g.piiHandlingPolicy === 'MASK_PII_STORE_ENCRYPTED'
          ? g.piiHandlingPolicy
          : null,
      members: mergedMembers,
      documents,
      recentActivity: (auditResult.logs || []).map((log) => ({
        id: log.id,
        user: log.user,
        action: log.action.replace(/_/g, ' ').toLowerCase(),
        timestamp: log.timestampDisplay || log.timestamp,
        type: (log.type === 'warning' ? 'warning' : log.type === 'ingestion' ? 'success' : 'info') as
          | 'info'
          | 'warning'
          | 'success',
      })),
    };
  },

  createGroup: async (name: string, piiHandlingPolicy: PiiHandlingPolicy): Promise<CreateGroupResult> => {
    const orgId = requireOrgId();
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Enter a group name.' };
    if (!piiHandlingPolicy) return { ok: false, error: 'Select a PII handling policy.' };
    try {
      const { data } = await apiClient.post<{ group: Record<string, unknown> }>(
        `/admin/orgs/${encodeURIComponent(orgId)}/groups`,
        {
        groupName: trimmed,
        piiHandlingPolicy,
      }
      );
      const created = data.group;
      const gidRaw = created._id as { toString?: () => string } | string | undefined;
      const gid =
        typeof gidRaw === 'object' && gidRaw?.toString ? gidRaw.toString() : String(gidRaw || '');
      return {
        ok: true,
        group: {
          id: gid,
          name: String(created.groupName || trimmed),
          users: 0,
          docs: 0,
          status: 'Healthy',
          statusLabel: 'Healthy',
          piiHandlingPolicy: (created.piiHandlingPolicy as PiiHandlingPolicy) ?? piiHandlingPolicy,
        },
      };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      return { ok: false, error: ax.response?.data?.message || 'Could not create group' };
    }
  },

  getOrgAiSettings: async (): Promise<OrgAiSettings> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ settings: OrgAiSettings }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/ai-settings`
    );
    return data.settings;
  },

  updateOrgAiSettings: async (input: UpdateOrgAiSettingsInput): Promise<OrgAiSettings> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.put<{ settings: OrgAiSettings }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/ai-settings`,
      input
    );
    return data.settings;
  },

  getOrgSharePointSettings: async (): Promise<OrgSharePointSettings> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ settings: OrgSharePointSettings }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/sharepoint-settings`
    );
    return data.settings;
  },

  updateOrgSharePointSettings: async (
    input: UpdateOrgSharePointSettingsInput
  ): Promise<OrgSharePointSettings> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.put<{ settings: OrgSharePointSettings }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/sharepoint-settings`,
      input
    );
    return data.settings;
  },

  testOrgSharePointSettings: async (): Promise<{ ok: boolean; message: string }> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.post<{ ok: boolean; message: string }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/sharepoint-settings/test`
    );
    return data;
  },

  exportActivityPdf: async (query: AuditLogsQuery = {}): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/activity.pdf`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  exportActivityExcel: async (query: AuditLogsQuery = {}): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/activity.xlsx`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  exportMetricsCsv: async (query?: { from?: string; to?: string }): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/metrics.csv`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  exportMetricsPdf: async (query?: { from?: string; to?: string }): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/metrics.pdf`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  exportMetricsExcel: async (query?: { from?: string; to?: string }): Promise<Blob> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<Blob>(
      `/admin/orgs/${encodeURIComponent(orgId)}/reports/metrics.xlsx`,
      { params: query, responseType: 'blob' }
    );
    return data;
  },

  getGroupDeleteImpact: async (groupId: string): Promise<GroupDeleteImpact> => {
    const { data } = await apiClient.get<GroupDeleteImpact>(
      `/groups/${encodeURIComponent(groupId)}/delete-impact`
    );
    return data;
  },

  deleteGroup: async (groupId: string, confirmName: string): Promise<void> => {
    await apiClient.delete(`/groups/${encodeURIComponent(groupId)}`, {
      data: { confirmName },
    });
  },

  getGroupSensitivityPolicy: async (groupId: string): Promise<string[] | null> => {
    const { data } = await apiClient.get<{ enabledDocumentSensitivityLevels?: string[] | null }>(
      `/groups/${encodeURIComponent(groupId)}`
    );
    return Array.isArray(data.enabledDocumentSensitivityLevels)
      ? data.enabledDocumentSensitivityLevels
      : null;
  },

  updateGroupSensitivityPolicy: async (groupId: string, levels: string[]): Promise<void> => {
    await apiClient.put(`/admin/groups/${encodeURIComponent(groupId)}/document-sensitivity-policy`, {
      enabledDocumentSensitivityLevels: levels,
    });
  },

};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Prefer importing from `hooks/queries/admin` */
export {
  useDashboardState,
  useAdminStats,
  useOrgAiSettings,
  useUsers,
  useAuditLogs,
  useGroupHealth,
  useGroupDetail,
  useActivitySeries,
  useUsageSummary,
  usePipelineMetrics,
  useMetricsByUser,
} from '../hooks/queries/admin';
