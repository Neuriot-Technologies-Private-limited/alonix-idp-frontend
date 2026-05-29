import { describe, expect, it } from 'vitest';
import type { User } from '../services/userService';
import { pickManagedGroupId } from '../pages/users/userManagement/pickManagedGroupId';

function user(overrides: Partial<User> = {}): User {
  return {
    _id: 'u1',
    id: 'u1',
    name: 'Alice',
    email: 'a@example.com',
    role: 'GROUP_ADMIN',
    status: 'Active',
    group: 'Fallback',
    groupID: 'fallback-group',
    lastActive: '—',
    ...overrides,
  };
}

describe('pickManagedGroupId', () => {
  it('prefers active group when user is admin for it', () => {
    const u = user({
      workspaces: [
        { groupId: 'g1', groupName: 'A' },
        { groupId: 'g2', groupName: 'B' },
      ],
    });
    expect(pickManagedGroupId(u, 'g2', ['g1', 'g2'])).toBe('g2');
  });

  it('returns first admin-scoped workspace when active is not admin', () => {
    const u = user({ workspaces: [{ groupId: 'g1' }, { groupId: 'g2' }] });
    expect(pickManagedGroupId(u, 'g9', ['g1', 'g2'])).toBe('g1');
  });

  it('falls back to user.groupID when no workspaces', () => {
    expect(pickManagedGroupId(user(), null, null)).toBe('fallback-group');
  });
});
