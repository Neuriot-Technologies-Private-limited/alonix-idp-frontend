import React from 'react';
import { Loader2, Import, ScanText, Tags, ScrollText, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DocumentPipelineActionsProps {
  docItem: any;
  bulkBusyActive: boolean;
  docBusy: boolean;
  actionBusyKey: string | null;
  bustKey: (docId: string, action: string) => string;
  runPipeline: (docId: string, action: 'ingest' | 'extract' | 'classify') => void;
  onOpenResults: (doc: any) => void;
  /** Vault delete — DELETE /documents/:id (`id` = Mongo document `_id`). */
  onDeleteDocument?: (docItem: any) => void;
  /** When this equals docItem.id, delete control shows a spinner. */
  deleteBusyId?: string | null;
  variant?: 'table' | 'card';
  readOnly?: boolean;
}

export const DocumentPipelineActions: React.FC<DocumentPipelineActionsProps> = ({
  docItem,
  bulkBusyActive,
  docBusy,
  actionBusyKey,
  bustKey,
  runPipeline,
  onOpenResults,
  onDeleteDocument,
  deleteBusyId,
  variant = 'table',
  readOnly = false,
}) => {
  const p = docItem?.pipeline ?? {};
  const ingestionStatus = p?.ingestion?.status ?? 'idle';
  const extractionStatus = p?.extraction?.status ?? 'idle';
  const classificationStatus = p?.classification?.status ?? 'idle';
  const ingestRunning = ingestionStatus === 'processing';
  const extractRunning = extractionStatus === 'processing';
  const classifyRunning = classificationStatus === 'processing';
  const ingestDone = ingestionStatus === 'done';
  const extractDone = extractionStatus === 'done';
  const classifyDone = classificationStatus === 'done';
  const rawExtractionStatus = String(docItem?.extractionStatus ?? '').toUpperCase();
  const rawClassificationStatus = String(docItem?.classificationStatus ?? '').toUpperCase();
  const hasExtractionPayload = Boolean(
    docItem?.extractionResult &&
      (Array.isArray(docItem.extractionResult)
        ? docItem.extractionResult.length
        : typeof docItem.extractionResult === 'object'
          ? Object.keys(docItem.extractionResult).length
          : true)
  );
  const hasClassificationPayload = Boolean(
    docItem?.classificationData &&
      (Array.isArray(docItem.classificationData)
        ? docItem.classificationData.length
        : typeof docItem.classificationData === 'object'
          ? Object.keys(docItem.classificationData).length
          : true)
  );
  const ingestEnabled = !bulkBusyActive && !docBusy && !ingestRunning && !ingestDone;
  const extractEnabled = !bulkBusyActive && !docBusy && !extractRunning && !extractDone;
  const classifyEnabled = !bulkBusyActive && !docBusy && !classifyRunning && !classifyDone;
  const showResults =
    extractDone ||
    classifyDone ||
    hasExtractionPayload ||
    hasClassificationPayload ||
    rawExtractionStatus === 'COMPLETED' ||
    rawClassificationStatus === 'COMPLETED';

  const isCard = variant === 'card';

  const ingestTooltip = ingestDone
    ? 'Ingest — complete (no action needed)'
    : ingestRunning
      ? 'Ingest — in progress…'
      : 'Ingest — run ingestion for this document';
  const extractTooltip = extractDone
    ? 'Extract — complete (no action needed)'
    : extractRunning
      ? 'Extract — in progress…'
      : 'Extract — run extraction and structured output';
  const classifyTooltip = classifyDone
    ? 'Classify — complete (no action needed)'
    : classifyRunning
      ? 'Classify — in progress…'
      : 'Classify — run classification on extracted content';
  const resultsTooltip = 'Results — view extraction and classification output';

  if (readOnly) {
    const wrapReadOnly = isCard
      ? 'flex flex-nowrap items-center justify-between gap-1 sm:gap-1.5 w-full min-w-0 touch-manipulation'
      : 'flex min-w-max items-center justify-end gap-1 whitespace-nowrap';
    if (showResults) {
      return (
        <div className={wrapReadOnly}>
          <button
            type="button"
            aria-label={resultsTooltip}
            title={resultsTooltip}
            onClick={(e) => {
              e.stopPropagation();
              onOpenResults(docItem);
            }}
            className="shrink-0 h-9 w-9 p-0 rounded-lg bg-primary text-primary-foreground shadow-md flex items-center justify-center border border-primary/30 transition-all touch-manipulation hover:brightness-110 active:scale-95"
          >
            <ScrollText className="w-4 h-4" aria-hidden />
          </button>
        </div>
      );
    }
    return (
      <div className={wrapReadOnly}>
        <span className="text-[9px] font-bold text-muted-foreground/35 uppercase tracking-widest tabular-nums">
          No results
        </span>
      </div>
    );
  }

  const wrap = isCard
    ? 'flex flex-nowrap items-center justify-between gap-1 sm:gap-1.5 w-full min-w-0 touch-manipulation'
    : 'flex min-w-max items-center justify-end gap-1 whitespace-nowrap';

  const iconSize = 'h-9 w-9 p-0';

  const iconBtn = (enabled: boolean, tone: 'emerald' | 'violet' | 'amber') =>
    cn(
      'shrink-0 rounded-lg border transition-all flex items-center justify-center touch-manipulation',
      iconSize,
      enabled
        ? tone === 'emerald'
          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20 active:scale-95'
          : tone === 'violet'
            ? 'bg-violet/10 text-violet border-violet/20 hover:bg-violet/20 active:scale-95'
            : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 active:scale-95'
        : 'bg-surface-highest/15 text-muted-foreground/45 border-border/20'
    );

  return (
    <div className={wrap}>
      <button
        type="button"
        aria-label={ingestTooltip}
        title={ingestTooltip}
        disabled={!ingestEnabled}
        onClick={(e) => {
          e.stopPropagation();
          void runPipeline(docItem.id, 'ingest');
        }}
        className={iconBtn(ingestEnabled, 'emerald')}
      >
        {actionBusyKey === bustKey(docItem.id, 'ingest') ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Import className="w-4 h-4" aria-hidden />
        )}
      </button>
      <button
        type="button"
        aria-label={extractTooltip}
        title={extractTooltip}
        disabled={!extractEnabled}
        onClick={(e) => {
          e.stopPropagation();
          void runPipeline(docItem.id, 'extract');
        }}
        className={iconBtn(extractEnabled, 'violet')}
      >
        {actionBusyKey === bustKey(docItem.id, 'extract') ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ScanText className="w-4 h-4" aria-hidden />
        )}
      </button>
      <button
        type="button"
        aria-label={classifyTooltip}
        title={classifyTooltip}
        disabled={!classifyEnabled}
        onClick={(e) => {
          e.stopPropagation();
          void runPipeline(docItem.id, 'classify');
        }}
        className={iconBtn(classifyEnabled, 'amber')}
      >
        {actionBusyKey === bustKey(docItem.id, 'classify') ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Tags className="w-4 h-4" aria-hidden />
        )}
      </button>
      {showResults && (
        <button
          type="button"
          aria-label={resultsTooltip}
          title={resultsTooltip}
          onClick={(e) => {
            e.stopPropagation();
            onOpenResults(docItem);
          }}
          className="shrink-0 h-9 w-9 p-0 rounded-lg bg-primary text-primary-foreground shadow-md flex items-center justify-center border border-primary/30 transition-all touch-manipulation hover:brightness-110 active:scale-95"
        >
          <ScrollText className="w-4 h-4" aria-hidden />
        </button>
      )}
      <button
        type="button"
        aria-label="Delete document"
        title="Delete — remove this document"
        disabled={
          Boolean(deleteBusyId) ||
          bulkBusyActive ||
          docBusy ||
          !onDeleteDocument
        }
        onClick={(e) => {
          e.stopPropagation();
          onDeleteDocument?.(docItem);
        }}
        className={cn(
          'shrink-0 h-9 w-9 rounded-lg bg-surface-highest/15 flex items-center justify-center border border-border/20 touch-manipulation transition-colors',
          onDeleteDocument
            ? 'text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 active:scale-95'
            : 'text-muted-foreground/20 cursor-not-allowed opacity-50',
          deleteBusyId === docItem.id && 'opacity-90'
        )}
      >
        {deleteBusyId === docItem.id ? (
          <Loader2 className="w-4 h-4 animate-spin text-destructive/90" aria-hidden />
        ) : (
          <Trash2 className="w-4 h-4" aria-hidden />
        )}
      </button>
    </div>
  );
};
