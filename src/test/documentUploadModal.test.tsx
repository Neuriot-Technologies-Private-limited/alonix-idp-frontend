import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { DocumentUploadModal } from '../pages/documents/DocumentUploadModal';
import type { DedupReviewItem } from '../pages/documents/dedupReview';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../components/ui/ThemedSelect', () => ({
  ThemedSelect: ({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

function reviewItem(overrides: Partial<DedupReviewItem> = {}): DedupReviewItem {
  return {
    file: new File(['a'], 'incoming.pdf', { type: 'application/pdf' }),
    documentId: 'id-1',
    action: 'upload',
    hitlTaskId: null,
    matched: null,
    alsoRelated: [],
    checkFailed: false,
    decision: null,
    saved: false,
    uploadStarted: false,
    groupId: 'g1',
    uploadContext: {
      userId: 'user-1',
      groupId: 'g1',
      orgId: 'org-1',
      sensitivity: 'INTERNAL_USE',
      claimId: '',
      groupName: 'Sales',
      uploaderLabel: 'Ada',
    },
    ...overrides,
  };
}

describe('DocumentUploadModal dedup review', () => {
  function renderModal(overrides: Partial<ComponentProps<typeof DocumentUploadModal>> = {}) {
    const onUpload = vi.fn();
    render(
      <DocumentUploadModal
        isOpen
        onClose={() => {}}
        orgWideUpload={false}
        groups={[]}
        targetGroupId="g1"
        setTargetGroupId={() => {}}
        selectedFiles={[]}
        setSelectedFiles={() => {}}
        uploadSensitivityLevel="INTERNAL_USE"
        onUploadSensitivityChange={() => {}}
        uploadSensitivityOptions={[{ value: 'INTERNAL_USE', label: 'Internal', hint: 'hint' }]}
        onUpload={onUpload}
        {...overrides}
      />
    );
    return { onUpload };
  }

  it('shows block copy and a date, with no upload choice for that file', () => {
    renderModal({
      dedupReview: [
        reviewItem({
          action: 'block',
          file: new File(['a'], 'dup.pdf', { type: 'application/pdf' }),
          matched: {
            id: 'existing',
            fileName: 'invoice.pdf',
            uploadedAt: '2026-09-01T00:00:00.000Z',
            relation: 'Exact duplicate',
          },
        }),
      ],
    });

    expect(screen.getByText('dup.pdf')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.exact/)).toBeInTheDocument();
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('upload.dedup.uploadedOn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'upload.dedup.uploadChoice' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'upload.dedup.skipChoice' })).toBeNull();
    const continueBtn = screen.getByRole('button', { name: 'upload.dedup.continueButton' });
    expect(continueBtn).toBeInTheDocument();
    expect(continueBtn).not.toBeDisabled();
  });

  it('offers Upload and Skip for a related file and lists also-related lines', async () => {
    const user = userEvent.setup();
    const onDedupChoice = vi.fn();
    renderModal({
      onDedupChoice,
      dedupReview: [
        reviewItem({
          action: 'upload',
          checkFailed: false,
          documentId: 'id-plain',
          file: new File(['n'], 'fresh.pdf', { type: 'application/pdf' }),
        }),
        reviewItem({
          action: 'upload',
          checkFailed: true,
          documentId: 'id-down',
          file: new File(['n'], 'unchecked.pdf', { type: 'application/pdf' }),
        }),
        reviewItem({
          action: 'choose',
          documentId: 'id-choose',
          file: new File(['v'], 'edit.pdf', { type: 'application/pdf' }),
          matched: {
            id: 'm1',
            fileName: 'policy.pdf',
            uploadedAt: '2026-09-01T00:00:00.000Z',
            relation: 'Version',
          },
          alsoRelated: [
            {
              id: 'm2',
              fileName: 'policy-v1.pdf',
              uploadedAt: '2026-08-01T00:00:00.000Z',
              relation: 'Version',
            },
          ],
        }),
      ],
    });

    expect(screen.getByText('upload.dedup.willUpload')).toBeInTheDocument();
    expect(screen.getByText('upload.dedup.checkFailed')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.version/)).toBeInTheDocument();
    expect(screen.getByText('policy.pdf')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.alsoVersion/)).toBeInTheDocument();
    expect(screen.getByText('policy-v1.pdf')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'upload.dedup.continueButton' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'upload.dedup.skipChoice' }));
    expect(onDedupChoice).toHaveBeenCalledWith('id-choose', 'skip');
  });
});
