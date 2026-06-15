import React from 'react';
import {
  Upload,
  Files,
  DatabaseZap,
  ScanSearch,
  Tags,
  AlertTriangle,
  Network,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { MetricStateCard, MetricStateGrid } from '../../components/ui/MetricStateCard';
import { SearchToolbarRow } from '../../components/ui/SearchToolbarRow';
import type { DocumentPipelineTab } from './types/documentRow';
import { ConnectorIngestBreakdown } from './ConnectorIngestBreakdown';
import type { ConnectorNameBreakdown, ConnectorTypeBreakdown } from '../../utils/connectorDocumentSource';

type PipelineTab = { id: DocumentPipelineTab; label: string; count: number };

type DocumentsPageHeaderProps = {
  isPureViewOnly: boolean;
  headerSubtitle: string;
  canUploadDocs: boolean;
  canIngestFromConnectors: boolean;
  onOpenUpload: () => void;
  onOpenConnectors: () => void;
  counts: {
    all: number;
    ingested: number;
    extracted: number;
    classified: number;
    failed: number;
    fromConnectors: number;
  };
  search: string;
  onSearchChange: (value: string) => void;
  pipelineTabs: PipelineTab[];
  activeTab: DocumentPipelineTab;
  onTabChange: (tab: DocumentPipelineTab) => void;
  showConnectorBreakdown: boolean;
  connectorBreakdown: {
    byType: ConnectorTypeBreakdown[];
    byConnector: ConnectorNameBreakdown[];
  };
  connectorFilterId: string | null;
  connectorFilterType: string | null;
  onConnectorFilterChange: (connectorId: string | null) => void;
  onConnectorTypeFilterChange: (connectorType: string | null) => void;
  onShowConnectorDocuments: () => void;
  connectorViewAllWorkspaces: boolean;
};

export const DocumentsPageHeader: React.FC<DocumentsPageHeaderProps> = ({
  isPureViewOnly,
  headerSubtitle,
  canUploadDocs,
  canIngestFromConnectors,
  onOpenUpload,
  onOpenConnectors,
  counts,
  search,
  onSearchChange,
  pipelineTabs,
  activeTab,
  onTabChange,
  showConnectorBreakdown,
  connectorBreakdown,
  connectorFilterId,
  connectorFilterType,
  onConnectorFilterChange,
  onConnectorTypeFilterChange,
  onShowConnectorDocuments,
  connectorViewAllWorkspaces,
}) => (
  <>
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="w-full min-w-0 flex-1 basis-0 space-y-2 sm:pr-4">
        <h1 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent flex flex-wrap items-center gap-2.5">
          Documents
          {isPureViewOnly ? (
            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg bg-surface-highest/5 border border-border/10 text-muted-foreground/80 shrink-0">
              View only
            </span>
          ) : null}
        </h1>
        <p className="text-muted-foreground font-medium text-[11px] sm:text-[13px] tracking-wide leading-relaxed text-pretty max-w-none sm:max-w-[min(42rem,100%)]">
          {headerSubtitle}
        </p>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3">
        {canUploadDocs ? (
          <button
            type="button"
            onClick={onOpenUpload}
            className="bg-primary hover:opacity-90 transition-all text-primary-foreground font-bold text-[11px] uppercase tracking-widest px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-border/10 active:scale-95 shrink-0 group shadow-lg shadow-primary/10 w-full sm:w-auto sm:min-w-[11rem] sm:order-2"
          >
            <Upload className="w-4 h-4 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
            <span className="whitespace-nowrap">Upload Assets</span>
          </button>
        ) : null}
        {canIngestFromConnectors ? (
          <button
            type="button"
            onClick={onOpenConnectors}
            className="border border-border/25 bg-surface-highest/15 hover:bg-primary/10 hover:border-primary/35 text-foreground font-bold text-[11px] uppercase tracking-widest px-4 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all w-full sm:w-auto sm:max-w-[16rem] sm:px-5 group sm:order-1"
          >
            <Network className="w-4 h-4 shrink-0 text-primary/90 group-hover:scale-105 transition-transform" />
            <span className="text-center leading-snug sm:text-left">
              <span className="hidden sm:inline">Ingest from connectors</span>
              <span className="sm:hidden">Ingest from connectors</span>
            </span>
          </button>
        ) : null}
      </div>
    </section>

    <MetricStateGrid columns="six">
      <MetricStateCard compact label="Total Documents" value={counts.all} tone="primary" icon={Files} />
      <MetricStateCard compact label="Ingested" value={counts.ingested} tone="emerald" icon={DatabaseZap} />
      <MetricStateCard compact label="Extracted" value={counts.extracted} tone="violet" icon={ScanSearch} />
      <MetricStateCard compact label="Classified" value={counts.classified} tone="amber" icon={Tags} />
      <button
        type="button"
        onClick={onShowConnectorDocuments}
        className="text-left rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 min-w-0"
        title="Show connector-ingested documents"
      >
        <MetricStateCard compact label="From connectors" value={counts.fromConnectors} tone="violet" icon={Network} />
      </button>
      <MetricStateCard compact label="Failed" value={counts.failed} tone="rose" icon={AlertTriangle} />
    </MetricStateGrid>

    {showConnectorBreakdown ? (
      <ConnectorIngestBreakdown
        byType={connectorBreakdown.byType}
        byConnector={connectorBreakdown.byConnector}
        activeConnectorType={activeTab === 'Connectors' ? connectorFilterType : null}
        activeConnectorId={activeTab === 'Connectors' ? connectorFilterId : null}
        onSelectConnectorType={(connectorType) => {
          onShowConnectorDocuments();
          onConnectorTypeFilterChange(connectorType);
          if (connectorType) onConnectorFilterChange(null);
        }}
        onSelectConnector={(connectorId) => {
          onShowConnectorDocuments();
          onConnectorFilterChange(connectorId);
          if (connectorId) onConnectorTypeFilterChange(null);
        }}
      />
    ) : null}

    {activeTab === 'Connectors' && connectorViewAllWorkspaces ? (
      <p className="text-[11px] text-muted-foreground font-medium px-1">
        Showing connector-ingested documents across all workspaces.
      </p>
    ) : null}

    <SearchToolbarRow
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: 'Search by file name, email, or custodian name…',
      }}
      end={
        <div className="flex min-w-max items-center gap-1 bg-surface-highest/30 dark:bg-surface-highest/20 p-1 rounded-xl border border-border/35 dark:border-border/50 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] shrink-0">
          {pipelineTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2',
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground/65 dark:text-muted-foreground/55 hover:text-foreground'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[8px] font-black',
                    activeTab === t.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-surface-highest/50 text-muted-foreground/55 dark:text-muted-foreground/45'
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      }
    />
  </>
);
