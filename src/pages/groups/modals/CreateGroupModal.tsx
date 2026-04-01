import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { adminService, type GroupHealth } from '../../../services/adminService';
import { useAuthStore } from '../../../stores/authStore';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fired after the group is created and queries are invalidated; modal is closed by caller or after navigation. */
  onCreated?: (group: GroupHealth) => void;
}

/**
 * Reusable modal: create a workspace group with a unique name (POST /api/admin/orgs/:orgId/groups).
 */
export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreated }) => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.context?.orgId ?? s.user?.orgId);
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (n: string) => adminService.createGroup(n),
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a group name.');
      return;
    }
    setError('');
    try {
      const res = await mutation.mutateAsync(trimmed);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['group-health', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stats', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-state', orgId] });
      onCreated?.(res.group as GroupHealth);
      onClose();
    } catch {
      setError('Something went wrong. Try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create group"
      subtitle="Name must be unique in your organization"
      icon={<FolderPlus className="h-6 w-6 text-primary" />}
      maxWidth="max-w-md"
      footer={
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="flex-1 rounded-2xl border border-border/10 py-3.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-surface-highest/10 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create group'
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        <label htmlFor="create-group-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          Group name
        </label>
        <input
          id="create-group-name"
          type="text"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="e.g. Product — Q3 Discovery"
          maxLength={120}
          className="w-full rounded-2xl border border-border/10 bg-surface-highest/5 px-4 py-3.5 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-[10px] text-muted-foreground/40">
          {name.trim().length}/120 · compared case-insensitively for duplicates
        </p>
        {error ? (
          <p className="text-[11px] font-semibold text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
};
