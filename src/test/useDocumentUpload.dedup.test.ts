import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DedupCheckResult } from '../services/documentApi';

const { addJob, updateJob, checkDocumentDedup, cancelDocumentDedup, uploadDocument } = vi.hoisted(
  () => ({
    addJob: vi.fn(),
    updateJob: vi.fn(),
    checkDocumentDedup: vi.fn(),
    cancelDocumentDedup: vi.fn(),
    uploadDocument: vi.fn(),
  })
);

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../hooks/queries/admin', () => ({
  useGroupHealth: () => ({ data: [] }),
}));

vi.mock('../services/documentApi', () => ({
  checkDocumentDedup: (...args: unknown[]) => checkDocumentDedup(...args),
  cancelDocumentDedup: (...args: unknown[]) => cancelDocumentDedup(...args),
  uploadDocument: (...args: unknown[]) => uploadDocument(...args),
}));

vi.mock('../stores/uploadStore', () => ({
  useUploadStore: () => ({ addJob, updateJob }),
}));

vi.mock('../components/alert', () => ({
  useAlert: () => ({ alert: vi.fn() }),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: { getState: () => ({ setActiveGroup: vi.fn() }) },
}));

vi.mock('../utils/pipelineDocumentsCache', () => ({
  optimisticAppendUploadedDocument: vi.fn(),
}));

import { useDocumentUpload } from '../pages/documents/hooks/upload/useDocumentUpload';

function checkResult(overrides: Partial<DedupCheckResult> = {}) {
  const data: DedupCheckResult = {
    action: 'upload',
    documentId: '66f1c0a2b3c4d5e6f7a8b9c0',
    label: 'NEW',
    checkFailed: false,
    unlinked: false,
    hitlTaskId: null,
    matched: null,
    alsoRelated: [],
    ...overrides,
  };
  return { data };
}

function setup() {
  return renderHook(() =>
    useDocumentUpload({
      isCompanyAdmin: false,
      groups: [{ groupId: 'g1', groupName: 'Sales & Marketing', role: 'GROUP_ADMIN' }],
      adminGroupIds: ['g1'],
      orgRole: 'GROUP_ADMIN',
      orgId: 'org-1',
      user: { _id: 'user-1', email: 'a@x.com', displayName: 'Ada' },
    })
  );
}

async function selectFiles(result: ReturnType<typeof setup>['result'], files: File[]) {
  act(() => {
    result.current.setIsUploadModalOpen(true);
    result.current.setTargetGroupId('g1');
    result.current.setSelectedFiles(files);
  });
}

