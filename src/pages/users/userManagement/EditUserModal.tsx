import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { User } from '../../../services/userService';

export interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setErr('');
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErr('Name is required');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onSave(trimmed);
      onClose();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(ax.response?.data?.message || ax.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !busy && onClose()} title="Edit profile" maxWidth="max-w-md">
      {user ? (
        <div className="space-y-4">
          <p className="break-all text-[11px] text-muted-foreground/75">{user.email}</p>
          <div>
            <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border/50 bg-surface-low px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-shadow focus:border-border focus:ring-2 focus:ring-primary/30 dark:border-border/55 dark:bg-surface-low/80"
              disabled={busy}
            />
          </div>
          {err ? <p className="text-[11px] text-destructive font-medium">{err}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-border/45 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:bg-surface-high/40 dark:border-border/50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground hover:opacity-90"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
