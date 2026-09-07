import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { DocumentUploadModal } from '../pages/documents/DocumentUploadModal';

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
