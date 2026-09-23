'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('../services/api/client', () => ({
  default: { get, post, put: vi.fn(), delete: vi.fn() },
  apiClient: { get, post, put: vi.fn(), delete: vi.fn() },
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

describe('adminService industry domains', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    vi.resetModules();
  });

  it('listIndustryDomains sorts by sortOrder and returns [] when missing', async () => {
    get.mockResolvedValueOnce({
      data: {
        domains: [
          { key: 'general', label: 'General', description: 'g', sortOrder: 3 },
          { key: 'property_casualty', label: 'Property & Casualty', description: 'p', sortOrder: 1 },
          { key: 'health', label: 'Health', description: 'h', sortOrder: 2 },
        ],
      },
    });

    const { adminService } = await import('../services/adminService');
    const domains = await adminService.listIndustryDomains();

    expect(get).toHaveBeenCalledWith('/industry-domains');
    expect(domains.map((d) => d.key)).toEqual(['property_casualty', 'health', 'general']);

    get.mockResolvedValueOnce({ data: {} });
    const empty = await adminService.listIndustryDomains();
    expect(empty).toEqual([]);
  });

  it('createGroup requires industryDomain and posts key in body', async () => {
    const { adminService } = await import('../services/adminService');

    const missing = await adminService.createGroup('Alpha', 'RAW_PII_ALLOWED', '  ');
    expect(missing).toEqual({ ok: false, error: 'Select an industry domain.' });
    expect(post).not.toHaveBeenCalled();

    post.mockResolvedValueOnce({
      data: {
        group: {
          _id: 'g1',
          groupName: 'Alpha',
          piiHandlingPolicy: 'RAW_PII_ALLOWED',
          industryDomain: 'health',
        },
      },
    });

    const ok = await adminService.createGroup('Alpha', 'RAW_PII_ALLOWED', 'health');
    expect(post).toHaveBeenCalledWith('/admin/orgs/org-1/groups', {
      groupName: 'Alpha',
      piiHandlingPolicy: 'RAW_PII_ALLOWED',
      industryDomain: 'health',
    });
    expect(ok).toMatchObject({
      ok: true,
      group: { id: 'g1', name: 'Alpha', industryDomain: 'health' },
    });
  });
});
