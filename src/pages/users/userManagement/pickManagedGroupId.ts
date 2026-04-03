import type { User } from '../../../services/userService';

/** Group id to use for membership remove / add flows for group admins. */
export function pickManagedGroupId(
  user: User,
  activeGroupId: string | null | undefined,
  adminGroupIds: string[] | null
): string | null {
  const ws = user.workspaces?.length ? user.workspaces : [];
  const fallback = user.groupID ? [{ groupId: user.groupID }] : [];
  const list = ws.length ? ws : fallback;
  const adminSet = adminGroupIds?.length ? new Set(adminGroupIds.map(String)) : null;
  const candidates = adminSet
    ? list.filter((w) => w.groupId && adminSet.has(String(w.groupId)))
    : list;
  const active = activeGroupId ? String(activeGroupId) : '';
  if (active && candidates.some((c) => String(c.groupId) === active)) return active;
  const first = candidates[0]?.groupId;
  return first ? String(first) : user.groupID || null;
}
