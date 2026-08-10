import React from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { UserPlus, Loader2, Mail, Search, CheckCircle2, Shield, UserRound } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { ThemedSelect } from '../../../components/ui/ThemedSelect';
import { userService, type User } from '../../../services/userService';
import { adminService, type GroupHealth } from '../../../services/adminService';
import { cn } from '../../../utils/cn';
import {
  DOCUMENT_SENSITIVITY_HINTS,
  DOCUMENT_SENSITIVITY_LABELS,
  uploadAssignableLevelsForGroup,
  type DocumentSensitivityLevel,
} from '../../../constants/documentSensitivity';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { billingSubscriptionQueryKey, useOrgQuota } from '../../../hooks/useOrgQuota';

export interface InviteUsersToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: GroupHealth[];
  users: User[];
  /** When set (e.g. group detail page), preselects this group and hides the group picker. */
  fixedGroupId?: string;
  /** Display label if the group is not in `groups` yet. */
  fixedGroupName?: string;
}

const INVITE_ROLE_OPTIONS = [
  {
    value: 'SEARCH_USER',
    label: 'Search user (default)',
    description: 'Standard member access for this group.',
  },
  {
    value: 'GROUP_ADMIN',
    label: 'Group admin',
    description: 'Can manage members and group settings.',
  },
] as const;

/**
 * Company-admin flow: pick a group, optionally invite by email, multi-select existing users to assign.
 */
