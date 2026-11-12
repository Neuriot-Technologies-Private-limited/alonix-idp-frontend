'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const patch = vi.fn();

vi.mock('../services/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch, delete: vi.fn() },
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch, delete: vi.fn() },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      context: { orgId: 'org-1' },
      user: { orgId: 'org-1' },
    }),
  },
}));

vi.mock('../services/documentApi', () => ({
  getOrgPipelineDocuments: vi.fn(async () => ({ data: { documents: [] } })),
}));

describe('adminService.updateGroupDescription', () => {
  beforeEach(() => {
    patch.mockReset();
    vi.resetModules();
  });

  it('PATCHes the group endpoint with the trimmed description payload', async () => {
    patch.mockResolvedValueOnce({ data: {} });

    const { adminService } = await import('../services/adminService');

    await adminService.updateGroupDescription('g1', 'Updated workspace description');

    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledWith('/groups/g1', { description: 'Updated workspace description' });
  });

  it('URL-encodes the group id', async () => {
    patch.mockResolvedValueOnce({ data: {} });

    const { adminService } = await import('../services/adminService');

    await adminService.updateGroupDescription('group id/with space', 'desc');

    expect(patch).toHaveBeenCalledWith('/groups/group%20id%2Fwith%20space', { description: 'desc' });
  });

  it('propagates errors from the API client', async () => {
    patch.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Server error' } } });

    const { adminService } = await import('../services/adminService');

    await expect(adminService.updateGroupDescription('g1', 'desc')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
