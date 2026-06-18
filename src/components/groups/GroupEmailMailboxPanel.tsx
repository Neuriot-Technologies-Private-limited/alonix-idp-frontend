import React, { useState } from 'react';
import {
  Mail, Plus, Loader2, CheckCircle2, Clock,
  AlertCircle, Eye, EyeOff, History, Zap, Trash2, KeyRound,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addMailbox,
  deleteMailbox,
  listMailboxesForGroup,
  listOrgConnectors,
  updateMailboxPassword,
  type OrgConnector,
} from '../../services/connectorBrowserApi';
import type { Mailbox } from '../../services/connectorBrowserApi';
import { cn } from '../../utils/cn';
import { useAlert } from '../alert';

interface ConnectorListItem extends Pick<OrgConnector, '_id' | 'name' | 'type' | 'config' | 'status'> {}

interface GroupEmailMailboxPanelProps {
  groupId: string;
  orgId: string;
  /** Whether the current user can manage (add/remove) mailboxes */
  canManage: boolean;
}

type IngestionMode = 'new-only' | 'historic';

export const GroupEmailMailboxPanel: React.FC<GroupEmailMailboxPanelProps> = ({
  groupId,
  orgId,
  canManage,
}) => {
  const queryClient = useQueryClient();
  const { alert: appAlert, confirm: appConfirm } = useAlert();

  const [showForm, setShowForm] = useState(false);
  const [selectedConnectorId, setSelectedConnectorId] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>('new-only');
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [rotatePassword, setRotatePassword] = useState('');
  const [showRotatePassword, setShowRotatePassword] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: emailConnectors = [], isLoading: loadingConnectors } = useQuery<ConnectorListItem[]>({
    queryKey: ['connectors', orgId],
    queryFn: async () => {
      const rows = await listOrgConnectors(orgId || undefined);
      return rows.filter((c) => c.type === 'EMAIL' && c.status !== 'PAUSED');
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const { data: groupMailboxes = [], isLoading: loadingMailboxes } = useQuery<Mailbox[]>({
    queryKey: ['group-mailbox', orgId, groupId],
    queryFn: () => listMailboxesForGroup(groupId),
    enabled: !!orgId && !!groupId,
    staleTime: 30_000,
  });

  const groupMailbox = groupMailboxes[0] ?? null;

  // ── Add mailbox mutation ─────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: () =>
      addMailbox(selectedConnectorId, {
        groupId,
        emailAddress: emailAddress.trim(),
        password,
        ingestHistoric: ingestionMode === 'historic',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['group-mailbox', orgId, groupId] });
      void queryClient.invalidateQueries({ queryKey: ['all-mailboxes', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['connector-mailboxes', selectedConnectorId] });
      setShowForm(false);
      setEmailAddress('');
      setPassword('');
      setSelectedConnectorId('');
      setIngestionMode('new-only');
      void appAlert({
        variant: 'success',
        title: 'Mailbox connected',
        description: 'Your group email mailbox is now active and will start ingesting attachments.',
      });
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      void appAlert({
        variant: 'danger',
        title: 'Could not add mailbox',
        description:
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          'Failed to add mailbox. Please check your credentials and try again.',
      });
    },
  });

  const rotatePasswordMutation = useMutation({
    mutationFn: async ({ mailbox, password }: { mailbox: Mailbox; password: string }) =>
      updateMailboxPassword(mailbox.connectorId, mailbox._id, password),
    onSuccess: () => {
      setShowRotateForm(false);
      setRotatePassword('');
      setShowRotatePassword(false);
      void queryClient.invalidateQueries({ queryKey: ['group-mailbox', orgId, groupId] });
      void queryClient.invalidateQueries({ queryKey: ['all-mailboxes', orgId] });
      void appAlert({
        variant: 'success',
        title: 'App password updated',
        description: 'The mailbox will reconnect with the new credentials. Ingestion continues without disconnecting.',
      });
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      void appAlert({
        variant: 'danger',
        title: 'Could not update password',
        description:
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          'Failed to update app password. Check the value and try again.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mailbox: Mailbox) => {
      await deleteMailbox(mailbox.connectorId, mailbox._id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['group-mailbox', orgId, groupId] });
      void queryClient.invalidateQueries({ queryKey: ['all-mailboxes', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['connector-mailboxes'] });
      void appAlert({
        variant: 'success',
        title: 'Mailbox disconnected',
        description: 'This workspace no longer receives email connector ingestions.',
      });
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      void appAlert({
        variant: 'danger',
        title: 'Could not disconnect mailbox',
        description:
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          'Failed to remove mailbox.',
      });
    },
  });

  const isLoading = loadingConnectors || loadingMailboxes;

  const handleDisconnect = async () => {
    if (!groupMailbox) return;
    const ok = await appConfirm({
      title: 'Disconnect email mailbox?',
      description: `Remove ${groupMailbox.emailAddress} from this workspace? Ingestion from this inbox will stop.`,
      variant: 'danger',
      confirmLabel: 'Disconnect',
      cancelLabel: 'Cancel',
    });
    if (ok) deleteMutation.mutate(groupMailbox);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnectorId) {
      void appAlert({ variant: 'warning', title: 'Select a connector', description: 'Choose an email connector first.' });
      return;
    }
    addMutation.mutate();
  };

  const handleRotatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupMailbox || !rotatePassword.trim()) return;
    rotatePasswordMutation.mutate({ mailbox: groupMailbox, password: rotatePassword });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border/25 dark:border-border/40 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 bg-gradient-to-r from-sky-400/10 via-sky-400/5 to-transparent border-b border-border/20 dark:border-border/35 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-sky-400/15 flex items-center justify-center">
            <Mail className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Email Mailbox</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Ingest email attachments into this workspace
            </p>
          </div>
        </div>
        {canManage && !groupMailbox && !showForm && (
          <button
            type="button"
            id="add-group-mailbox-btn"
            onClick={() => setShowForm(true)}
            disabled={emailConnectors.length === 0 && !loadingConnectors}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-400/15 text-sky-400 border border-sky-400/25 text-[10px] font-black uppercase tracking-wider hover:bg-sky-400/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect Mailbox
          </button>
        )}
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : groupMailbox ? (
          <div className="space-y-3">
            {/* ── Existing mailbox display ───────────────────────────── */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-sky-400/5 border border-sky-400/15">
              <div className="h-10 w-10 rounded-xl bg-sky-400/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{groupMailbox.emailAddress}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
                    groupMailbox.status === 'ACTIVE'
                      ? 'bg-success/10 text-success border-success/20'
                      : groupMailbox.status === 'ERROR'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-muted/30 text-muted-foreground border-border/25'
                  )}>
                    {groupMailbox.status === 'ACTIVE'
                      ? <><CheckCircle2 className="w-2.5 h-2.5" />Active</>
                      : groupMailbox.status === 'ERROR'
                        ? <><AlertCircle className="w-2.5 h-2.5" />Error</>
                        : <><Clock className="w-2.5 h-2.5" />{groupMailbox.status ?? 'Pending'}</>}
                  </span>

                  {groupMailbox.ingestHistoric ? (
                    groupMailbox.lastHistoricSyncAt ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Historic synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Backfilling…
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground bg-surface-highest/20 px-1.5 py-0.5 rounded-full border border-border/20">
                      <Zap className="w-2.5 h-2.5" />
                      New emails only
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    id="rotate-mailbox-password-btn"
                    onClick={() => {
                      setShowRotateForm((v) => !v);
                      setRotatePassword('');
                      setShowRotatePassword(false);
                    }}
                    disabled={deleteMutation.isPending || rotatePasswordMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-400/30 text-sky-400 text-[9px] font-black uppercase tracking-wider hover:bg-sky-400/10 transition-colors disabled:opacity-50"
                    title="Update app password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {showRotateForm ? 'Cancel' : 'Update password'}
                  </button>
                  <button
                    type="button"
                    id="disconnect-group-mailbox-btn"
                    onClick={() => void handleDisconnect()}
                    disabled={deleteMutation.isPending || rotatePasswordMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-destructive/25 text-destructive text-[9px] font-black uppercase tracking-wider hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Disconnect mailbox"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {canManage && showRotateForm && (
              <form
                onSubmit={handleRotatePassword}
                className="p-4 rounded-xl border border-sky-400/20 bg-surface-highest/5 space-y-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Rotate app password
                </p>
                <p className="text-xs text-muted-foreground -mt-1">
                  Enter a new app-specific password. The mailbox stays connected — we reconnect IMAP in the background.
                </p>
                <div>
                  <label htmlFor="rotate-mailbox-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block">
                    New app password
                  </label>
                  <div className="relative">
                    <input
                      id="rotate-mailbox-password"
                      required
                      type={showRotatePassword ? 'text' : 'password'}
                      value={rotatePassword}
                      onChange={(e) => setRotatePassword(e.target.value)}
                      placeholder="New app-specific password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-border/20 bg-background px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRotatePassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                      aria-label={showRotatePassword ? 'Hide password' : 'Show password'}
                    >
                      {showRotatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  id="save-rotate-mailbox-password-btn"
                  type="submit"
                  disabled={rotatePasswordMutation.isPending || !rotatePassword.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-400/90 text-white text-xs font-black uppercase tracking-wider hover:bg-sky-400 disabled:opacity-50 transition-all"
                >
                  {rotatePasswordMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</>
                  ) : (
                    <><KeyRound className="w-3.5 h-3.5" /> Save new password</>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : !showForm ? (
          /* ── Empty state ──────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-border/30 bg-surface-highest/5">
            <div className="h-10 w-10 rounded-full bg-sky-400/10 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-sky-400/60" />
            </div>
            <p className="text-sm font-bold text-foreground">No mailbox connected</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              {canManage
                ? emailConnectors.length === 0
                  ? 'Ask your company admin to create an email connector first.'
                  : 'Connect this group\'s email mailbox to ingest attachment documents automatically.'
                : 'Contact your group admin to connect an email mailbox.'}
            </p>
            {canManage && emailConnectors.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-400/15 text-sky-400 border border-sky-400/25 text-[10px] font-black uppercase tracking-wider hover:bg-sky-400/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Connect Mailbox
              </button>
            )}
          </div>
        ) : (
          /* ── Add mailbox form ─────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Connector selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5 block">
                Email Connector
              </label>
              {emailConnectors.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No email connectors available.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {emailConnectors.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      id={`select-connector-${c._id}`}
                      onClick={() => setSelectedConnectorId(c._id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                        selectedConnectorId === c._id
                          ? 'bg-sky-400/10 border-sky-400/30 text-sky-400'
                          : 'border-border/20 bg-surface-highest/5 hover:border-border/40 text-foreground'
                      )}
                    >
                      <div className="h-7 w-7 rounded-lg bg-sky-400/10 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{c.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono truncate">
                          {c.config?.imapHost as string || '—'}
                        </p>
                      </div>
                      {selectedConnectorId === c._id && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Email address */}
            <div>
              <label htmlFor="mailbox-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block">
                Email Address
              </label>
              <input
                id="mailbox-email"
                required
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="inbox@company.com"
                className="w-full rounded-xl border border-border/20 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              />
            </div>

            {/* App password */}
            <div>
              <label htmlFor="mailbox-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block">
                App Password
              </label>
              <div className="relative">
                <input
                  id="mailbox-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="App-specific password (not your regular password)"
                  className="w-full rounded-xl border border-border/20 bg-background px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ingestion scope */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                Ingestion Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="mailbox-ingestion-new-only"
                  onClick={() => setIngestionMode('new-only')}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                    ingestionMode === 'new-only'
                      ? 'border-primary bg-primary/8 ring-1 ring-primary/25'
                      : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-3 w-3 rounded-full border-2 flex items-center justify-center',
                      ingestionMode === 'new-only' ? 'border-primary' : 'border-border/50'
                    )}>
                      {ingestionMode === 'new-only' && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <Zap className={cn('h-3 w-3', ingestionMode === 'new-only' ? 'text-primary' : 'text-muted-foreground')} />
                    <span className={cn('text-[10px] font-bold', ingestionMode === 'new-only' ? 'text-primary' : 'text-foreground')}>
                      New only
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed pl-5">
                    Start from today.
                  </p>
                </button>

                <button
                  type="button"
                  id="mailbox-ingestion-historic"
                  onClick={() => setIngestionMode('historic')}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                    ingestionMode === 'historic'
                      ? 'border-violet bg-violet/8 ring-1 ring-violet/25'
                      : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-3 w-3 rounded-full border-2 flex items-center justify-center',
                      ingestionMode === 'historic' ? 'border-violet' : 'border-border/50'
                    )}>
                      {ingestionMode === 'historic' && <div className="h-1.5 w-1.5 rounded-full bg-violet" />}
                    </div>
                    <History className={cn('h-3 w-3', ingestionMode === 'historic' ? 'text-violet' : 'text-muted-foreground')} />
                    <span className={cn('text-[10px] font-bold', ingestionMode === 'historic' ? 'text-violet' : 'text-foreground')}>
                      + History
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed pl-5">
                    Backfill all prior emails.
                  </p>
                </button>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 rounded-lg bg-sky-400/8 border border-sky-400/15 p-2.5 text-[10px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Credentials are encrypted at rest. Use an app-specific password, not your account password.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEmailAddress('');
                  setPassword('');
                  setSelectedConnectorId('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-border/25 text-xs font-bold hover:bg-surface-highest/10 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-mailbox-btn"
                type="submit"
                disabled={addMutation.isPending || !selectedConnectorId || !emailAddress || !password}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-400/90 text-white text-xs font-black uppercase tracking-wider hover:bg-sky-400 disabled:opacity-50 transition-all"
              >
                {addMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Connect Mailbox</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
