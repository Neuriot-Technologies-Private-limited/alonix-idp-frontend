import { useQuery } from '@tanstack/react-query';
import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';
import { getOrgPipelineDocuments } from './chatApi';

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
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'Group Admin' | 'Search User';
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
}

export interface GroupDetail extends GroupHealth {
  description: string;
  createdOn: string;
  storageUsed: string;
  confidenceScore: string;
  members: GroupMember[];
  documents: GroupDocument[];
  recentActivity: GroupActivity[];
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'invite' | 'ingestion' | 'creation' | 'warning' | 'info';
  metadata?: Record<string, any>;
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

export interface OrgAiSettings {
  orgId: string;
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
  provider?: AiProvider;
  model?: string;
  openSourceBaseUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  openSourceApiKey?: string;
}

export type CreateGroupResult =
  | { ok: true; group: { id: string; name: string; users: number; docs: number; status: string; statusLabel: string } }
  | { ok: false; error: string };

const PIPELINE_STAGE_IDLE = { status: 'idle', startTime: null, endTime: null };

/** Safe pipeline for UI when API omits stages (avoids crash on `p.ingestion.status`). */
export function mergePipeline(raw: unknown): any {
  const p = raw as Record<string, unknown> | null | undefined;
  if (!p) {
    return {
      ingestion: { ...PIPELINE_STAGE_IDLE },
      extraction: { ...PIPELINE_STAGE_IDLE },
      classification: { ...PIPELINE_STAGE_IDLE },
    };
  }
  return {
    ingestion: (p.ingestion as object) ?? { ...PIPELINE_STAGE_IDLE },
    extraction: (p.extraction as object) ?? { ...PIPELINE_STAGE_IDLE },
    classification: (p.classification as object) ?? { ...PIPELINE_STAGE_IDLE },
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

export function normalizePipelineDocument(d: Record<string, unknown>): Record<string, unknown> {
  const uploaderRaw = d.uploader ?? d.uploadedBy;
  const uploader =
    uploaderRaw != null && String(uploaderRaw).trim() !== '' ? String(uploaderRaw) : 'Unknown';
  const uploadedAt = coalesceUploadIso(d);
  return {
    ...d,
    pipeline: mergePipeline(d.pipeline),
    uploader,
    ...(uploadedAt != null ? { uploadedAt } : {}),
  };
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
    const { data } = await apiClient.get<{ groups: any[] }>(`/admin/orgs/${encodeURIComponent(orgId)}/groups`);
    const groups = data.groups || [];
    return groups.map((g) => ({
      id: g.id || g._id,
      name: g.name || g.groupName,
      slug: g.slug,
      users: typeof g.memberCount === 'number' ? g.memberCount : 0,
      docs: typeof g.documentCount === 'number' ? g.documentCount : 0,
      status: 'Healthy',
      statusLabel: 'Healthy',
      membershipRole: g.membershipRole ?? undefined,
    }));
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ logs: AuditLog[] }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/audit-logs`,
      { params: { limit: 80 } }
    );
    return (data.logs || []).map((l) => ({
      ...l,
      type: (l.type as AuditLog['type']) || 'info',
    }));
  },

  getUsers: async (): Promise<User[]> => {
    const orgId = requireOrgId();
    const { data } = await apiClient.get<{ users: any[] }>(`/admin/orgs/${encodeURIComponent(orgId)}/users`);
    return (data.users || []).map((u: any) => ({
      _id: u._id,
      name: u.name || u.email,
      role: u.orgRole === 'COMPANY_ADMIN' ? 'COMPANY_ADMIN' : 'MEMBER',
      lastActive: '—',
      status: u.emailVerified ? 'Active' : 'Pending',
      groupID: u.groupID,
    }));
  },

  getDocuments: async (): Promise<any[]> => {
    const { data } = await getOrgPipelineDocuments();
    return (data.documents || []).map((row) => normalizePipelineDocument(row as Record<string, unknown>));
  },

  getPipelineDocuments: async (): Promise<any[]> => {
    const { data } = await getOrgPipelineDocuments();
    return (data.documents || []).map((row) => normalizePipelineDocument(row as Record<string, unknown>));
  },

  getGroupDetail: async (id: string): Promise<GroupDetail> => {
    requireOrgId();
    const [{ data: g }, { data: mem }, { data: pipe }, { data: inv }] = await Promise.all([
      apiClient.get<any>(`/groups/${encodeURIComponent(id)}`),
      apiClient.get<{ members: any[] }>(`/admin/groups/${encodeURIComponent(id)}/members`),
      getOrgPipelineDocuments(),
      apiClient.get<{ invites: any[] }>(`/admin/groups/${encodeURIComponent(id)}/invites`),
    ]);

    const groupName = g.groupName || g.name || 'Workspace';
    const docsRaw = (pipe.documents || []).filter((d: any) => String(d.groupId) === String(id));

    const members: GroupMember[] = (mem.members || []).map((m: any) => ({
      id: m.userEmail,
      name: m.userEmail,
      email: m.userEmail,
      role: m.role === 'GROUP_ADMIN' ? 'Group Admin' : 'Search User',
      membershipState: 'joined',
    }));

    const inviteMembers: GroupMember[] = (inv.invites || []).map((item: any) => ({
      id: `invite:${String(item.id)}`,
      inviteId: String(item.id),
      name: String(item.inviteeName || item.email || ''),
      email: String(item.email || ''),
      role: 'Search User',
      membershipState: item.status === 'expired' ? 'expired' : 'invited',
    }));

    const dedupedInviteMembers = inviteMembers.filter(
      (im) => !members.some((m) => m.email.toLowerCase() === im.email.toLowerCase())
    );
    const mergedMembers = [...members, ...dedupedInviteMembers];

    const documents: GroupDocument[] = docsRaw.slice(0, 24).map((d: any) => ({
      id: d.id,
      name: d.title || d.fileName,
      size: d.size || '—',
      status: d.pipeline?.ingestion?.status === 'done' ? 'Healthy' : 'Pending',
      date: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—',
      type: d.type || 'FILE',
    }));

    return {
      id: g._id?.toString?.() || id,
      name: groupName,
      slug: g.slug,
      users: members.length,
      docs: typeof g.documentCount === 'number' ? g.documentCount : docsRaw.length,
      status: 'Healthy',
      statusLabel: 'Healthy',
      description: g.description || 'Workspace details from your organization.',
      createdOn: g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      storageUsed: '—',
      confidenceScore: '—',
      members: mergedMembers,
      documents,
      recentActivity: [
        {
          id: '1',
          user: members[0]?.name || 'Team',
          action: `Activity in ${groupName}`,
          timestamp: 'Recently',
          type: 'success' as const,
        },
      ],
    };
  },

  createGroup: async (name: string): Promise<CreateGroupResult> => {
    const orgId = requireOrgId();
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Enter a group name.' };
    try {
      const { data } = await apiClient.post<{ group: any }>(`/admin/orgs/${encodeURIComponent(orgId)}/groups`, {
        groupName: trimmed,
      });
      const g = data.group;
      const gid = g._id?.toString?.() || '';
      return {
        ok: true,
        group: {
          id: gid,
          name: g.groupName || trimmed,
          users: 0,
          docs: 0,
          status: 'Healthy',
          statusLabel: 'Healthy',
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
};

export const useDashboardState = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['dashboard-state', orgId],
    queryFn: adminService.getDashboardState,
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
};

export const useAdminStats = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['admin-stats', orgId],
    queryFn: adminService.getStats,
    enabled: !!orgId,
  });
};

export const useGroupHealth = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['group-health', orgId],
    queryFn: adminService.getGroupHealth,
    enabled: !!orgId,
  });
};

export const useAuditLogs = (opts?: { enabled?: boolean }) => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const isCompanyAdmin = useAuthStore((s) => s.context?.orgRole === 'COMPANY_ADMIN');
  return useQuery({
    queryKey: ['audit-logs', orgId],
    queryFn: adminService.getAuditLogs,
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
  });
};

export const useUsers = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const isCompanyAdmin = useAuthStore((s) => s.context?.orgRole === 'COMPANY_ADMIN');
  return useQuery({
    queryKey: ['users', orgId],
    queryFn: adminService.getUsers,
    enabled: !!orgId && isCompanyAdmin,
  });
};

export const useOrgAiSettings = (opts?: { enabled?: boolean }) => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const isCompanyAdmin = useAuthStore((s) => s.context?.orgRole === 'COMPANY_ADMIN');
  return useQuery({
    queryKey: ['org-ai-settings', orgId],
    queryFn: adminService.getOrgAiSettings,
    enabled: opts?.enabled !== false && !!orgId && isCompanyAdmin,
    staleTime: 60 * 1000,
  });
};

export const useDocuments = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['documents', orgId],
    queryFn: adminService.getDocuments,
    enabled: !!orgId,
  });
};

export const usePipelineDocuments = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['pipeline-documents', orgId],
    queryFn: adminService.getPipelineDocuments,
    enabled: !!orgId,
  });
};

export const useGroupDetail = (id: string) => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  return useQuery({
    queryKey: ['group-detail', id, orgId],
    queryFn: () => adminService.getGroupDetail(id),
    enabled: !!id && !!orgId,
  });
};
