import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Activity,
  Settings,
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Shield,
  TrendingUp,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useGroupDetail, useGroupHealth } from '../../services/adminService';
import { useUsers } from '../../services/userService';
import apiClient from '../../services/api/client';
import { HealthBadge } from '../../components/ui/GroupCard';
import { Loader } from '../../components/ui/Loader';
import { useAlert } from '../../components/alert';
import { InviteUsersToGroupModal } from './modals/InviteUsersToGroupModal';
import { useRbac } from '../../hooks/useRbac';

function getNameInitials(name?: string) {
  const clean = String(name ?? '').trim();
  if (!clean) return '—';
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || '—';
}

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orgRole, accessibleGroupIds, isGroupAdminFor } = useRbac();
  const isCompanyAdmin = orgRole === 'COMPANY_ADMIN';
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents' | 'activity' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const { alert: appAlert } = useAlert();

  const { data: group, isLoading } = useGroupDetail(id || '');
  const { data: groups = [] } = useGroupHealth();
  const { data: allUsers = [] } = useUsers();
  const queryClient = useQueryClient();

  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      if (!id) return;
      await apiClient.post(`/admin/groups/${encodeURIComponent(id)}/invites/${encodeURIComponent(inviteId)}/resend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-detail', id] });
      void appAlert({
        title: 'Invite resent',
        description: 'A fresh invitation link has been sent to the user email.',
        variant: 'success',
      });
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string } } };
      void appAlert({
        title: 'Resend failed',
        description: ax.response?.data?.message || 'Could not resend invite',
        variant: 'danger',
      });
    },
  });

  /** Must run every render — do not place after conditional returns (Rules of Hooks). */
  useEffect(() => {
    if (!group) return;
    const cm = isCompanyAdmin || isGroupAdminFor(String(group.id));
    if (!cm && activeTab === 'settings') setActiveTab('overview');
  }, [group, activeTab, isCompanyAdmin, isGroupAdminFor]);

  if (isLoading) return <Loader variant="section" label="Loading cluster" />;

  if (!group) return <div className="p-6 text-muted-foreground">Group not found</div>;

  const inDirectory =
    id &&
    (isCompanyAdmin ||
      accessibleGroupIds.map(String).includes(String(id)));
  if (!inDirectory) return <Navigate to="/forbidden" replace />;

  const canManage = isCompanyAdmin || isGroupAdminFor(String(group.id));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'History', icon: Activity },
    ...(canManage ? [{ id: 'settings' as const, label: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="w-full min-w-0 space-y-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:space-y-6 sm:pb-12">
      {/* Hero Header Section - Compact */}
      <div className="relative group/hero overflow-hidden rounded-2xl border border-border/40 bg-muted/5 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-black/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 group-hover/hero:bg-primary/10 transition-all duration-1000" />

        <div className="relative space-y-4">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to Groups
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight font-display leading-none mb-1.5">
                    {group.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <HealthBadge status={group.status} label={group.statusLabel} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 border-l border-border/10 pl-2 ml-1">
                      ID: {group.id.toString().slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground/60 max-w-2xl leading-relaxed text-sm font-medium">
                {group.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-highest/5 border border-border/5 hover:bg-surface-highest/10 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Settings className="w-3.5 h-3.5" />
                Management
              </button> */}
              {canManage ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/10 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border border-border/10 rounded-xl px-4 py-2">
                  View access
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs - Compact Sticky */}
      <div className="sticky top-2 z-30 flex items-center gap-1 p-1 bg-background/60 backdrop-blur-3xl rounded-xl border border-border/20 w-fit mx-auto shadow-xl shadow-black/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                : 'text-muted-foreground/50 hover:bg-muted/30 hover:text-foreground'}
            `}
          >
            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-primary-foreground' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-1">
        {/* Main Intelligence View */}
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Stats Overview Cards */}
              <div className="bg-muted/5 border border-border/20 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-info/10 text-info"><FileText className="w-4 h-4" /></div>
                  <span className="text-[9px] font-black text-success bg-success/10 px-1.5 py-0.5 rounded-full">+12%</span>
                </div>
                <div>
                  <p className="text-2xl font-black">{group.docs}</p>
                  <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Assets</p>
                </div>
              </div>
              <div className="bg-muted/5 border border-border/20 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning"><Users className="w-4 h-4" /></div>
                  <span className="text-[9px] font-black text-success bg-success/10 px-1.5 py-0.5 rounded-full">Active</span>
                </div>
                <div>
                  {/* Count only approved/joined members; invites are shown in the table below */}
                  <p className="text-2xl font-black">
                    {group.members.filter((m) => m.membershipState === 'joined').length}
                  </p>
                  <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Members</p>
                </div>
              </div>
              <div className="bg-muted/5 border border-border/20 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-violet/10 text-violet"><Shield className="w-4 h-4" /></div>
                  <span className="text-[9px] font-black text-violet bg-violet/10 px-1.5 py-0.5 rounded-full">Secure</span>
                </div>
                <div>
                  <p className="text-2xl font-black">{group.confidenceScore}</p>
                  <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Confidence</p>
                </div>
              </div>

              {/* Quick Chart Simulation */}
              <div className="md:col-span-2 lg:col-span-3 bg-muted/5 border border-border/20 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">Ingest Pulse</h3>
                  </div>
                </div>
                <div className="h-[100px] w-full flex items-end gap-1 px-1">
                  {[40, 60, 35, 75, 45, 90, 55, 65, 30, 85, 95, 45, 60, 70, 50, 80, 40, 60, 30, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-muted/5 backdrop-blur-xl rounded-xl border border-border/30 overflow-hidden shadow-lg">
              <div className="p-5 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black">Authorized Members</h3>
                  <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider">Access Rights & Verification</p>
                </div>
                <div className="relative group min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background/40 rounded-lg border border-border/5 focus:border-primary/30 outline-none transition-all text-[11px] font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/5 bg-muted/5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/30">
                      <th className="px-6 py-3.5 font-black">Identity</th>
                      <th className="px-6 py-3.5 font-black">Role</th>
                      <th className="px-6 py-3.5 font-black">Email</th>
                      <th className="px-6 py-3.5 font-black">Status</th>
                      <th className="px-6 py-3.5 font-black text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {group.members
                      .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((member) => (
                        <tr key={member.id} className="group hover:bg-primary/[0.01] transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-highest/10 border border-border/5 overflow-hidden flex items-center justify-center font-black group-hover:scale-105 transition-transform text-[10px]">
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  getNameInitials(member.name)
                                )}
                              </div>
                              <div>
                                <span className="block font-black text-sm leading-tight">{member.name}</span>
                                <span className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                                  {member.membershipState === 'invited'
                                    ? 'Invited'
                                    : member.membershipState === 'expired'
                                      ? 'Invite Expired'
                                      : 'Active'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-surface-highest/5 border border-border/5 w-fit">
                              <Shield className={`w-2.5 h-2.5 ${member.role === 'Group Admin' ? 'text-primary' : 'text-muted-foreground/20'}`} />
                              <span className="text-[9px] font-black uppercase tracking-widest">{member.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-[10px] font-medium text-muted-foreground/50">{member.email}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${
                                member.membershipState === 'expired'
                                  ? 'bg-warning/10 text-warning border-warning/30'
                                  : member.membershipState === 'invited'
                                    ? 'bg-info/10 text-info border-info/30'
                                    : 'bg-success/10 text-success border-success/30'
                              }`}
                            >
                              {member.membershipState === 'expired'
                                ? 'Expired'
                                : member.membershipState === 'invited'
                                  ? 'Invited'
                                  : 'Joined'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {canManage ? (
                            member.membershipState === 'expired' && member.inviteId && isCompanyAdmin ? (
                              <button
                                type="button"
                                onClick={() => resendInviteMutation.mutate(member.inviteId as string)}
                                disabled={resendInviteMutation.isPending}
                                className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/30 text-[9px] font-black uppercase tracking-widest hover:bg-warning/20 transition-all disabled:opacity-60"
                              >
                                Resend Invite
                              </button>
                            ) : (
                              <button type="button" className="p-2 rounded-lg hover:bg-surface-highest/10 text-muted-foreground/30 transition-all">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )
                            ) : (
                              <span className="text-[9px] font-bold text-muted-foreground/25 uppercase tracking-widest">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-muted/5 backdrop-blur-xl rounded-xl border border-border/30 overflow-hidden">
              <div className="p-6 border-b border-border/5 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black">Group Assets</h3>
                  <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider">Internal Mapping</p>
                </div>
                {canManage ? (
                <button type="button" className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Plus className="w-4 h-4" />
                </button>
                ) : null}
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl bg-muted/10 border border-border/5 hover:border-primary/20 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-background/50 text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs leading-tight mb-1">{doc.name}</p>
                        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground/30 font-black uppercase tracking-widest">
                          <span>{doc.size}</span>
                          <span className="w-1 h-1 rounded-full bg-border/20" />
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${doc.status === 'Healthy' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {doc.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <>
              <div
                className={
                  isCompanyAdmin
                    ? 'grid grid-cols-1 gap-6 lg:grid-cols-3'
                    : 'flex flex-col gap-6'
                }
              >
                <div
                  className={
                    isCompanyAdmin
                      ? 'lg:col-span-2 bg-muted/5 border border-border/30 rounded-xl p-6 space-y-6'
                      : 'bg-muted/5 border border-border/30 rounded-xl p-6 space-y-6'
                  }
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Identity Name</label>
                      <input
                        type="text"
                        defaultValue={group.name}
                        className="w-full bg-background/50 border border-border/5 rounded-xl p-3 text-base font-black focus:border-primary/50 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Description</label>
                      <textarea
                        rows={3}
                        defaultValue={group.description}
                        className="w-full bg-background/50 border border-border/5 rounded-xl p-3 text-xs font-medium focus:border-primary/40 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border/5 flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded-lg hover:bg-muted text-[10px] font-bold transition-all">Reset</button>
                    <button type="button" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10">Update Manifest</button>
                  </div>
                </div>

                {isCompanyAdmin ? (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <h4 className="text-sm font-black uppercase">Danger Zone</h4>
                    </div>
                    <p className="text-[10px] text-destructive/60 font-medium leading-relaxed">
                      Deactivate or delete this workspace. Only organization administrators can perform these actions.
                    </p>
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-glass flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete / Deactivate Group
                    </button>
                  </div>
                ) : null}
              </div>
              {!isCompanyAdmin && (
                <div className="rounded-xl border border-border/10 bg-muted/5 p-5 text-[10px] font-medium leading-relaxed text-muted-foreground/80">
                  <p className="font-black uppercase tracking-widest text-muted-foreground/45 mb-1.5">Workspace lifecycle</p>
                  <p>
                    Only a company administrator can delete or deactivate this group. Contact your org admin if you need this workspace removed.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div className="bg-muted/5 border border-border/5 rounded-2xl p-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black uppercase tracking-widest italic opacity-60">Intelligence Timeline</h3>
              </div>

              <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/20">
                {group.recentActivity.map((activity, i) => (
                  <div key={i} className="relative pl-10 group/timeline">
                    <div className={`
                        absolute left-0 top-1 w-6 h-6 rounded-md border-2 border-background flex items-center justify-center
                        ${activity.type === 'success' ? 'bg-success text-success-foreground' :
                        activity.type === 'warning' ? 'bg-warning text-warning-foreground' :
                          'bg-primary text-primary-foreground'}
                      `}>
                      {activity.type === 'success' ? <Plus className="w-3 h-3" /> : activity.type === 'warning' ? <AlertCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">{activity.timestamp}</span>
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{activity.user}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground/80 group-hover/timeline:text-primary transition-colors">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {canManage ? (
      <InviteUsersToGroupModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groups={groups}
        users={allUsers}
        fixedGroupId={group.id}
        fixedGroupName={group.name}
      />
      ) : null}
    </div>
  );
};
