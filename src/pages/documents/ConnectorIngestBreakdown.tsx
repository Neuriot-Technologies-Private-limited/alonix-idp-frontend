import React from 'react';
import { Mail, Server, FolderOpen, Network, Plug } from 'lucide-react';
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
  API: Plug,
};

function typeIcon(type: string): LucideIcon {
  return TYPE_ICONS[String(type).toUpperCase()] || Network;
}

const chipClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors shrink-0',
    active
      ? 'border-primary/40 bg-primary/10 text-primary'
      : 'border-border/25 bg-background/40 text-foreground hover:border-primary/25'
  );

const countClass = (active: boolean) =>
  cn(
    'rounded px-1 py-px text-[8px] font-black leading-none',
    active ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
  );

const sectionLabelClass =
  'text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/55 shrink-0 whitespace-nowrap';

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

  const allTypesActive = activeConnectorType == null && activeConnectorId == null;

  return (
    <section
      className={cn(
        'rounded-xl border border-border/30 bg-surface-highest/20 px-3 py-2 sm:px-4',
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0 min-w-0">
        {/* Connector sources */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0 md:flex-1 md:pr-3">
          <p className={sectionLabelClass}>Sources</p>
          <button
            type="button"
            onClick={() => onSelectConnectorType?.(null)}
            className={chipClass(allTypesActive)}
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
                className={chipClass(active)}
              >
                <Icon className="h-3 w-3 text-primary/80" aria-hidden="true" />
                <span>{row.label}</span>
                <span className={countClass(active)}>{row.count}</span>
              </button>
            );
          })}
        </div>

        {byConnector.length > 0 ? (
          <>
            <div
              className="hidden md:block w-px self-stretch min-h-[1.25rem] bg-border/25 shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0 md:flex-1 md:pl-3 md:border-l-0 border-t border-border/20 pt-2 md:pt-0 md:border-t-0">
              <p className={sectionLabelClass}>By connector</p>
              <button
                type="button"
                onClick={() => onSelectConnector?.(null)}
                className={chipClass(activeConnectorId == null)}
              >
                All
              </button>
              {byConnector.map((row) => {
                const Icon = typeIcon(row.type);
                const active = activeConnectorId === row.connectorId;
                return (
                  <button
                    key={row.connectorId}
                    type="button"
                    onClick={() => onSelectConnector?.(row.connectorId)}
                    className={cn(chipClass(active), 'max-w-[12rem]')}
                    title={`${row.name} (${connectorTypeLabel(row.type)})`}
                  >
                    <Icon className="h-3 w-3 shrink-0 text-primary/80" aria-hidden="true" />
                    <span className="truncate">{row.name}</span>
                    <span className={countClass(active)}>{row.count}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};
