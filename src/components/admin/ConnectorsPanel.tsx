import React, { useState } from 'react';
import {
  Mail, Printer, Box, Plus, Trash2, Webhook, Loader2,
  AlertCircle, Clock, History, Zap, CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api/client';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface Connector {
  _id: string;
  name: string;
  type: 'EMAIL' | 'FAX' | 'BOX' | 'API';
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  ingestHistoric: boolean;
  lastHistoricSyncAt?: string | null;
  config: Record<string, unknown>;
}

type IngestionMode = 'new-only' | 'historic';

type ConnectorType = 'EMAIL' | 'FAX' | 'BOX';

export const ConnectorsPanel: React.FC = () => {
  const context = useAuthStore((s) => s.context);
  const orgId = context?.orgId;
  const queryClient = useQueryClient();

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<ConnectorType>('EMAIL');
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>('new-only');

  const openModal = () => {
    setIngestionMode('new-only'); // reset each time
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
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/orgs/${orgId}/connectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', orgId] });
    },
  });

  // ── Form submit ───────────────────────────────────────────────────────────
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    let config: Record<string, unknown> = {};
    if (newType === 'EMAIL') {
      config = {
        emailAddress: formData.get('emailAddress'),
        password: formData.get('password'),
      };
    } else if (newType === 'FAX') {
      config = {
        twilioPhoneNumber: formData.get('twilioPhoneNumber'),
      };
    }

    createMutation.mutate({
      name,
      type: newType,
      config,
      ingestHistoric: ingestionMode === 'historic',
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-5 w-5 text-info" />;
      case 'FAX':   return <Printer className="h-5 w-5 text-violet" />;
      case 'BOX':   return <Box className="h-5 w-5 text-primary" />;
      default:      return <Webhook className="h-5 w-5 text-foreground" />;
    }
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
              Configure dynamic pipelines to ingest documents from Email, Fax, or Webhooks.
            </p>
          </div>
          <button
            id="add-connector-btn"
            onClick={openModal}
            className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/20 hover:scale-[1.02]"
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
                    <span className={cn(
                      'text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full',
                      c.status === 'ACTIVE'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    )}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {c.type === 'EMAIL'
                      ? (c.config?.emailAddress as string)
                      : c.type === 'FAX'
                      ? (c.config?.twilioPhoneNumber as string)
                      : 'API Mode'}
                  </p>
                  {/* Historic ingestion badge */}
                  {c.type === 'EMAIL' && (
                    <div className="flex items-center gap-2 mt-2">
                      {c.ingestHistoric ? (
                        c.lastHistoricSyncAt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Historic synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            Backfilling…
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-surface-highest/20 px-2 py-0.5 rounded-full">
                          <Zap className="h-2.5 w-2.5" />
                          New emails only
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  id={`delete-connector-${c._id}`}
                  onClick={() => deleteMutation.mutate(c._id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Creation Modal ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border/20 bg-surface-lowest shadow-2xl p-6">
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
                <div className="flex gap-2 mt-1">
                  {(['EMAIL', 'FAX'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      id={`connector-type-${t.toLowerCase()}`}
                      onClick={() => setNewType(t)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-bold border transition-all',
                        newType === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-highest/10 border-border/20 hover:border-border/40'
                      )}
                    >
                      {t}
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
                  placeholder="e.g. Support Inbox"
                />
              </div>

              {/* ── EMAIL config ──────────────────────────────────────────── */}
              {newType === 'EMAIL' && (
                <>
                  <div className="space-y-3 p-4 rounded-xl bg-info/10 border border-info/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-info" />
                      <span className="text-xs font-bold text-info">IMAP CONFIGURATION</span>
                    </div>
                    <input
                      required
                      id="connector-email"
                      name="emailAddress"
                      type="email"
                      placeholder="Email Address"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                    />
                    <input
                      required
                      id="connector-password"
                      name="password"
                      type="password"
                      placeholder="App Password"
                      className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* ── Ingestion scope ──────────────────────────────────── */}
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">
                      Email Ingestion Scope
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* New only */}
                      <button
                        type="button"
                        id="ingestion-mode-new-only"
                        onClick={() => setIngestionMode('new-only')}
                        className={cn(
                          'relative flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                          ingestionMode === 'new-only'
                            ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                            : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all',
                            ingestionMode === 'new-only' ? 'border-primary' : 'border-border/50'
                          )}>
                            {ingestionMode === 'new-only' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <Zap className={cn('h-3.5 w-3.5', ingestionMode === 'new-only' ? 'text-primary' : 'text-muted-foreground')} />
                          <span className={cn('text-xs font-bold', ingestionMode === 'new-only' ? 'text-primary' : 'text-foreground')}>
                            New emails only
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
                          Start from today — only ingest emails received after this connector is created.
                        </p>
                      </button>

                      {/* + Historic */}
                      <button
                        type="button"
                        id="ingestion-mode-historic"
                        onClick={() => setIngestionMode('historic')}
                        className={cn(
                          'relative flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                          ingestionMode === 'historic'
                            ? 'border-violet bg-violet/8 ring-1 ring-violet/30'
                            : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-all',
                            ingestionMode === 'historic' ? 'border-violet' : 'border-border/50'
                          )}>
                            {ingestionMode === 'historic' && (
                              <div className="h-1.5 w-1.5 rounded-full bg-violet" />
                            )}
                          </div>
                          <History className={cn('h-3.5 w-3.5', ingestionMode === 'historic' ? 'text-violet' : 'text-muted-foreground')} />
                          <span className={cn('text-xs font-bold', ingestionMode === 'historic' ? 'text-violet' : 'text-foreground')}>
                            + Historical emails
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
                          Also backfill all previous emails from this inbox on first connect.
                        </p>
                      </button>
                    </div>

                    {/* Contextual hint */}
                    {ingestionMode === 'historic' && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-violet/10 border border-violet/20 p-2.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-violet shrink-0 mt-0.5" />
                        <span>
                          A one-time backfill job will run in the background. Large inboxes may take a while.
                          Duplicate detection is built-in — no file will be ingested twice.
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── FAX config ────────────────────────────────────────────── */}
              {newType === 'FAX' && (
                <div className="space-y-3 p-4 rounded-xl bg-violet/10 border border-violet/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Printer className="h-4 w-4 text-violet" />
                    <span className="text-xs font-bold text-violet">TWILIO CONFIGURATION</span>
                  </div>
                  <input
                    required
                    id="connector-twilio-phone"
                    name="twilioPhoneNumber"
                    placeholder="Twilio Webhook Phone Number"
                    className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    <AlertCircle className="inline h-3 w-3 mr-1" />
                    Point your Twilio webhook URL at your server endpoint.
                  </p>
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
