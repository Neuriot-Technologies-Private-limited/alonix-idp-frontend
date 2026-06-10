import React, { useState } from 'react';
import {
  Mail, Box, Plus, Trash2, Webhook, Loader2,
  Clock, FolderOpen, CheckCircle2,
  Server, Eye, ToggleLeft, ToggleRight, ChevronDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/client';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import { updateConnector } from '../../services/connectorBrowserApi';
import { quotaErrorMessage } from '../../utils/billingQuota';
import { billingSubscriptionQueryKey, useOrgQuota } from '../../hooks/useOrgQuota';
import { useAlert } from '../alert';

interface Connector {
  _id: string;
  name: string;
  type: 'EMAIL' | 'BOX' | 'API' | 'SHAREPOINT' | 'SFTP';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  ingestHistoric: boolean;
  lastHistoricSyncAt?: string | null;
  config: Record<string, unknown>;
}

type ConnectorType = 'EMAIL' | 'SHAREPOINT' | 'SFTP';

type EmailProvider = 'gmail' | 'outlook' | 'custom';

const EMAIL_PROVIDER_PRESETS: Record<EmailProvider, { label: string; imapHost: string; imapPort: number }> = {
  gmail:   { label: 'Gmail',   imapHost: 'imap.gmail.com',           imapPort: 993 },
  outlook: { label: 'Outlook', imapHost: 'outlook.office365.com',    imapPort: 993 },
  custom:  { label: 'Custom',  imapHost: '',                          imapPort: 993 },
};

export const ConnectorsPanel: React.FC = () => {
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;
  const { atCap, capMessage, blocksUsage } = useOrgQuota();
  const connectorBlocked = blocksUsage || atCap('connectors');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { alert: appAlert } = useAlert();

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<ConnectorType>('EMAIL');
  const [emailProvider, setEmailProvider] = useState<EmailProvider>('gmail');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sftpAuthType, setSftpAuthType] = useState<'password' | 'privateKey'>('password');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openModal = () => {
    if (connectorBlocked) {
      appAlert({
        variant: 'warning',
        title: 'Connector limit reached',
        description: capMessage('connectors'),
      });
      return;
    }
    setNewType('EMAIL');
    setEmailProvider('gmail');
    setIsModalOpen(true);
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: connectors = [], isLoading } = useQuery<Connector[]>({
    queryKey: ['connectors', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<Connector[]>(`/admin/orgs/${orgId}/connectors`);
      return data;
    },
    enabled: !!orgId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.post(`/admin/orgs/${orgId}/connectors`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', orgId] });
      void queryClient.invalidateQueries({ queryKey: billingSubscriptionQueryKey(orgId) });
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      appAlert({
        variant: 'danger',
        title: 'Could not create connector',
        description: quotaErrorMessage(err, 'Connector creation failed.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/orgs/${orgId}/connectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', orgId] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const toggleAutoIngest = async (connector: Connector) => {
    const newVal = connector.config?.autoIngest === false ? true : false;
    setTogglingId(connector._id);
    try {
      await updateConnector(connector._id, { autoIngest: newVal });
      queryClient.invalidateQueries({ queryKey: ['connectors', orgId] });
    } finally {
      setTogglingId(null);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    let config: Record<string, unknown> = {};

    if (newType === 'EMAIL') {
      const preset = EMAIL_PROVIDER_PRESETS[emailProvider];
      const imapHost = String(formData.get('imapHost') || preset.imapHost).trim();
      const imapPortRaw = String(formData.get('imapPort') || String(preset.imapPort)).trim();
      config = {
        provider: emailProvider,
        imapHost,
        ...(imapPortRaw ? { imapPort: parseInt(imapPortRaw, 10) } : {}),
      };
    } else if (newType === 'SHAREPOINT') {
      config = {
        tenantId: formData.get('tenantId'), clientId: formData.get('clientId'),
        clientSecret: formData.get('clientSecret'), siteUrl: formData.get('siteUrl'),
        libraryName: formData.get('libraryName') || undefined,
      };
    } else if (newType === 'SFTP') {
      config = {
        host: formData.get('host'), port: parseInt(formData.get('port') as string || '22', 10),
        username: formData.get('username'), authType: sftpAuthType,
        remotePath: formData.get('remotePath') || '/',
        recursive: true, autoIngest: true,
        ...(sftpAuthType === 'password'
          ? { password: formData.get('password') }
          : { privateKey: formData.get('privateKey') }),
      };
    }

    createMutation.mutate({ name, type: newType, config });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':      return <Mail className="h-5 w-5 text-info" />;
      case 'BOX':        return <Box className="h-5 w-5 text-primary" />;
      case 'SHAREPOINT': return <FolderOpen className="h-5 w-5 text-emerald-500" />;
      case 'SFTP':       return <Server className="h-5 w-5 text-amber-400" />;
      default:           return <Webhook className="h-5 w-5 text-foreground" />;
    }
  };

  const getConnectorSubtitle = (c: Connector) => {
    if (c.type === 'EMAIL') {
      const host = c.config?.imapHost as string;
      const provider = c.config?.provider as string;
      if (host) return host;
      if (provider) return EMAIL_PROVIDER_PRESETS[provider as EmailProvider]?.label ?? provider;
      return 'Email connector';
    }
    if (c.type === 'SHAREPOINT') return c.config?.siteUrl as string;
    if (c.type === 'SFTP')       return `${c.config?.username}@${c.config?.host}:${c.config?.remotePath}`;
    return 'API Mode';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="mb-6 rounded-3xl border border-border/20 dark:border-border/10 bg-surface-lowest dark:bg-surface-highest/5 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-info via-violet to-primary" />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row shadow-sm sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Ingestion Connectors
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Configure dynamic pipelines to ingest documents from Email, SharePoint, SFTP, or Webhooks.
            </p>
          </div>
          <button
            id="add-connector-btn"
            type="button"
            onClick={openModal}
            disabled={connectorBlocked}
            title={connectorBlocked ? capMessage('connectors') : undefined}
            className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/20 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="h-4 w-4" />
            Add Connector
          </button>
        </div>

        {/* Connector list */}
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : connectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-border/40 bg-surface-highest/5 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Webhook className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Connectors Active</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Your pipeline currently relies only on manual web uploads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectors.map((c) => (
              <div
                key={c._id}
                className="group relative flex items-start gap-4 rounded-2xl border border-border/10 bg-surface-highest/10 p-5 transition-all hover:bg-surface-highest/20 hover:border-primary/20"
              >
                <div className="rounded-xl bg-background p-2.5 shadow-sm border border-border/10">
                  {getIcon(c.type)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground truncate">{c.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Type badge */}
                      <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-surface-highest/30 text-muted-foreground">
                        {c.type}
                      </span>
                      {/* Status badge */}
                      <span className={cn(
                        'text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full',
                        c.status === 'ACTIVE'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      )}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {getConnectorSubtitle(c)}
                  </p>

                  {/* SharePoint last sync badge */}
                  {c.type === 'SHAREPOINT' && (
                    <div className="flex items-center gap-2 mt-2">
                      {(c.config?.lastSyncAt) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Last synced {new Date(c.config.lastSyncAt as string).toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5" />
                          Awaiting first poll…
                        </span>
                      )}
                    </div>
                  )}

                  {/* EMAIL: show provider / IMAP host badge */}
                  {c.type === 'EMAIL' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full">
                        <Mail className="h-2.5 w-2.5" />
                        {c.config?.provider
                          ? EMAIL_PROVIDER_PRESETS[c.config.provider as EmailProvider]?.label ?? String(c.config.provider)
                          : 'IMAP'}
                      </span>
                    </div>
                  )}
                  {/* Auto-ingest toggle for SFTP / SharePoint */}
                  {(c.type === 'SFTP' || c.type === 'SHAREPOINT') && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        id={`toggle-autoingest-${c._id}`}
                        onClick={() => toggleAutoIngest(c)}
                        disabled={togglingId === c._id}
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold transition-colors"
                      >
                        {togglingId === c._id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : c.config?.autoIngest === false
                            ? <><ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Auto-ingest off</span></>
                            : <><ToggleRight className="h-3.5 w-3.5 text-success" /><span className="text-success">Auto-ingest on</span></>}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id={`browse-connector-${c._id}`}
                    onClick={() => navigate(`/documents?connectors=1&connectorId=${encodeURIComponent(c._id)}`)}
                    title="Browse files"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    id={`delete-connector-${c._id}`}
                    onClick={() => { setDeletingId(c._id); deleteMutation.mutate(c._id); }}
                    disabled={deletingId === c._id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    {deletingId === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Creation Modal ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border/20 bg-surface-lowest shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black mb-4 flex items-center justify-between">
              Create New Connector
              <button
                id="close-connector-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </h3>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Connector type toggle */}
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Type
                </label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {(['EMAIL', 'SHAREPOINT', 'SFTP'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      id={`connector-type-${t.toLowerCase()}`}
                      onClick={() => setNewType(t)}
                      className={cn(
                        'flex-1 min-w-[80px] py-2 rounded-xl text-sm font-bold border transition-all',
                        newType === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-highest/10 border-border/20 hover:border-border/40'
                      )}
                    >
                      {t === 'SHAREPOINT' ? 'SharePoint' : t === 'SFTP' ? 'SFTP' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block">
                  Display Name
                </label>
                <input
                  required
                  id="connector-name"
                  name="name"
                  className="w-full rounded-xl border border-border/20 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. HR SharePoint Library"
                />
              </div>

              {/* ── EMAIL config ──────────────────────────────────────────── */}
              {newType === 'EMAIL' && (
                <div className="space-y-3 p-4 rounded-xl bg-info/10 border border-info/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-info" />
                    <span className="text-xs font-bold text-info">IMAP SERVER TEMPLATE</span>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    This creates a shared connector template. Group admins attach their own mailbox credentials after creation.
                  </p>

                  {/* Provider preset */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Provider
                    </label>
                    <div className="flex gap-2">
                      {(Object.keys(EMAIL_PROVIDER_PRESETS) as EmailProvider[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          id={`email-provider-${p}`}
                          onClick={() => setEmailProvider(p)}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                            emailProvider === p
                              ? 'bg-info/20 border-info text-info'
                              : 'bg-surface-highest/10 border-border/20 hover:border-border/40'
                          )}
                        >
                          {EMAIL_PROVIDER_PRESETS[p].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IMAP host (required) */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      IMAP Host <span className="normal-case font-normal">(required)</span>
                    </label>
                    <input
                      required
                      id="connector-imap-host"
                      name="imapHost"
                      type="text"
                      key={emailProvider}
                      defaultValue={EMAIL_PROVIDER_PRESETS[emailProvider].imapHost}
                      placeholder="e.g. imap.gmail.com"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  {/* IMAP port */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      IMAP Port
                    </label>
                    <div className="relative">
                      <input
                        id="connector-imap-port"
                        name="imapPort"
                        type="number"
                        min={1}
                        max={65535}
                        key={`port-${emailProvider}`}
                        defaultValue={EMAIL_PROVIDER_PRESETS[emailProvider].imapPort}
                        placeholder="993"
                        className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-info/10 border border-info/20 p-2.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                    <span>
                      Each group admin adds their own mailbox email &amp; password via their group settings.
                      One mailbox per group is supported.
                    </span>
                  </div>
                </div>
              )}

              {/* ── SHAREPOINT config ─────────────────────────────────────── */}
              {newType === 'SHAREPOINT' && (
                <div className="space-y-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      MICROSOFT SHAREPOINT CONFIGURATION
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Azure Tenant ID
                    </label>
                    <input
                      required
                      id="connector-tenant-id"
                      name="tenantId"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      App (Client) ID
                    </label>
                    <input
                      required
                      id="connector-client-id"
                      name="clientId"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Client Secret
                    </label>
                    <input
                      required
                      id="connector-client-secret"
                      name="clientSecret"
                      type="password"
                      placeholder="Client secret value"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      SharePoint Site URL
                    </label>
                    <input
                      required
                      id="connector-site-url"
                      name="siteUrl"
                      type="url"
                      placeholder="https://contoso.sharepoint.com/sites/MySite"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Library / Folder Name <span className="font-normal">(optional)</span>
                    </label>
                    <input
                      id="connector-library-name"
                      name="libraryName"
                      placeholder="Documents (leave blank for root)"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      SharePoint is polled every 15 minutes by default. The client secret is
                      encrypted at rest — never stored in plain text.
                    </span>
                  </div>
                </div>
              )}


              {/* ── SFTP config ─────────────────────────────────────────── */}
              {newType === 'SFTP' && (
                <div className="space-y-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-500">SFTP SERVER CONFIGURATION</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Host</label>
                      <input required id="connector-sftp-host" name="host" placeholder="files.company.com"
                        className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Port</label>
                      <input id="connector-sftp-port" name="port" defaultValue="22" type="number"
                        className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Username</label>
                    <input required id="connector-sftp-username" name="username" placeholder="sftpuser"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Remote Path</label>
                    <input required id="connector-sftp-path" name="remotePath" placeholder="/invoices/inbox"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Authentication</label>
                    <div className="flex gap-2">
                      {(['password', 'privateKey'] as const).map((t) => (
                        <button key={t} type="button" id={`sftp-auth-${t}`}
                          onClick={() => setSftpAuthType(t)}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                            sftpAuthType === t
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-surface-highest/10 border-border/20 hover:border-border/40'
                          )}
                        >
                          {t === 'password' ? '🔑 Password' : '🗝 SSH Key'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {sftpAuthType === 'password' ? (
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Password</label>
                      <input required id="connector-sftp-password" name="password" type="password" placeholder="••••••••"
                        className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">SSH Private Key (PEM)</label>
                      <textarea required id="connector-sftp-privatekey" name="privateKey" rows={5}
                        placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"}
                        className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-xs font-mono resize-none" />
                    </div>
                  )}
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>All credentials are encrypted at rest. Files are never deleted from your server after ingestion.</span>
                  </div>
                </div>
              )}

              <button

                id="save-connector-btn"
                type="submit"
                disabled={createMutation.isPending}
                className="w-full mt-4 flex justify-center py-3 rounded-xl bg-foreground text-background font-black uppercase tracking-wider text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Connection'}
              </button>

              {createMutation.isError && (
                <p className="text-xs text-destructive text-center mt-1">
                  Failed to save connector. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
