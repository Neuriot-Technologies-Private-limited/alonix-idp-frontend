import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimIdCombobox } from '../pages/chat/components/ClaimIdCombobox';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ClaimIdCombobox', () => {
  it('opens, filters by typing, and selects a claim id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ClaimIdCombobox
        claimIds={['CLM-100', 'CLM-200', 'POL-9']}
        value={null}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'claimIdPlaceholder' }));
    await user.type(screen.getByLabelText('claimIdFilterPlaceholder'), '200');
    expect(screen.getByRole('option', { name: /CLM-200/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /CLM-100/ })).toBeNull();

    await user.click(screen.getByRole('option', { name: /CLM-200/ }));
    expect(onChange).toHaveBeenCalledWith('CLM-200');
  });

  it('clears the selection back to null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ClaimIdCombobox claimIds={['CLM-100']} value="CLM-100" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'claimIdClear' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('lets the user pick All claims to send null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ClaimIdCombobox claimIds={['CLM-100']} value="CLM-100" onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'claimIdPlaceholder' }));
    await user.click(screen.getByRole('option', { name: 'claimIdAll' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
