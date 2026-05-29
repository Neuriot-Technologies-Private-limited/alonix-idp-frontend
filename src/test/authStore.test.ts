import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthContextPayload, UserDetails } from '../types/auth';
import { useAuthStore } from '../stores/authStore';

const baseContext: AuthContextPayload = {
  orgId: 'org-1',
  orgRole: 'MEMBER',
  groups: [
    { groupId: 'g1', groupName: 'A', role: 'GROUP_ADMIN' },
    { groupId: 'g2', groupName: 'B', role: 'SEARCH_USER' },
  ],
  activeGroupId: 'g1',
  activeGroupRole: 'GROUP_ADMIN',
  capabilities: ['GROUP_MEMBER_MANAGE'],
};

const baseUser: UserDetails = {
  username: 'a@example.com',
  email: 'a@example.com',
  preferences: { emailNotifications: true, productUpdates: false, weeklyDigest: true },
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      context: null,
      isInitialized: false,
    });
  });

  it('setAuth stores token, user, and context', () => {
    useAuthStore.getState().setAuth('tok', baseUser, baseContext);
    const s = useAuthStore.getState();
    expect(s.token).toBe('tok');
    expect(s.user?.email).toBe('a@example.com');
    expect(s.context?.activeGroupId).toBe('g1');
    expect(s.isInitialized).toBe(true);
  });

  it('setActiveGroup updates capabilities for the selected workspace', () => {
    useAuthStore.getState().setAuth('tok', baseUser, baseContext);
    useAuthStore.getState().setActiveGroup('g2');
    const ctx = useAuthStore.getState().context;
    expect(ctx?.activeGroupId).toBe('g2');
    expect(ctx?.activeGroupRole).toBe('SEARCH_USER');
    expect(ctx?.capabilities).toContain('USER_DASHBOARD_VIEW');
    expect(ctx?.capabilities).not.toContain('GROUP_MEMBER_MANAGE');
  });

  it('updateUser merges preferences with defaults', () => {
    useAuthStore.getState().setAuth('tok', baseUser, baseContext);
    useAuthStore.getState().updateUser({ preferences: { weeklyDigest: false } });
    expect(useAuthStore.getState().user?.preferences).toEqual({
      emailNotifications: true,
      productUpdates: false,
      weeklyDigest: false,
    });
  });

  it('logout clears session', () => {
    useAuthStore.getState().setAuth('tok', baseUser, baseContext);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().context).toBeNull();
  });
});