export const InviteUsersToGroupModal: React.FC<InviteUsersToGroupModalProps> = ({
  isOpen,
  onClose,
  groups,
  users,
  fixedGroupId,
  fixedGroupName,
}) => {
  const isAlreadyInGroup = React.useCallback((u: User, gid: string) => {
    if (!gid) return false;
    if (u.groupID && String(u.groupID) === String(gid)) return true;
    return Boolean((u.workspaces || []).some((w) => String(w.groupId) === String(gid)));
  }, []);

  const groupLocked = Boolean(fixedGroupId);
  const { atCap, capMessage, blocksUsage } = useOrgQuota();
  const queryClient = useQueryClient();
  const context = useAuthStore((s) => s.context);
  const authGroups = useAuthStore((s) => s.context?.groups ?? []);
  const [groupId, setGroupId] = React.useState('');
  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [listQuery, setListQuery] = React.useState('');
  const [memberMaxSensitivity, setMemberMaxSensitivity] =
    React.useState<DocumentSensitivityLevel>('INTERNAL_USE');
  const [inviteRole, setInviteRole] = React.useState<'GROUP_ADMIN' | 'SEARCH_USER'>('SEARCH_USER');
  const [error, setError] = React.useState('');
  /** Stays true from click until close so Invite cannot be double-fired after the loader ends. */
  const [busy, setBusy] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const submitLockRef = React.useRef(false);
  const toastTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setGroupId(fixedGroupId ?? '');
      setInviteName('');
      setInviteEmail('');
      setSelectedIds(new Set());
      setListQuery('');
      setMemberMaxSensitivity('INTERNAL_USE');
      setInviteRole('SEARCH_USER');
      setError('');
      setBusy(false);
      submitLockRef.current = false;
    }
  }, [isOpen, fixedGroupId]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [groupId]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const { data: groupEnabledLevels = null } = useQuery({
    queryKey: ['invite-group-policy', groupId],
    enabled: isOpen && Boolean(groupId),
    queryFn: () => adminService.getGroupSensitivityPolicy(groupId),
    staleTime: 60_000,
  });

  const inviterMaxKey = React.useMemo(() => {
    if (context?.orgRole === 'COMPANY_ADMIN') return 'RESTRICTED';
    const g = authGroups.find((x) => String(x.groupId) === String(groupId));
    if (!g) return 'INTERNAL_USE';
    if (g.role === 'GROUP_ADMIN') return 'RESTRICTED';
    return String(g.maxDocumentSensitivity || 'INTERNAL_USE')
      .toUpperCase()
      .replace(/-/g, '_');
  }, [context?.orgRole, authGroups, groupId]);

  const memberSensitivityOptions = React.useMemo(() => {
    const allowed = uploadAssignableLevelsForGroup(inviterMaxKey, groupEnabledLevels);
    return allowed.map((value) => ({
      value,
      label: DOCUMENT_SENSITIVITY_LABELS[value],
      description: DOCUMENT_SENSITIVITY_HINTS[value],
    }));
  }, [inviterMaxKey, groupEnabledLevels]);

  const groupOptions = React.useMemo(
    () => groups.map((g) => ({ value: g.id, label: g.name })),
    [groups]
  );

  React.useEffect(() => {
    if (inviteRole === 'GROUP_ADMIN') {
      setMemberMaxSensitivity('RESTRICTED');
      return;
    }
    const allowed = uploadAssignableLevelsForGroup(inviterMaxKey, groupEnabledLevels);
    setMemberMaxSensitivity((prev) =>
      allowed.includes(prev) ? prev : allowed[allowed.length - 1] || 'INTERNAL_USE'
    );
  }, [inviterMaxKey, groupEnabledLevels, inviteRole]);

  const mutation = useMutation({
    mutationFn: userService.inviteUsersToGroup,
  });

  const isLocked = busy || mutation.isPending;

  const showSuccessToast = React.useCallback((message: string) => {
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    setSuccessToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setSuccessToast(null);
      toastTimerRef.current = null;
    }, 4200);
  }, []);

  const refreshAfterInvite = React.useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['directory-users'] }),
      queryClient.invalidateQueries({ queryKey: ['group-health'] }),
      queryClient.invalidateQueries({ queryKey: ['group-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      queryClient.invalidateQueries({
        queryKey: billingSubscriptionQueryKey(context?.orgId),
      }),
    ]);
  }, [queryClient, context?.orgId]);

  const handleClose = () => {
    if (isLocked) return;
    onClose();
  };

  const toggleUser = (id: string) => {
    if (isLocked) return;
    const u = users.find((x) => x._id === id);
    if (groupId && u && isAlreadyInGroup(u, groupId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (error) setError('');
  };

  const submit = async () => {
    if (submitLockRef.current || isLocked) return;
    if (!groupId) {
      setError('Select a group.');
      return;
    }
    const hasName = inviteName.trim().length > 0;
    const hasEmail = inviteEmail.trim().length > 0;
    if (hasName !== hasEmail) {
      setError('For a new invite, both name and email are required.');
      return;
    }
    const hasNew = hasName && hasEmail;
    const nu = hasNew ? { name: inviteName, email: inviteEmail } : null;

    submitLockRef.current = true;
    setBusy(true);
    setError('');
    try {
      const res = await mutation.mutateAsync({
        groupId,
        existingUserIds: Array.from(selectedIds),
        newUser: nu,
        role: inviteRole,
        maxDocumentSensitivity: memberMaxSensitivity,
      });
      if (!res.ok) {
        submitLockRef.current = false;
        setBusy(false);
        setError(res.error);
        return;
      }

      const parts: string[] = [];
      if (res.invitedNew) parts.push('Invite email sent');
      if (res.addedExisting > 0) {
        parts.push(
          res.addedExisting === 1
            ? '1 member added'
            : `${res.addedExisting} members added`
        );
      }
      const successMsg =
        parts.length > 0 ? `${parts.join(' · ')}. You’re all set.` : 'Invite sent successfully.';

      // Close immediately; refresh in the background so the button never reappears unlocked.
      showSuccessToast(successMsg);
      refreshAfterInvite();
      onClose();
    } catch (err: unknown) {
      submitLockRef.current = false;
      setBusy(false);
      setError(quotaErrorMessage(err, 'Something went wrong. Try again.'));
    }
  };

  /** Full org directory for the chosen group; search only narrows the list (includes people already in this group). */
  const directoryUsers = React.useMemo(() => {
    if (!groupId) return [];
    const q = listQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, groupId, listQuery]);

  const selectableCount = React.useMemo(() => {
    if (!groupId) return 0;
    return directoryUsers.filter((u) => !isAlreadyInGroup(u, groupId)).length;
  }, [directoryUsers, groupId, isAlreadyInGroup]);

  const lockedGroupLabel =
    fixedGroupName ||
    groups.find((g) => g.id === fixedGroupId)?.name ||
    fixedGroupId ||
    '';

  const pendingNewInvite =
    inviteName.trim().length > 0 && inviteEmail.trim().length > 0;
  const additionalUsers = pendingNewInvite ? 1 : 0;
  const userQuotaBlocked = blocksUsage || atCap('users', { additional: additionalUsers });

  const successToastNode =
    successToast && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-6 right-6 z-[10050] max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-success/30 bg-surface-lowest/95 px-4 py-3.5 shadow-2xl shadow-black/25 ring-1 ring-success/20 backdrop-blur-md dark:bg-surface-low/95">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-success">
                  Invite sent
                </p>
                <p className="text-[13px] font-medium leading-snug text-foreground">{successToast}</p>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {successToastNode}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Invite & assign users"
        subtitle={groupLocked ? `Adding to · ${lockedGroupLabel}` : 'Add people to a workspace'}
        icon={<UserPlus className="h-6 w-6 text-primary" />}
        maxWidth="max-w-lg"
        footer={
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLocked}
              className="flex-1 rounded-2xl border border-border/10 py-3.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-surface-highest/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isLocked || userQuotaBlocked}
              aria-busy={isLocked}
              title={userQuotaBlocked ? capMessage('users') : undefined}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isLocked ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inviting…
                </>
              ) : (
                'Invite'
              )}
            </button>
          </div>
        }
      >
        <div
          className={cn(
            'max-h-[min(70vh,540px)] space-y-5 overflow-y-auto pr-1 custom-scrollbar',
            isLocked && 'pointer-events-none opacity-70'
          )}
        >
          {userQuotaBlocked ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              {capMessage('users')}
            </p>
          ) : null}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Target group
            </span>
            {groupLocked ? (
              <div className="rounded-2xl border border-border/45 bg-surface-highest/5 px-4 py-3.5 text-[13px] font-semibold text-foreground dark:border-border/50">
                {lockedGroupLabel}
              </div>
            ) : (
              <ThemedSelect
                id="invite-target-group"
                value={groupId}
                onChange={(v) => {
                  setGroupId(v);
                  if (error) setError('');
                }}
                options={groupOptions}
                placeholder="Choose a group…"
                disabled={isLocked}
                aria-label="Target group"
                triggerClassName="min-h-[3rem] rounded-2xl border-border/45 bg-surface-highest/5 px-4 py-3.5 text-[13px] dark:border-border/50"
              />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Invite role
            </span>
            <ThemedSelect
              id="invite-role"
              value={inviteRole}
              onChange={(v) => setInviteRole(v as 'GROUP_ADMIN' | 'SEARCH_USER')}
              options={[...INVITE_ROLE_OPTIONS]}
              disabled={isLocked}
              aria-label="Invite role"
              leftIcon={
                inviteRole === 'GROUP_ADMIN' ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <UserRound className="h-4 w-4" />
                )
              }
              triggerClassName="min-h-[3rem] rounded-2xl border-border/45 bg-surface-highest/5 px-3 py-2.5 text-[13px] dark:border-border/50"
            />
            <p className="text-[10px] text-muted-foreground/35 leading-relaxed">
              Company admin is an organization-level role and is managed from organization user settings.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Document access for new members
            </span>
            <ThemedSelect
              value={memberMaxSensitivity}
              onChange={(v) => setMemberMaxSensitivity(v as DocumentSensitivityLevel)}
              options={memberSensitivityOptions}
              disabled={
                isLocked ||
                !groupId ||
                memberSensitivityOptions.length === 0 ||
                inviteRole === 'GROUP_ADMIN'
              }
              aria-label="Maximum document sensitivity for added members"
              triggerClassName="min-h-[3rem] rounded-2xl border-border/45 bg-surface-highest/5 dark:border-border/50"
            />
            <p className="text-[10px] text-muted-foreground/35 leading-relaxed">
              {inviteRole === 'GROUP_ADMIN'
                ? 'Group admins always get RESTRICTED document access.'
                : 'Members can view and upload documents at this level and below (less sensitive tiers).'}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/10 bg-surface-highest/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">New invite (optional)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="invite-name" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  autoComplete="name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  disabled={isLocked}
                  placeholder="Jordan Lee"
                  className="w-full rounded-xl border border-border/10 bg-surface-highest/5 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isLocked}
                  placeholder="jordan@company.com"
                  className="w-full rounded-xl border border-border/10 bg-surface-highest/5 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/35">
              If you fill this section, both name and email are required. Creates a pending invite in the selected group with the chosen role.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Add from directory
              </p>
              <p className="text-[10px] text-muted-foreground/35 leading-relaxed">
                {groupId
                  ? `${directoryUsers.length} user${directoryUsers.length !== 1 ? 's' : ''} listed · ${selectableCount} can be moved into this group (current members are read-only).`
                  : 'Pick a workspace to load the full directory.'}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
              <input
                type="text"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                disabled={!groupId || isLocked}
                placeholder={groupId ? 'Filter by name, email, or ID…' : 'Select a group first'}
                className="w-full rounded-xl border border-border/10 bg-surface-highest/5 py-2.5 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-40"
              />
            </div>
            <div className="max-h-[220px] overflow-y-auto rounded-xl border border-border/10">
              {directoryUsers.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-muted-foreground/45">
                  {!groupId
                    ? 'Choose a group to load the directory.'
                    : users.length === 0
                      ? 'No users in the directory yet.'
                      : 'No users match your search.'}
                </p>
              ) : (
                <ul className="divide-y divide-border/10">
                  {directoryUsers.map((u) => {
                    const inThisGroup = Boolean(groupId && isAlreadyInGroup(u, groupId));
                    const checked = selectedIds.has(u._id);
                    return (
                      <li key={u._id}>
                        <button
                          type="button"
                          disabled={inThisGroup || isLocked}
                          onClick={() => toggleUser(u._id)}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                            inThisGroup
                              ? 'cursor-not-allowed opacity-60'
                              : 'hover:bg-surface-highest/5',
                            checked && 'bg-primary/[0.06]'
                          )}
                        >
                          <input
                            readOnly
                            type="checkbox"
                            checked={inThisGroup ? false : checked}
                            disabled={inThisGroup}
                            className={cn(
                              'h-3.5 w-3.5 rounded border-border/20 bg-surface-highest/40 accent-primary',
                              inThisGroup && 'opacity-40'
                            )}
                            tabIndex={-1}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-bold text-foreground">{u.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground/40">{u.email}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">
                              {inThisGroup
                                ? 'Already in this group'
                                : `Workspace: ${u.group}`}
                            </p>
                          </div>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            {inThisGroup ? (
                              <span className="text-[8px] font-black uppercase tracking-widest text-success/90">
                                Member
                              </span>
                            ) : null}
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/35">
                              {u.role.replace(/_/g, ' ')}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {error ? (
            <p className="text-[11px] font-semibold text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
};
