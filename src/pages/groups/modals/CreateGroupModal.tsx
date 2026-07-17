import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { adminService, type GroupHealth } from '../../../services/adminService';
import { useAuthStore } from '../../../stores/authStore';
import {
  PII_HANDLING_POLICIES,
  DEFAULT_PII_HANDLING_POLICY,
  type PiiHandlingPolicy,
} from '../../../constants/piiHandlingPolicy';
import { cn } from '../../../utils/cn';

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
  const [piiPolicy, setPiiPolicy] = React.useState<PiiHandlingPolicy>(DEFAULT_PII_HANDLING_POLICY);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setPiiPolicy(DEFAULT_PII_HANDLING_POLICY);
      setError('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: ({ n, policy }: { n: string; policy: PiiHandlingPolicy }) =>
      adminService.createGroup(n, policy),
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
    if (!piiPolicy) {
      setError('Select a PII handling policy.');
      return;
    }
    setError('');
    try {
      const res = await mutation.mutateAsync({ n: trimmed, policy: piiPolicy });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['group-health', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stats', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-state', orgId] });
      const { syncAuthContext, setActiveGroup } = useAuthStore.getState();
      await syncAuthContext();
      const newGroupId = String(res.group?.id || '').trim();
      if (newGroupId) setActiveGroup(newGroupId);
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
      maxWidth="max-w-lg"
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
      <div className="space-y-5">
        {/* Group name */}
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
        </div>

        {/* PII handling policy */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary/60" />
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              PII handling policy
            </label>
          </div>

          <div className="space-y-2">
            {PII_HANDLING_POLICIES.map((option) => {
              const isSelected = piiPolicy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPiiPolicy(option.value);
                    if (error) setError('');
                  }}
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-left transition-all',
                    isSelected
                      ? 'border-primary/40 bg-primary/8 ring-1 ring-primary/20'
                      : 'border-border/15 bg-surface-highest/5 hover:border-border/30 hover:bg-surface-highest/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/25'
                      )}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className={cn(
                        'text-[12px] font-bold leading-tight',
                        isSelected ? 'text-foreground' : 'text-foreground/80'
                      )}>
                        {option.label}
                      </p>
                      <p className="text-[10px] leading-relaxed text-muted-foreground/50">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
            <p className="text-[10px] font-medium leading-relaxed text-warning/80">
              This policy cannot be changed after creation.
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-[11px] font-semibold text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
};
