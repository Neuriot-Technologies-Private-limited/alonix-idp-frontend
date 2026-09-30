import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { DocumentUploadModal } from '../pages/documents/DocumentUploadModal';
import type { DedupReviewItem } from '../pages/documents/hooks/upload/useDocumentUpload';

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

describe('DocumentUploadModal claim id', () => {
  const file = new File(['pdf'], 'claim.pdf', { type: 'application/pdf' });

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
        selectedFiles={[file]}
        setSelectedFiles={() => {}}
        uploadSensitivityLevel="INTERNAL_USE"
        onUploadSensitivityChange={() => {}}
        uploadSensitivityOptions={[{ value: 'INTERNAL_USE', label: 'Internal', hint: 'hint' }]}
        onUpload={onUpload}
        attachClaimId={false}
        onAttachClaimIdChange={() => {}}
        claimId=""
        onClaimIdChange={() => {}}
        {...overrides}
      />
    );
    return { onUpload };
  }

  it('hides the claim id input until the checkbox is checked', () => {
    renderModal();
    expect(screen.queryByLabelText('upload.claimIdLabel')).toBeNull();
  });

  it('shows the claim id input when associated', () => {
    renderModal({ attachClaimId: true, claimId: 'CLM-1' });
    expect(screen.getByLabelText('upload.claimIdLabel')).toHaveValue('CLM-1');
  });

  it('disables upload when claim association is on without a value', () => {
    renderModal({ attachClaimId: true, claimId: '  ' });
    expect(screen.getByRole('button', { name: /upload.uploadWithCount/i })).toBeDisabled();
  });

  it('toggles association via the checkbox', async () => {
    const user = userEvent.setup();
    const onAttachClaimIdChange = vi.fn();
    renderModal({ onAttachClaimIdChange });
    await user.click(screen.getByLabelText('upload.claimIdCheckbox'));
    expect(onAttachClaimIdChange).toHaveBeenCalledWith(true);
  });
});

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
    ...overrides,
  };
}

describe('DocumentUploadModal dedup review', () => {
  it('shows block copy and a date, with no upload choice for that file', () => {
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
        onUpload={() => {}}
        attachClaimId={false}
        onAttachClaimIdChange={() => {}}
        claimId=""
        onClaimIdChange={() => {}}
        dedupReview={[
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
        ]}
      />
    );

    expect(screen.getByText('dup.pdf')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.exact/)).toBeInTheDocument();
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('upload.dedup.uploadedOn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'upload.dedup.uploadChoice' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'upload.dedup.skipChoice' })).toBeNull();
    expect(screen.getByRole('button', { name: 'upload.dedup.continueButton' })).toBeInTheDocument();
  });

  it('offers Upload and Skip for a related file and lists also-related lines', async () => {
    const user = userEvent.setup();
    const onDedupChoice = vi.fn();
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
        onUpload={() => {}}
        attachClaimId={false}
        onAttachClaimIdChange={() => {}}
        claimId=""
        onClaimIdChange={() => {}}
        onDedupChoice={onDedupChoice}
        dedupReview={[
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
        ]}
      />
    );

    expect(screen.getByText('upload.dedup.willUpload')).toBeInTheDocument();
    expect(screen.getByText('upload.dedup.checkFailed')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.version/)).toBeInTheDocument();
    expect(screen.getByText('policy.pdf')).toBeInTheDocument();
    expect(screen.getByText(/upload\.dedup\.alsoVersion/)).toBeInTheDocument();
    expect(screen.getByText('policy-v1.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'upload.dedup.skipChoice' }));
    expect(onDedupChoice).toHaveBeenCalledWith('id-choose', 'skip');
  });
});
