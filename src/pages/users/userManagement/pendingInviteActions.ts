import type { User } from '../../../services/userService';
import { isPendingInviteUser } from '../../../services/userService';

export type ExpiredInviteTarget = { inviteId: string; groupId: string };

export function getExpiredInviteTargets(user: User): ExpiredInviteTarget[] {
  const fromList = (user.pendingInvites ?? []).filter((p) => p.expired);
  if (fromList.length) {
    return fromList.map((p) => ({ inviteId: p.inviteId, groupId: p.groupId }));
  }
  if (!user.inviteExpired) return [];
  const inviteId =
    user.inviteId ||
    (String(user._id || '').startsWith('invite:') ? String(user._id).slice(7) : '');
  const groupId = user.groupID || user.workspaces?.[0]?.groupId || '';
  if (inviteId && groupId) return [{ inviteId, groupId }];
  return [];
}

export function canResendExpiredInvite(
  user: User,
  isCompanyAdmin: boolean,
  adminGroupIds: string[]
): boolean {
  if (!isPendingInviteUser(user)) return false;
  const targets = getExpiredInviteTargets(user);
  if (!targets.length) return false;
  if (isCompanyAdmin) return true;
  const adminSet = new Set(adminGroupIds.map(String));
  return targets.some((t) => adminSet.has(String(t.groupId)));
}
