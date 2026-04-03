import React from 'react';
import { UserPlus, Mail, Users, ChevronDown, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUsers, userService, type User } from '../../services/userService';
import { useGroupHealth } from '../../services/adminService';
import { InviteUsersToGroupModal } from '../groups/modals/InviteUsersToGroupModal';
import { Loader } from '../../components/ui/Loader';
import { cn } from '../../utils/cn';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { useRbac } from '../../hooks/useRbac';
import { useAuthStore } from '../../stores/authStore';
import { useAlert } from '../../components/alert';
import { StatusBadge, RoleBadge } from './userManagement/UserManagementBadges';
import { UserRowActions } from './userManagement/UserRowActions';
import { EditUserModal } from './userManagement/EditUserModal';
import { pickManagedGroupId } from './userManagement/pickManagedGroupId';

export const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { confirm, alert: appAlert } = useAlert();
  const { data: users, isLoading } = useUsers();
  const { data: groupHealthList = [] } = useGroupHealth();
  const { orgRole, hasAnyGroupAdmin, adminGroupIds } = useRbac();
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const activeGroupId = useAuthStore((s) => s.context?.activeGroupId);
  const adminIdSet = React.useMemo(
    () => (!isCompanyAdmin && adminGroupIds?.length ? new Set(adminGroupIds.map(String)) : null),
    [isCompanyAdmin, adminGroupIds]
  );

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteFixedGroupId, setInviteFixedGroupId] = React.useState<string | undefined>();
  const [inviteFixedGroupName, setInviteFixedGroupName] = React.useState<string | undefined>();
  const [editUser, setEditUser] = React.useState<User | null>(null);
  const [search, setSearch] = React.useState('');
  const [groupFilter, setGroupFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const openInviteHeader = () => {
    setInviteFixedGroupId(undefined);
    setInviteFixedGroupName(undefined);
    setInviteOpen(true);
  };

  const baseUsers = React.useMemo(() => {
    if (!users) return [];
    if (isCompanyAdmin) return users;
    if (!hasAnyGroupAdmin || !adminIdSet) return [];
    // Backend already scopes directory for group admins; keep client guard for legacy APIs.
    return users.filter(
      (u: User) =>
        adminIdSet.has(String(u.groupID)) ||
        Boolean(u.workspaces?.some((w) => w.groupId && adminIdSet.has(String(w.groupId))))
    );
  }, [users, isCompanyAdmin, hasAnyGroupAdmin, adminIdSet]);

  const groups = React.useMemo(() => {
    if (!baseUsers.length) return ['All'];
    return ['All', ...Array.from(new Set(baseUsers.map((u: User) => u.group)))];
  }, [baseUsers]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, statusFilter]);

  const statuses = ['All', 'Active', 'Inactive', 'Pending'];

  const filtered = React.useMemo(() => {
    if (!baseUsers.length) return [];
    return baseUsers.filter((u: User) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      const matchGroup = groupFilter === 'All' || u.group === groupFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchSearch && matchGroup && matchStatus;
    });
  }, [baseUsers, search, groupFilter, statusFilter]);

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalUsers = baseUsers.length;
  const activeCount = baseUsers.filter((u: User) => u.status === 'Active').length;
  const pendingCount = baseUsers.filter((u: User) => u.status === 'Pending').length;
  const hasFilters = search || groupFilter !== 'All' || statusFilter !== 'All';

  const inviteGroups = React.useMemo(() => {
    if (isCompanyAdmin) return groupHealthList;
    if (!adminGroupIds?.length) return [];
    const set = new Set(adminGroupIds.map(String));
    return groupHealthList.filter((h) => set.has(String(h.id)));
  }, [isCompanyAdmin, groupHealthList, adminGroupIds]);

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ['directory-users'] });

  const patchUserCtx = React.useCallback(
    (u: User) =>
      isCompanyAdmin
        ? undefined
        : { groupId: pickManagedGroupId(u, activeGroupId, adminGroupIds) || undefined },
    [isCompanyAdmin, activeGroupId, adminGroupIds]
  );

  const handleEditSave = async (name: string) => {
    if (!editUser) return;
    await userService.patchOrgUser(editUser._id, { name }, patchUserCtx(editUser));
    await invalidateUsers();
  };

  const handleSuspend = async (u: User) => {
    const ok = await confirm({
      title: 'Suspend user',
      description: `Suspend ${u.email}? They will not be able to sign in until re-activated.`,
      confirmLabel: 'Suspend',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await userService.patchOrgUser(u._id, { status: 'INACTIVE' }, patchUserCtx(u));
      await invalidateUsers();
      await appAlert({ title: 'User suspended', description: u.email, variant: 'success' });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      await appAlert({
        title: 'Could not suspend',
        description: ax.response?.data?.message || ax.message || 'Request failed',
        variant: 'danger',
      });
    }
  };

  const handleActivate = async (u: User) => {
    try {
      await userService.patchOrgUser(u._id, { status: 'ACTIVE' }, patchUserCtx(u));
      await invalidateUsers();
      await appAlert({ title: 'User activated', description: u.email, variant: 'success' });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      await appAlert({
        title: 'Could not activate',
        description: ax.response?.data?.message || ax.message || 'Request failed',
        variant: 'danger',
      });
    }
  };

  const handleRemoveOrgUser = async (u: User) => {
    const ok = await confirm({
      title: 'Remove user',
      description: `Permanently remove ${u.email} from this organization? This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await userService.deleteOrgUser(u._id);
      await invalidateUsers();
      await appAlert({ title: 'User removed', description: u.email, variant: 'success' });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      await appAlert({
        title: 'Could not remove',
        description: ax.response?.data?.message || ax.message || 'Request failed',
        variant: 'danger',
      });
    }
  };

  const handleAddToGroup = (u: User) => {
    const gid = pickManagedGroupId(u, activeGroupId, adminGroupIds);
    const g = inviteGroups.find((h) => String(h.id) === String(gid));
    setInviteFixedGroupId(gid || undefined);
    setInviteFixedGroupName(g?.name);
    setInviteOpen(true);
  };

  const handleRemoveFromGroup = async (u: User) => {
    const gid = pickManagedGroupId(u, activeGroupId, adminGroupIds);
    if (!gid) {
      await appAlert({
        title: 'No workspace',
        description: 'Could not determine which group to remove this user from.',
        variant: 'danger',
      });
      return;
    }
    const gname = u.workspaces?.find((w) => String(w.groupId) === String(gid))?.groupName || gid;
    const ok = await confirm({
      title: 'Remove from group',
      description: `Remove ${u.email} from ${gname}?`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await userService.removeUserFromGroup(gid, u.email);
      await invalidateUsers();
      await appAlert({ title: 'Removed from group', description: u.email, variant: 'success' });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      await appAlert({
        title: 'Could not remove',
        description: ax.response?.data?.message || ax.message || 'Request failed',
        variant: 'danger',
      });
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:space-y-6">
      <section className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start md:items-center">
        <div className="min-w-0 space-y-1">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text font-display text-xl font-black tracking-tight text-transparent sm:text-2xl">
            {isCompanyAdmin ? 'Users' : 'Group Members'}
          </h1>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground sm:text-[12px]">
            {isCompanyAdmin
              ? 'Manage access, roles, and group assignments for all members.'
              : 'Manage membership for workspaces where you are a group administrator.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openInviteHeader}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border/10 bg-primary px-5 py-3 font-bold text-[11px] uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 active:scale-95 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          {isCompanyAdmin ? 'Invite User' : 'Add To Group'}
        </button>
      </section>

      <InviteUsersToGroupModal
        isOpen={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteFixedGroupId(undefined);
          setInviteFixedGroupName(undefined);
        }}
        groups={inviteGroups}
        users={users ?? []}
        fixedGroupId={inviteFixedGroupId}
        fixedGroupName={inviteFixedGroupName}
      />

      <EditUserModal
        user={editUser}
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        onSave={handleEditSave}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Total Users', value: totalUsers, sub: 'All members', color: 'text-primary' },
          { label: 'Active', value: activeCount, sub: 'Online / verified', color: 'text-success' },
          { label: 'Pending', value: pendingCount, sub: 'Awaiting onboard', color: 'text-warning' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-border/5 bg-surface-highest/5 p-3.5 sm:p-4"
          >
            <div className="min-w-0">
              <p className={cn('text-xl font-black sm:text-2xl', s.color)}>{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{s.label}</p>
              <p className="mt-0.5 text-[8px] text-muted-foreground/20">{s.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or role..."
          showClear
          inputClassName="focus:ring-primary/20"
        />
        <div className="relative shrink-0">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="appearance-none rounded-xl border border-border/10 bg-surface-highest/5 py-3 pl-9 pr-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {g === 'All' ? 'All Groups' : g}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/30" />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-xl border border-border/10 bg-surface-highest/5 p-1 md:max-w-none md:flex-initial md:shrink-0">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground/40 hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setGroupFilter('All');
              setStatusFilter('All');
            }}
            className="flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 transition-colors hover:text-destructive"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/5 bg-surface-highest/5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/5 px-4 py-3 sm:px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
            {filtered.length} User{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ` matching filters` : ''}
          </p>
        </div>
        <div className="-mx-px overflow-x-auto overscroll-x-contain sm:mx-0">
          <table className="w-full min-w-[640px] border-collapse text-left sm:min-w-0">
            <thead>
              <tr className="border-b border-border/5 bg-muted/5">
                {['User', 'Role', 'Group', 'Status', 'Last Active', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 sm:px-6',
                      h === 'Actions' && 'text-right'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <Loader variant="section" label="Loading users" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                      No users found
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground/20">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: User) => (
                  <tr key={user._id} className="group/row transition-all hover:bg-surface-highest/5">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/10 bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-black text-primary">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-foreground transition-colors group-hover/row:text-primary">
                            {user.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground/30">
                            <Mail className="h-3 w-3 shrink-0" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="max-w-[min(14rem,40vw)] px-4 py-4 sm:px-6">
                      <span
                        title={user.group}
                        className="inline-block max-w-full truncate rounded-lg border border-border/10 bg-surface-highest/5 px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80"
                      >
                        {user.group}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <span className="text-[10px] font-bold text-muted-foreground/30">{user.lastActive}</span>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <UserRowActions
                        user={user}
                        canManageCompany={isCompanyAdmin}
                        onEdit={setEditUser}
                        onSuspend={handleSuspend}
                        onActivate={handleActivate}
                        onRemove={handleRemoveOrgUser}
                        onAddToGroup={handleAddToGroup}
                        onRemoveFromGroup={handleRemoveFromGroup}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </section>
    </div>
  );
};
