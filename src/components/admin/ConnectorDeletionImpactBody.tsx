import React from 'react';
import { AlertTriangle, FileStack, Mail, Network } from 'lucide-react';
import type { ConnectorDeletionImpact } from '../../services/connectorBrowserApi';
import { cn } from '../../utils/cn';

type ConnectorDeletionImpactBodyProps = {
  impact: ConnectorDeletionImpact;
  onOpenDocuments?: () => void;
};

export const ConnectorDeletionImpactBody: React.FC<ConnectorDeletionImpactBodyProps> = ({
  impact,
  onOpenDocuments,
}) => {
  const hasMailboxes = impact.mailboxCount > 0;
  const hasDocuments = impact.documentCount > 0;

  return (
    <div className="space-y-4 text-left">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{impact.connectorName}</span> is still linked to
        active workspaces or ingested files. Remove those dependencies before deleting the connector template.
      </p>

      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-surface-highest/10 to-transparent p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
              Cleanup required
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Org-level connector templates cannot be removed while group mailboxes or connector documents
              still reference them.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div
            className={cn(
              'rounded-xl border px-3 py-2.5',
              hasMailboxes ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/30 bg-surface-highest/10'
            )}
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Group mailboxes
            </div>
            <p className="mt-1 text-lg font-black text-foreground">{impact.mailboxCount}</p>
          </div>
          <div
            className={cn(
              'rounded-xl border px-3 py-2.5',
              hasDocuments ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/30 bg-surface-highest/10'
            )}
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <FileStack className="h-3.5 w-3.5" />
              Ingested documents
            </div>
            <p className="mt-1 text-lg font-black text-foreground">{impact.documentCount}</p>
          </div>
        </div>
      </div>

      {hasMailboxes ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Connected workspaces
          </p>
          <ul className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {impact.mailboxes.map((mailbox) => (
              <li
                key={mailbox.mailboxId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/25 bg-surface-highest/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{mailbox.groupName}</p>
                  <p className="truncate text-xs text-muted-foreground">{mailbox.emailAddress}</p>
                </div>
                <span className="shrink-0 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-info">
                  {mailbox.status || 'ACTIVE'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Disconnect each mailbox from its workspace settings before removing this connector.
          </p>
        </div>
      ) : null}

      {hasDocuments ? (
        <div className="rounded-xl border border-border/25 bg-surface-highest/10 px-3 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {impact.documentCount} document{impact.documentCount === 1 ? '' : 's'} in the vault were ingested
            through this connector. Delete them from Documents → Connectors before removing the template.
          </p>
          {onOpenDocuments ? (
            <button
              type="button"
              onClick={onOpenDocuments}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1.5 text-[11px] font-bold text-violet transition hover:bg-violet/15"
            >
              <Network className="h-3.5 w-3.5" />
              Open connector documents
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
