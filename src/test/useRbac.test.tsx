import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AuthContextPayload } from '../types/auth';
import { useAuthStore } from '../stores/authStore';
import { useRbac } from '../hooks/useRbac';

const memberAdminContext: AuthContextPayload = {
  orgId: 'org-1',
  orgRole: 'MEMBER',
  groups: [
    { groupId: 'g1', groupName: 'A', role: 'GROUP_ADMIN' },
    { groupId: 'g2', groupName: 'B', role: 'SEARCH_USER' },
  ],
  activeGroupId: 'g1',
  activeGroupRole: 'GROUP_ADMIN',
  capabilities: ['GROUP_MEMBER_MANAGE', 'GROUP_DOC_VIEW'],
};

describe('useRbac', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, context: null, isInitialized: false });
  });

  it('exposes capability helpers from context', () => {
    useAuthStore.setState({ context: memberAdminContext });
    const { result } = renderHook(() => useRbac());
    expect(result.current.hasCapability('GROUP_DOC_VIEW')).toBe(true);
    expect(result.current.hasAllCapabilities(['GROUP_DOC_VIEW', 'GROUP_MEMBER_MANAGE'])).toBe(true);
    expect(result.current.hasAnyCapability(['ADMIN_ALL', 'GROUP_DOC_VIEW'])).toBe(true);
  });

  it('computes adminGroupIds for group admins', () => {
    useAuthStore.setState({ context: memberAdminContext });
    const { result } = renderHook(() => useRbac());
    expect(result.current.adminGroupIds).toEqual(['g1']);
    expect(result.current.isGroupAdminFor('g1')).toBe(true);
    expect(result.current.isGroupAdminFor('g2')).toBe(false);
  });

  it('treats company admin as admin for all groups', () => {
    useAuthStore.setState({
      context: { ...memberAdminContext, orgRole: 'COMPANY_ADMIN' },
    });
    const { result } = renderHook(() => useRbac());
    expect(result.current.adminGroupIds).toBeNull();
    expect(result.current.isGroupAdminFor('g2')).toBe(true);
  });
});
