import { describe, expect, it } from 'vitest';
import type { AuthContextPayload } from '../types/auth';
import { getDefaultAuthedPath, isSearchUserOnly } from '../utils/routingAuth';

const memberContext = (groups: AuthContextPayload['groups']): AuthContextPayload => ({
  orgId: 'org-1',
  orgRole: 'MEMBER',
  groups,
  activeGroupId: null,
  activeGroupRole: null,
  capabilities: [],
});

describe('routingAuth', () => {
  describe('isSearchUserOnly', () => {
    it('is true for members without GROUP_ADMIN workspace', () => {
      const ctx = memberContext([{ groupId: 'g1', groupName: 'A', role: 'SEARCH_USER' }]);
      expect(isSearchUserOnly(ctx)).toBe(true);
    });

    it('is false when member is GROUP_ADMIN in any workspace', () => {
      const ctx = memberContext([
        { groupId: 'g1', groupName: 'A', role: 'SEARCH_USER' },
        { groupId: 'g2', groupName: 'B', role: 'GROUP_ADMIN' },
      ]);
      expect(isSearchUserOnly(ctx)).toBe(false);
    });

    it('is false for company admin', () => {
      expect(isSearchUserOnly({ ...memberContext([]), orgRole: 'COMPANY_ADMIN' })).toBe(false);
    });
  });

  describe('getDefaultAuthedPath', () => {
    it('routes search-only members to documents', () => {
      const ctx = memberContext([{ groupId: 'g1', groupName: 'A', role: 'SEARCH_USER' }]);
      expect(getDefaultAuthedPath(ctx)).toBe('/documents');
    });

    it('routes admins and group admins to dashboard', () => {
      expect(getDefaultAuthedPath({ ...memberContext([]), orgRole: 'COMPANY_ADMIN' })).toBe('/dashboard');
      const ctx = memberContext([{ groupId: 'g1', groupName: 'A', role: 'GROUP_ADMIN' }]);
      expect(getDefaultAuthedPath(ctx)).toBe('/dashboard');
    });
  });
});