describe('useDocumentUpload pre-upload dedup', () => {
  beforeEach(() => {
    addJob.mockReset();
    updateJob.mockReset();
    checkDocumentDedup.mockReset();
    cancelDocumentDedup.mockReset();
    uploadDocument.mockReset();
    cancelDocumentDedup.mockResolvedValue({ data: { ok: true } });
    uploadDocument.mockResolvedValue({ data: { id: 'saved-id', fileName: 'a.pdf' } });
  });

  it('uploads every file when every check is upload, and does not cancel', async () => {
    const fileA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const fileB = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockImplementation(async (file: File) =>
      checkResult({ documentId: file.name === 'a.pdf' ? 'id-a' : 'id-b', label: 'NEW' })
    );
    const { result } = setup();
    await selectFiles(result, [fileA, fileB]);

    await act(async () => {
      await result.current.runUpload();
    });

    expect(checkDocumentDedup).toHaveBeenCalledTimes(2);
    expect(checkDocumentDedup.mock.calls[0][1]).not.toHaveProperty('documentId');
    expect(uploadDocument).toHaveBeenCalledTimes(2);
    expect(uploadDocument).toHaveBeenNthCalledWith(
      1,
      fileA,
      expect.objectContaining({ documentId: 'id-a', userId: 'user-1', groupId: 'g1' })
    );
    expect(uploadDocument).toHaveBeenNthCalledWith(
      2,
      fileB,
      expect.objectContaining({ documentId: 'id-b' })
    );
    expect(cancelDocumentDedup).not.toHaveBeenCalled();
    expect(result.current.isUploadModalOpen).toBe(false);
    expect(result.current.dedupReview).toBeNull();
    expect(result.current.selectedFiles).toHaveLength(0);
    expect(addJob).toHaveBeenCalledTimes(2);
  });

  it('does not upload a blocked file and cancels it on dismiss', async () => {
    const file = new File(['same'], 'dup.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockResolvedValue(
      checkResult({
        action: 'block',
        documentId: 'id-block',
        label: 'Exact duplicate',
        matched: {
          id: 'existing-1',
          fileName: 'invoice.pdf',
          uploadedAt: '2026-09-01T00:00:00.000Z',
          relation: 'Exact duplicate',
        },
      })
    );
    const { result } = setup();
    await selectFiles(result, [file]);

    await act(async () => {
      await result.current.runUpload();
    });

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(addJob).not.toHaveBeenCalled();
    expect(result.current.isUploadModalOpen).toBe(true);
    expect(result.current.dedupReview).toHaveLength(1);
    expect(result.current.dedupReview?.[0].action).toBe('block');
    expect(result.current.selectedFiles).toHaveLength(1);
    expect(cancelDocumentDedup).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.dismissUpload();
    });

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(cancelDocumentDedup).toHaveBeenCalledTimes(1);
    expect(cancelDocumentDedup).toHaveBeenCalledWith({
      documentId: 'id-block',
      groupId: 'g1',
      hitlTaskId: null,
    });
    expect(result.current.isUploadModalOpen).toBe(false);
    expect(result.current.dedupReview).toBeNull();
  });

  it('uploads a choose file when the user picks Upload', async () => {
    const file = new File(['v'], 'v2.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockResolvedValue(
      checkResult({
        action: 'choose',
        documentId: 'id-choose',
        label: 'Version',
        hitlTaskId: 'task-1',
        matched: {
          id: 'existing-2',
          fileName: 'invoice.pdf',
          uploadedAt: '2026-09-01T00:00:00.000Z',
          relation: 'Version',
        },
      })
    );
    const { result } = setup();
    await selectFiles(result, [file]);

    await act(async () => {
      await result.current.runUpload();
    });
    act(() => {
      result.current.setDedupChoice('id-choose', 'upload');
    });
    await act(async () => {
      await result.current.continueDedupUpload();
    });

    expect(uploadDocument).toHaveBeenCalledTimes(1);
    expect(uploadDocument).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ documentId: 'id-choose' })
    );
    expect(cancelDocumentDedup).not.toHaveBeenCalled();
    expect(result.current.isUploadModalOpen).toBe(false);
  });

  it('cancels a choose file when the user picks Skip and does not upload', async () => {
    const file = new File(['v'], 'v2.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockResolvedValue(
      checkResult({
        action: 'choose',
        documentId: 'id-skip',
        label: 'Subset',
        hitlTaskId: 'task-9',
        matched: {
          id: 'existing-3',
          fileName: 'packet.pdf',
          uploadedAt: '2026-09-02T00:00:00.000Z',
          relation: 'Subset',
        },
      })
    );
    const { result } = setup();
    await selectFiles(result, [file]);

    await act(async () => {
      await result.current.runUpload();
    });
    act(() => {
      result.current.setDedupChoice('id-skip', 'skip');
    });
    await act(async () => {
      await result.current.continueDedupUpload();
    });

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(addJob).not.toHaveBeenCalled();
    expect(cancelDocumentDedup).toHaveBeenCalledTimes(1);
    expect(cancelDocumentDedup).toHaveBeenCalledWith({
      documentId: 'id-skip',
      groupId: 'g1',
      hitlTaskId: 'task-9',
    });
  });

  it('cancels every unsaved id when the review is closed', async () => {
    const willUpload = new File(['n'], 'new.pdf', { type: 'application/pdf' });
    const related = new File(['r'], 'related.pdf', { type: 'application/pdf' });
    const blocked = new File(['d'], 'dup.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockImplementation(async (file: File) => {
      if (file.name === 'new.pdf') return checkResult({ documentId: 'id-new', action: 'upload' });
      if (file.name === 'related.pdf') {
        return checkResult({
          documentId: 'id-related',
          action: 'choose',
          label: 'Related, not version',
          hitlTaskId: 'task-r',
          matched: {
            id: 'm',
            fileName: 'old.pdf',
            uploadedAt: '2026-09-01T00:00:00.000Z',
            relation: 'Related, not version',
          },
        });
      }
      return checkResult({
        documentId: 'id-dup',
        action: 'block',
        label: 'Duplicate',
        matched: {
          id: 'm2',
          fileName: 'old-scan.pdf',
          uploadedAt: '2026-08-01T00:00:00.000Z',
          relation: 'Duplicate',
        },
      });
    });
    const { result } = setup();
    await selectFiles(result, [willUpload, related, blocked]);

    await act(async () => {
      await result.current.runUpload();
    });
    expect(uploadDocument).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.dismissUpload();
    });

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(cancelDocumentDedup).toHaveBeenCalledTimes(3);
    const cancelled = cancelDocumentDedup.mock.calls.map((call) => call[0].documentId).sort();
    expect(cancelled).toEqual(['id-dup', 'id-new', 'id-related']);
    expect(cancelDocumentDedup).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 'id-related', hitlTaskId: 'task-r' })
    );
  });

  it('cancels unsaved ids if the page unmounts during review', async () => {
    const file = new File(['v'], 'v2.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockResolvedValue(
      checkResult({
        action: 'choose',
        documentId: 'id-unmount',
        matched: {
          id: 'm',
          fileName: 'old.pdf',
          uploadedAt: '2026-09-01T00:00:00.000Z',
          relation: 'Version',
        },
      })
    );
    const { result, unmount } = setup();
    await selectFiles(result, [file]);
    await act(async () => {
      await result.current.runUpload();
    });

    unmount();

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(cancelDocumentDedup).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 'id-unmount' })
    );
  });

  it('uploads when every check failed open and does not show a review step', async () => {
    const file = new File(['x'], 'ok.pdf', { type: 'application/pdf' });
    checkDocumentDedup.mockResolvedValue(
      checkResult({
        action: 'upload',
        documentId: 'id-failed-check',
        label: 'NEW',
        checkFailed: true,
      })
    );
    const { result } = setup();
    await selectFiles(result, [file]);

    await act(async () => {
      await result.current.runUpload();
    });

    expect(result.current.dedupReview).toBeNull();
    expect(result.current.isUploadModalOpen).toBe(false);
    expect(uploadDocument).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ documentId: 'id-failed-check' })
    );
    expect(cancelDocumentDedup).not.toHaveBeenCalled();
  });
});
