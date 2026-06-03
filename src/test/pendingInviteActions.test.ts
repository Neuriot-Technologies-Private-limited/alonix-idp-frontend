import { describe, expect, it } from 'vitest';
import type { User } from '../services/userService';
import {
  canResendExpiredInvite,
  getExpiredInviteTargets,
} from '../pages/users/userManagement/pendingInviteActions';

const expiredUser: User = {
  _id: 'invite:abc123',
  name: 'Sanjeev T',
  email: 'sanjeev@alonix.us',
  role: 'SEARCH_USER',
  status: 'Inactive',
  group: 'LEGAL_DEMO',
  groupID: 'grp-legal',
  lastActive: 'Invite expired',
  isPendingInvite: true,
  inviteExpired: true,
  inviteId: 'abc123',
  pendingInvites: [{ inviteId: 'abc123', groupId: 'grp-legal', expired: true }],
};

describe('pendingInviteActions', () => {
  it('getExpiredInviteTargets returns pending expired invites', () => {
    expect(getExpiredInviteTargets(expiredUser)).toEqual([
      { inviteId: 'abc123', groupId: 'grp-legal' },
    ]);
  });

  it('canResendExpiredInvite allows group admin for their workspace', () => {
    expect(canResendExpiredInvite(expiredUser, false, ['grp-legal'])).toBe(true);
    expect(canResendExpiredInvite(expiredUser, false, ['other-grp'])).toBe(false);
  });

  it('canResendExpiredInvite allows company admin', () => {
    expect(canResendExpiredInvite(expiredUser, true, [])).toBe(true);
  });
});
