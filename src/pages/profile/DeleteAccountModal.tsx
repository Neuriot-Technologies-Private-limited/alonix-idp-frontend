import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { isDeleteConfirmationValid } from '../../services/privacyApi';

export interface DeleteAccountModalProps {
  isOpen: boolean;
  accountEmail: string;
  busy: boolean;
  errorText: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  accountEmail,
  busy,
  errorText,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('profile');
  const [typedEmail, setTypedEmail] = useState('');

  useEffect(() => {
    if (isOpen) setTypedEmail('');
  }, [isOpen]);

  const canConfirm = isDeleteConfirmationValid(typedEmail, accountEmail) && !busy;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      title={t('privacy.delete.modalTitle')}
      icon={<AlertTriangle className="h-5 w-5" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold leading-relaxed text-destructive">
          {t('privacy.delete.modalWarning')}
        </p>

        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
            {t('privacy.delete.confirmLabel', { email: accountEmail })}
          </label>
          <input
            type="email"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder={accountEmail || t('privacy.delete.confirmPlaceholder')}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-destructive/20 transition focus:border-destructive/40 focus:ring-2"
          />
        </div>

        {errorText ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {errorText}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-border/20 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition hover:bg-muted/20 disabled:opacity-50"
          >
            {t('privacy.delete.cancelButton')}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => void onConfirm()}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-3 text-[11px] font-black uppercase tracking-widest text-destructive-foreground shadow-lg shadow-destructive/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {busy ? t('privacy.delete.deleting') : t('privacy.delete.confirmButton')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
