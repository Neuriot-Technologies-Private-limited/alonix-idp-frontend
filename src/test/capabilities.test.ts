import { describe, it, expect } from 'vitest';
import {
  resolveCapabilities,
  applyActiveGroupToContext,
  membershipForGroup,
} from '../core/rbac/capabilities';
import type { AuthContextPayload, GroupContext } from '../types/auth';

describe('resolveCapabilities', () => {
  it('returns full COMPANY_ADMIN capability set when orgRole is COMPANY_ADMIN', () => {
    const caps = resolveCapabilities('COMPANY_ADMIN', null);
    expect(caps).toContain('ADMIN_ALL');
    expect(caps).toContain('COMP_USER_MANAGE');
    expect(caps).toContain('GROUP_DOC_MANAGE');
    expect(caps).toContain('GROUP_CHAT_USE');
    expect(caps).toContain('GROUP_DOC_VIEW');
  });

  it('COMPANY_ADMIN does not include GROUP_MEMBER_MANAGE (group-admin only cap)', () => {
    const caps = resolveCapabilities('COMPANY_ADMIN', null);
    expect(caps).not.toContain('GROUP_MEMBER_MANAGE');
  });

  it('returns GROUP_ADMIN capability set when activeGroupRole is GROUP_ADMIN', () => {
    const caps = resolveCapabilities('MEMBER', 'GROUP_ADMIN');
    expect(caps).toContain('GROUP_MEMBER_MANAGE');
    expect(caps).toContain('ADMIN_DASHBOARD_VIEW');
    expect(caps).toContain('GROUP_DOC_MANAGE');
    expect(caps).not.toContain('ADMIN_ALL');
    expect(caps).not.toContain('COMP_USER_MANAGE');
  });

  it('GROUP_ADMIN orgRole does not override when orgRole is null', () => {
    const caps = resolveCapabilities(null, 'GROUP_ADMIN');
    expect(caps).toContain('GROUP_MEMBER_MANAGE');
    expect(caps).not.toContain('ADMIN_ALL');
  });

  it('returns minimal member capabilities when orgRole is MEMBER and no group role', () => {
    const caps = resolveCapabilities('MEMBER', null);
    expect(caps).toEqual(['GROUP_DOC_VIEW', 'GROUP_CHAT_USE', 'USER_DASHBOARD_VIEW', 'GROUP_DIRECTORY_VIEW']);
  });

  it('returns minimal member capabilities when orgRole is null and no group role', () => {
    const caps = resolveCapabilities(null, null);
    expect(caps).toEqual(['GROUP_DOC_VIEW', 'GROUP_CHAT_USE', 'USER_DASHBOARD_VIEW', 'GROUP_DIRECTORY_VIEW']);
  });

  it('COMPANY_ADMIN orgRole takes precedence over GROUP_ADMIN activeGroupRole', () => {
    const caps = resolveCapabilities('COMPANY_ADMIN', 'GROUP_ADMIN');
    expect(caps).toContain('ADMIN_ALL');
    expect(caps).not.toContain('GROUP_MEMBER_MANAGE');
  });

  it('SEARCH_USER activeGroupRole falls through to member capabilities', () => {
    const caps = resolveCapabilities('MEMBER', 'SEARCH_USER');
    expect(caps).toContain('USER_DASHBOARD_VIEW');
    expect(caps).not.toContain('ADMIN_ALL');
    expect(caps).not.toContain('GROUP_MEMBER_MANAGE');
  });
});

const baseContext: AuthContextPayload = {
  orgId: 'org-1',
  orgRole: 'MEMBER',
  groups: [
    { groupId: 'grp-a', groupName: 'Alpha', role: 'GROUP_ADMIN' },
    { groupId: 'grp-b', groupName: 'Beta', role: 'SEARCH_USER' },
  ],
  activeGroupId: null,
  activeGroupRole: null,
  capabilities: [],
};

describe('applyActiveGroupToContext', () => {
  it('sets activeGroupId and resolves GROUP_ADMIN role for a known group', () => {
    const result = applyActiveGroupToContext(baseContext, 'grp-a');
    expect(result.activeGroupId).toBe('grp-a');
    expect(result.activeGroupRole).toBe('GROUP_ADMIN');
    expect(result.capabilities).toContain('GROUP_MEMBER_MANAGE');
  });

  it('sets SEARCH_USER role when switching to a non-admin group', () => {
    const result = applyActiveGroupToContext(baseContext, 'grp-b');
    expect(result.activeGroupId).toBe('grp-b');
    expect(result.activeGroupRole).toBe('SEARCH_USER');
    expect(result.capabilities).not.toContain('GROUP_MEMBER_MANAGE');
  });

  it('sets activeGroupRole to null for an unknown group id', () => {
    const result = applyActiveGroupToContext(baseContext, 'grp-unknown');
    expect(result.activeGroupId).toBe('grp-unknown');
    expect(result.activeGroupRole).toBeNull();
    expect(result.capabilities).toContain('USER_DASHBOARD_VIEW');
  });

  it('does not mutate the original context', () => {
    applyActiveGroupToContext(baseContext, 'grp-a');
    expect(baseContext.activeGroupId).toBeNull();
    expect(baseContext.activeGroupRole).toBeNull();
  });

  it('preserves all other context fields unchanged', () => {
    const result = applyActiveGroupToContext(baseContext, 'grp-a');
    expect(result.orgId).toBe(baseContext.orgId);
    expect(result.orgRole).toBe(baseContext.orgRole);
    expect(result.groups).toBe(baseContext.groups);
  });

  it('COMPANY_ADMIN keeps full admin capabilities regardless of group switched to', () => {
    const adminContext: AuthContextPayload = {
      ...baseContext,
      orgRole: 'COMPANY_ADMIN',
    };
    const result = applyActiveGroupToContext(adminContext, 'grp-b');
    expect(result.capabilities).toContain('ADMIN_ALL');
  });
});

const groups: GroupContext[] = [
  { groupId: 'g1', groupName: 'Engineering', role: 'GROUP_ADMIN' },
  { groupId: 'g2', groupName: 'Marketing', role: 'SEARCH_USER' },
  { groupId: 'g3', groupName: 'HR Team', role: 'SEARCH_USER' },
];

describe('membershipForGroup', () => {
  it('finds a group by exact groupId', () => {
    const result = membershipForGroup(groups, 'g1');
    expect(result?.groupId).toBe('g1');
  });

  it('falls back to name match when id is absent', () => {
    const result = membershipForGroup(groups, null, 'Marketing');
    expect(result?.groupId).toBe('g2');
  });

  it('name match is case-insensitive', () => {
    const result = membershipForGroup(groups, null, 'engineering');
    expect(result?.groupId).toBe('g1');
  });

  it('name match trims whitespace', () => {
    const result = membershipForGroup(groups, null, '  HR Team  ');
    expect(result?.groupId).toBe('g3');
  });

  it('returns undefined when neither id nor name matches', () => {
    expect(membershipForGroup(groups, 'not-a-real-id')).toBeUndefined();
  });

  it('returns undefined for empty groups array', () => {
    expect(membershipForGroup([], 'g1', 'Engineering')).toBeUndefined();
  });

  it('prefers id match over name match when both are provided', () => {
    const result = membershipForGroup(groups, 'g2', 'Engineering');
    expect(result?.groupId).toBe('g2');
  });

  it('returns undefined when id is empty string and name is missing', () => {
    expect(membershipForGroup(groups, '', null)).toBeUndefined();
  });
});
