import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2, Mail, Search } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { userService, type User } from '../../../services/userService';
import type { GroupHealth } from '../../../services/adminService';
import { cn } from '../../../utils/cn';

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
  const groupLocked = Boolean(fixedGroupId);
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = React.useState('');
  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [listQuery, setListQuery] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setGroupId(fixedGroupId ?? '');
      setInviteName('');
      setInviteEmail('');
      setSelectedIds(new Set());
      setListQuery('');
      setError('');
    }
  }, [isOpen, fixedGroupId]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [groupId]);

  const mutation = useMutation({
    mutationFn: userService.inviteUsersToGroup,
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  const toggleUser = (id: string) => {
    const u = users.find((x) => x._id === id);
    if (groupId && u && u.groupID === groupId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (error) setError('');
  };

  const submit = async () => {
    if (!groupId) {
      setError('Select a group.');
      return;
    }
    const hasNew = inviteName.trim() || inviteEmail.trim();
    const nu = hasNew ? { name: inviteName, email: inviteEmail } : null;

    setError('');
    try {
      const res = await mutation.mutateAsync({
        groupId,
        existingUserIds: Array.from(selectedIds),
        newUser: nu,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['group-health'] });
      await queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    } catch {
      setError('Something went wrong. Try again.');
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
    return directoryUsers.filter((u) => u.groupID !== groupId).length;
  }, [directoryUsers, groupId]);

  const lockedGroupLabel =
    fixedGroupName ||
    groups.find((g) => g.id === fixedGroupId)?.name ||
    fixedGroupId ||
    '';

  return (
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
                Saving…
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>
      }
    >
      <div className="max-h-[min(70vh,540px)] space-y-5 overflow-y-auto pr-1 custom-scrollbar">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            Target group
          </span>
          {groupLocked ? (
            <div className="rounded-2xl border border-border/10 bg-surface-highest/5 px-4 py-3.5 text-[13px] font-semibold text-foreground">
              {lockedGroupLabel}
            </div>
          ) : (
            <div className="relative">
              <select
                id="invite-target-group"
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  if (error) setError('');
                }}
                className="w-full appearance-none rounded-2xl border border-border/10 bg-surface-highest/5 py-3.5 pl-4 pr-10 text-[13px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Choose a group…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-lowest">
                    {g.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-[10px]">
                ▼
              </span>
            </div>
          )}
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
                placeholder="Jordan Lee"
                className="w-full rounded-xl border border-border/10 bg-surface-highest/5 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15"
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
                placeholder="jordan@company.com"
                className="w-full rounded-xl border border-border/10 bg-surface-highest/5 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/35">
            If you fill this section, both name and email are required. Creates a pending search user in the selected group.
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
              disabled={!groupId}
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
                  const inThisGroup = Boolean(groupId && u.groupID === groupId);
                  const checked = selectedIds.has(u._id);
                  return (
                    <li key={u._id}>
                      <button
                        type="button"
                        disabled={inThisGroup}
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
  );
};
