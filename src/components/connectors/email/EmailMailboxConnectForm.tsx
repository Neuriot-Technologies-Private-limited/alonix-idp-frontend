import React, { useState } from 'react';
import {
  Mail, Loader2, CheckCircle2, Eye, EyeOff, History, Zap,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMailbox } from '../../../services/connectorBrowserApi';
import type { Mailbox } from '../../../services/connectorBrowserApi';
import { cn } from '../../../utils/cn';
import { useAlert } from '../../alert';

type IngestionMode = 'new-only' | 'historic';

export interface EmailMailboxConnectFormProps {
  orgId: string;
  groupId: string;
  groupName?: string;
  connectorId: string;
  connectorName: string;
  onSuccess: (mailbox: Mailbox) => void;
  onCancel?: () => void;
  /** e.g. "Connect & start sync" in ingest modal */
  submitLabel?: string;
  idPrefix?: string;
}

const EmailMailboxConnectForm: React.FC<EmailMailboxConnectFormProps> = ({
  orgId,
  groupId,
  groupName,
  connectorId,
  connectorName,
  onSuccess,
  onCancel,
  submitLabel = 'Connect & start sync',
  idPrefix = 'connector-mailbox',
}) => {
  const queryClient = useQueryClient();
  const { alert: appAlert } = useAlert();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>('new-only');

  const addMutation = useMutation({
    mutationFn: () =>
      addMailbox(connectorId, {
        groupId,
        emailAddress: emailAddress.trim(),
        password,
        ingestHistoric: ingestionMode === 'historic',
      }),
    onSuccess: (mailbox) => {
      void queryClient.invalidateQueries({ queryKey: ['group-mailbox', orgId, groupId] });
      void queryClient.invalidateQueries({ queryKey: ['all-mailboxes', orgId] });
      void queryClient.invalidateQueries({ queryKey: ['connector-mailboxes', connectorId] });
      setEmailAddress('');
      setPassword('');
      onSuccess(mailbox);
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      void appAlert({
        variant: 'danger',
        title: 'Could not connect mailbox',
        description:
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          'Check the email and app password, then try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim() || !password.trim()) return;
    addMutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-md mx-auto"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-br from-sky-400/25 via-transparent to-primary/10 opacity-80"
        aria-hidden
      />
      <div className="relative rounded-[27px] border border-sky-400/20 bg-gradient-to-b from-surface-high/90 to-surface-lowest/95 p-5 sm:p-6 shadow-xl shadow-sky-950/10 dark:from-surface-high/60 dark:to-surface-lowest/80">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-sky-400/12 border border-sky-400/25 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400/80">
              Workspace mailbox
            </p>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground mt-0.5">
              Connect email to sync
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {groupName ? (
                <>
                  Link an inbox for <span className="font-semibold text-foreground">{groupName}</span> via{' '}
                  <span className="font-semibold text-foreground">{connectorName}</span>.
                </>
              ) : (
                <>Link this workspace&apos;s inbox via {connectorName}.</>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor={`${idPrefix}-email`}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block"
            >
              Email address
            </label>
            <input
              id={`${idPrefix}-email`}
              required
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="inbox@company.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border/25 bg-background/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>

          <div>
            <label
              htmlFor={`${idPrefix}-password`}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block"
            >
              App password
            </label>
            <div className="relative">
              <input
                id={`${idPrefix}-password`}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="App-specific password (not your login password)"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border/25 bg-background/80 px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
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

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Ingestion scope
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id={`${idPrefix}-ingestion-new-only`}
                onClick={() => setIngestionMode('new-only')}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                  ingestionMode === 'new-only'
                    ? 'border-sky-400/40 bg-sky-400/8 ring-1 ring-sky-400/25'
                    : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                )}
              >
                <div className="flex items-center gap-2">
                  <Zap className={cn('h-3 w-3', ingestionMode === 'new-only' ? 'text-sky-400' : 'text-muted-foreground')} />
                  <span className={cn('text-[10px] font-bold', ingestionMode === 'new-only' ? 'text-sky-400' : 'text-foreground')}>
                    New only
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">From today forward.</p>
              </button>
              <button
                type="button"
                id={`${idPrefix}-ingestion-historic`}
                onClick={() => setIngestionMode('historic')}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                  ingestionMode === 'historic'
                    ? 'border-violet/40 bg-violet/8 ring-1 ring-violet/25'
                    : 'border-border/20 bg-surface-highest/10 hover:border-border/40'
                )}
              >
                <div className="flex items-center gap-2">
                  <History className={cn('h-3 w-3', ingestionMode === 'historic' ? 'text-violet' : 'text-muted-foreground')} />
                  <span className={cn('text-[10px] font-bold', ingestionMode === 'historic' ? 'text-violet' : 'text-foreground')}>
                    + History
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">Backfill prior mail.</p>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-sky-400/8 border border-sky-400/15 p-2.5 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>Credentials are encrypted at rest. One mailbox per workspace.</span>
          </div>

          <div className={cn('flex gap-2 pt-1', !onCancel && 'flex-col')}>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-border/25 text-xs font-bold hover:bg-surface-highest/10 transition-colors"
              >
                Cancel
              </button>
            ) : null}
            <button
              id={`${idPrefix}-submit`}
              type="submit"
              disabled={addMutation.isPending || !emailAddress.trim() || !password.trim()}
              className={cn(
                'flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-400 text-white text-xs font-black uppercase tracking-wider hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg shadow-sky-400/20',
                onCancel ? 'flex-1' : 'w-full'
              )}
            >
              {addMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
              ) : (
                <><Mail className="w-3.5 h-3.5" /> {submitLabel}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmailMailboxConnectForm;
