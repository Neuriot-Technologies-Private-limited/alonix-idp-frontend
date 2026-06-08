import React from 'react';
import { Mail, Server, FolderOpen, Network, Box, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ConnectorNameBreakdown, ConnectorTypeBreakdown } from '../../utils/connectorDocumentSource';
import { connectorTypeLabel } from '../../utils/connectorDocumentSource';

type ConnectorIngestBreakdownProps = {
  byType: ConnectorTypeBreakdown[];
  byConnector: ConnectorNameBreakdown[];
  activeConnectorType?: string | null;
  activeConnectorId?: string | null;
  onSelectConnectorType?: (connectorType: string | null) => void;
  onSelectConnector?: (connectorId: string | null) => void;
  className?: string;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  EMAIL: Mail,
  SFTP: Server,
  SHAREPOINT: FolderOpen,
  BOX: Box,
  API: Plug,
};

function typeIcon(type: string): LucideIcon {
  return TYPE_ICONS[String(type).toUpperCase()] || Network;
}

export const ConnectorIngestBreakdown: React.FC<ConnectorIngestBreakdownProps> = ({
  byType,
  byConnector,
  activeConnectorType = null,
  activeConnectorId = null,
  onSelectConnectorType,
  onSelectConnector,
  className,
}) => {
  if (!byType.length) return null;

  return (
    <section
      className={cn(
        'rounded-2xl border border-border/30 bg-surface-highest/25 px-4 py-3 sm:px-5 sm:py-4 space-y-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-full sm:w-auto sm:mr-2">
          Connector sources
        </p>
        <button
          type="button"
          onClick={() => onSelectConnectorType?.(null)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors',
            activeConnectorType == null && activeConnectorId == null
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/25 bg-background/40 text-foreground hover:border-primary/25'
          )}
        >
          All types
        </button>
        {byType.map((row) => {
          const Icon = typeIcon(row.type);
          const active = activeConnectorType === row.type;
          return (
            <button
              key={row.type}
              type="button"
              onClick={() => onSelectConnectorType?.(row.type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/25 bg-background/40 text-foreground hover:border-primary/25'
              )}
            >
              <Icon className="h-3.5 w-3.5 text-primary/80" aria-hidden="true" />
              <span>{row.label}</span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-black',
                  active ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
                )}
              >
                {row.count}
              </span>
            </button>
          );
        })}
      </div>

      {byConnector.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/20 pt-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-full sm:w-auto sm:mr-2">
            By connector
          </p>
          <button
            type="button"
            onClick={() => onSelectConnector?.(null)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors',
              activeConnectorId == null
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/25 bg-background/40 text-foreground hover:border-primary/25'
            )}
          >
            All connectors
          </button>
          {byConnector.map((row) => {
            const Icon = typeIcon(row.type);
            const active = activeConnectorId === row.connectorId;
            return (
              <button
                key={row.connectorId}
                type="button"
                onClick={() => onSelectConnector?.(row.connectorId)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors max-w-full',
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/25 bg-background/40 text-foreground hover:border-primary/25'
                )}
                title={`${row.name} (${connectorTypeLabel(row.type)})`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden="true" />
                <span className="truncate">{row.name}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[9px] font-black shrink-0',
                    active ? 'bg-primary/15 text-primary' : 'bg-surface-highest/50 text-muted-foreground'
                  )}
                >
                  {row.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
