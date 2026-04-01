import type { AuthContextPayload, GroupContext } from '../../types/auth';

/** Capability sets aligned with alonix-idp-node-backend permissionService. */
export function resolveCapabilities(
  orgRole: AuthContextPayload['orgRole'],
  activeGroupRole: AuthContextPayload['activeGroupRole']
): string[] {
  if (orgRole === 'COMPANY_ADMIN') {
    return [
      'ADMIN_ALL',
      'ADMIN_DASHBOARD_VIEW',
      'GROUP_DOC_VIEW',
      'GROUP_DOC_UPLOAD',
      'GROUP_DOC_INGEST',
      'GROUP_DOC_DELETE',
      'GROUP_CHAT_USE',
      'COMP_USER_MANAGE',
      'GROUP_DOC_MANAGE',
      'GROUP_DIRECTORY_VIEW',
    ];
  }
  if (activeGroupRole === 'GROUP_ADMIN') {
    return [
      'GROUP_MEMBER_MANAGE',
      'ADMIN_DASHBOARD_VIEW',
      'GROUP_DOC_VIEW',
      'GROUP_DOC_UPLOAD',
      'GROUP_DOC_INGEST',
      'GROUP_DOC_DELETE',
      'GROUP_CHAT_USE',
      'GROUP_DOC_MANAGE',
      'GROUP_DIRECTORY_VIEW',
    ];
  }
  return ['GROUP_DOC_VIEW', 'GROUP_CHAT_USE', 'USER_DASHBOARD_VIEW', 'GROUP_DIRECTORY_VIEW'];
}

export function applyActiveGroupToContext(
  prev: AuthContextPayload,
  groupId: string
): AuthContextPayload {
  const group = prev.groups.find((g) => g.groupId === groupId);
  const activeGroupRole = group?.role ?? null;
  return {
    ...prev,
    activeGroupId: groupId,
    activeGroupRole,
    capabilities: resolveCapabilities(prev.orgRole, activeGroupRole),
  };
}

export function membershipForGroup(
  groups: GroupContext[],
  docGroupId?: string | null,
  docGroupName?: string | null
): GroupContext | undefined {
  const id = String(docGroupId || '').trim();
  if (id) {
    const byId = groups.find((g) => g.groupId === id);
    if (byId) return byId;
  }
  const name = String(docGroupName || '').trim().toLowerCase();
  if (!name) return undefined;
  return groups.find((g) => g.groupName.trim().toLowerCase() === name);
}
