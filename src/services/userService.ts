import { useQuery } from '@tanstack/react-query';
import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';

export type UserWorkspace = { groupId: string; groupName?: string; role?: string | null };

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'GROUP_ADMIN' | 'SEARCH_USER';
  status: 'Active' | 'Inactive' | 'Pending';
  group: string;
  groupID: string;
  lastActive: string;
  /** Populated from admin users API for group-scoped actions */
  workspaces?: UserWorkspace[];
}

export type InviteUsersToGroupPayload = {
  groupId: string;
  newUser?: { name: string; email: string } | null;
  existingUserIds: string[];
};

export type InviteUsersToGroupResult =
  | { ok: true; addedExisting: number; invitedNew: boolean }
  | { ok: false; error: string };

function formatLastActiveFromRecord(u: Record<string, unknown>): string {
  if (typeof u.lastActive === 'string') {
    const s = u.lastActive.trim();
    if (s && s !== '—') return s;
  }
  const raw = u.lastLoginAt ?? u.updatedAt;
  if (raw == null || raw === '') return '—';
  const d = new Date(raw as string);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function mapApiUser(u: Record<string, unknown>): User {
  const groupID = String(u.groupID ?? '');
  const orgRole = u.orgRole as string | undefined;
  const groupLabel = typeof u.groupLabel === 'string' ? u.groupLabel.trim() : '';
  const groupNames = Array.isArray(u.groupNames) ? (u.groupNames as unknown[]).map(String) : [];
  const workspacesRaw = Array.isArray(u.workspaces) ? (u.workspaces as Record<string, unknown>[]) : [];
  const workspaces: UserWorkspace[] = workspacesRaw.map((w) => ({
    groupId: String(w.groupId ?? ''),
    groupName: typeof w.groupName === 'string' ? w.groupName : undefined,
    role: (w.role as string | null) ?? null,
  }));
  const fromWorkspaces = workspaces.map((w) => w.groupName).filter(Boolean) as string[];
  const displayGroup =
    (groupLabel && groupLabel !== '—' ? groupLabel : '') ||
    (groupNames.length ? groupNames.join(', ') : '') ||
    (fromWorkspaces.length ? [...new Set(fromWorkspaces)].join(', ') : '') ||
    '—';

  /** Org role for badge; workspace role from memberships when not company admin. */
  let role: User['role'] = 'SEARCH_USER';
  if (orgRole === 'COMPANY_ADMIN') role = 'COMPANY_ADMIN';
  else {
    const ws = workspaces as { role?: string }[];
    const hasGroupAdmin = ws.some((x) => x.role === 'GROUP_ADMIN');
    if (hasGroupAdmin) role = 'GROUP_ADMIN';
  }

  const dbStatus = String(u.status || '').toUpperCase();
  let status: User['status'] = 'Pending';
  if (dbStatus === 'INACTIVE') status = 'Inactive';
  else if (u.emailVerified === true) status = 'Active';
  else status = 'Pending';

  return {
    _id: String(u._id),
    name: String(u.name || u.email || ''),
    email: String(u.email || ''),
    role,
    status,
    group: displayGroup,
    groupID,
    lastActive: formatLastActiveFromRecord(u),
    workspaces: workspaces.length ? workspaces : undefined,
  };
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const orgId = useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
    if (!orgId) return [];
    const { data } = await apiClient.get<{ users: Record<string, unknown>[] }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/users`
    );
    return (data.users || []).map(mapApiUser);
  },

  inviteUsersToGroup: async (payload: InviteUsersToGroupPayload): Promise<InviteUsersToGroupResult> => {
    const orgId = useAuthStore.getState().context?.orgId;
    if (!orgId) return { ok: false, error: 'Not signed in' };

    const nu = payload.newUser;
    if (nu?.email?.trim() && nu?.name?.trim()) {
      try {
        await apiClient.post('/users/invite-to-group', {
          groupId: payload.groupId,
          email: nu.email.trim().toLowerCase(),
          name: nu.name.trim(),
        });
        return { ok: true, addedExisting: 0, invitedNew: true };
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } };
        return { ok: false, error: ax.response?.data?.message || 'Invite email failed' };
      }
    }

    let addedExisting = 0;
    const { data: userList } = await apiClient.get<{ users: Record<string, unknown>[] }>(
      `/admin/orgs/${encodeURIComponent(orgId)}/users`
    );
    const byId = new Map((userList.users || []).map((u) => [String(u._id), u]));

    for (const id of payload.existingUserIds) {
      const u = byId.get(id);
      const email = u && typeof u.email === 'string' ? u.email : null;
      if (!email) continue;
      try {
        await apiClient.post(`/admin/groups/${encodeURIComponent(payload.groupId)}/members`, {
          userEmail: email,
          role: 'SEARCH_USER',
        });
        addedExisting++;
      } catch {
        /* skip duplicate / errors per user */
      }
    }

    if (addedExisting === 0 && !(nu?.email?.trim() && nu?.name?.trim())) {
      return { ok: false, error: 'Select people from the list and/or complete the new invite.' };
    }

    return { ok: true, addedExisting, invitedNew: false };
  },

  /**
   * Single user update: `PATCH /api/users/update/:userId` with orgId (+ groupId for group admins).
   */
  patchOrgUser: async (
    userId: string,
    body: { name?: string; status?: 'ACTIVE' | 'INACTIVE' },
    opts?: { groupId?: string }
  ): Promise<void> => {
    const orgId = useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
    if (!orgId) throw new Error('Not signed in');
    const payload: Record<string, unknown> = { orgId, ...body };
    if (opts?.groupId) payload.groupId = opts.groupId;
    await apiClient.put(`/users/update/${encodeURIComponent(userId)}`, payload);
  },

  deleteOrgUser: async (userId: string): Promise<void> => {
    const orgId = useAuthStore.getState().context?.orgId ?? useAuthStore.getState().user?.orgId;
    if (!orgId) throw new Error('Not signed in');
    await apiClient.delete(`/admin/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`);
  },

  removeUserFromGroup: async (groupId: string, userEmail: string): Promise<void> => {
    const enc = encodeURIComponent(userEmail.toLowerCase().trim());
    await apiClient.delete(`/admin/groups/${encodeURIComponent(groupId)}/members/${enc}`);
  },
};

export const useUsers = () => {
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const orgRole = useAuthStore((s) => s.context?.orgRole);
  const groups = useAuthStore((s) => s.context?.groups ?? []);
  const canLoadDirectory =
    orgRole === 'COMPANY_ADMIN' || groups.some((g) => g.role === 'GROUP_ADMIN');
  return useQuery({
    queryKey: ['directory-users', orgId],
    queryFn: userService.getUsers,
    enabled: !!orgId && canLoadDirectory,
  });
};
