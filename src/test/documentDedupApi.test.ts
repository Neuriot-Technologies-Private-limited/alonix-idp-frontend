import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());

vi.mock('../services/api/client', () => ({
  default: {
    post: (...args: unknown[]) => post(...args),
  },
}));

import { cancelDocumentDedup, checkDocumentDedup, uploadDocument } from '../services/documentApi';

describe('document dedup API', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { ok: true } });
  });

  it('checks without a client documentId and uses the upload timeout', async () => {
    const file = new File(['pdf'], 'claim.pdf', { type: 'application/pdf' });
    await checkDocumentDedup(file, { userId: 'user-1', groupId: 'g 1', orgId: 'org-1' });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe(`/groups/${encodeURIComponent('g 1')}/documents/dedup-check`);
    expect(body).toBeInstanceOf(FormData);
    const fd = body as FormData;
    expect(fd.get('file')).toBe(file);
    expect(fd.get('userId')).toBe('user-1');
    expect(fd.get('groupId')).toBe('g 1');
    expect(fd.get('orgId')).toBe('org-1');
    expect(fd.get('documentId')).toBeNull();
    expect(config).toMatchObject({ timeout: 5 * 60 * 1000 });
  });

  it('appends documentId on upload only when the file will be stored', async () => {
    const file = new File(['pdf'], 'claim.pdf', { type: 'application/pdf' });
    await uploadDocument(file, {
      userId: 'user-1',
      groupId: 'g1',
      orgId: 'org-1',
      documentId: '66f1c0a2b3c4d5e6f7a8b9c0',
    });
    await uploadDocument(file, { userId: 'user-1', groupId: 'g1' });

    const withId = post.mock.calls[0][1] as FormData;
    const withoutId = post.mock.calls[1][1] as FormData;
    expect(withId.get('documentId')).toBe('66f1c0a2b3c4d5e6f7a8b9c0');
    expect(withoutId.get('documentId')).toBeNull();
    expect(post.mock.calls[0][0]).toBe('/groups/g1/documents/upload');
  });

  it('cancels with documentId and optional hitlTaskId', async () => {
    await cancelDocumentDedup({ documentId: '66f1c0a2b3c4d5e6f7a8b9c0', groupId: 'g1', hitlTaskId: null });
    await cancelDocumentDedup({
      documentId: '66f1c0a2b3c4d5e6f7a8b9c1',
      groupId: 'g1',
      hitlTaskId: 'task-1',
    });

    expect(post.mock.calls[0][0]).toBe('/groups/g1/documents/dedup-cancel');
    expect(post.mock.calls[0][1]).toEqual({ documentId: '66f1c0a2b3c4d5e6f7a8b9c0' });
    expect(post.mock.calls[1][1]).toEqual({
      documentId: '66f1c0a2b3c4d5e6f7a8b9c1',
      hitlTaskId: 'task-1',
    });
  });
});
