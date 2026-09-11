import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentAssetIdentity } from '../pages/documents/DocumentAssetIdentity';

describe('DocumentAssetIdentity claim chip', () => {
  it('shows a display-only claim chip next to the sensitivity badge', () => {
    render(
      <DocumentAssetIdentity
        fileName="policy.pdf"
        type="pdf"
        size="12 KB"
        sensitivityLevel="PUBLIC"
        claimId="CLM-2026-001"
      />
    );
    expect(screen.getByText('CLM-2026-001')).toBeInTheDocument();
    expect(screen.getByLabelText('Claim ID CLM-2026-001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /filter chat by claim/i })).not.toBeInTheDocument();
  });

  it('hides the claim chip when claimId is missing', () => {
    render(
      <DocumentAssetIdentity fileName="notes.pdf" type="pdf" size="4 KB" sensitivityLevel="PUBLIC" />
    );
    expect(screen.queryByLabelText(/Claim ID/i)).not.toBeInTheDocument();
  });
});
