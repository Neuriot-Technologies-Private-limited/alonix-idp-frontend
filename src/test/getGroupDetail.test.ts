'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('../services/api/client', () => ({
  default: { get, post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { get, post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      context: { orgId: 'org-1' },
      user: { orgId: 'org-1' },
    }),
  },
}));

vi.mock('../services/chatApi', () => ({
  getOrgPipelineDocuments: vi.fn(async () => ({ data: { documents: [] } })),
}));

describe('adminService.getGroupDetail', () => {
  beforeEach(() => {
    get.mockReset();
    vi.resetModules();
  });

  it('throws GROUP_NOT_FOUND on 404 and does not fan out members/invites', async () => {
    get.mockRejectedValueOnce({
      response: { status: 404, data: { message: 'Group not found' } },
    });

    const { adminService } = await import('../services/adminService');

    await expect(adminService.getGroupDetail('deleted-group-id')).rejects.toMatchObject({
      status: 404,
      code: 'GROUP_NOT_FOUND',
    });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/groups/deleted-group-id');
  });

  it('loads members/invites/audit after group exists', async () => {
    get
      .mockResolvedValueOnce({
        data: {
          _id: 'g1',
          groupName: 'Alpha',
          description: 'd',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({ data: { members: [] } })
      .mockResolvedValueOnce({ data: { invites: [] } })
      .mockResolvedValueOnce({ data: { logs: [], total: 0, skip: 0, limit: 25 } });

    const { adminService } = await import('../services/adminService');
    const detail = await adminService.getGroupDetail('g1');

    expect(detail.name).toBe('Alpha');
    expect(detail.id).toBe('g1');
    expect(get.mock.calls.map((c) => c[0])).toEqual([
      '/groups/g1',
      '/admin/groups/g1/members',
      '/admin/groups/g1/invites',
      '/admin/groups/g1/audit-logs',
    ]);
  });
});
