import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Database,
  Sparkles,
  Loader2,
  ClipboardCheck,
  Eye,
  FileCode2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { FileIcon } from '../../pages/documents/DocumentPrimitives';
import { ExtractionReviewPanel } from './ExtractionReviewPanel';
import { ClassificationReviewPanel } from './ClassificationReviewPanel';
import { RawResultPanel } from './RawResultPanel';
import {
  cloneClassificationState,
  cloneExtractionPages,
  classificationReviewPatchBody,
  hasReviewableClassificationChanges,
  hasReviewableExtractionChanges,
  type DocumentReviewPayload,
  type ExtractionReviewPage,
  type ClassificationReviewState,
} from '../../types/documentReview';
import {
  patchClassificationReview,
  patchExtractionReview,
} from '../../services/documentReviewApi';

export type ReviewTab = 'extraction' | 'classification' | 'raw';

export interface DocumentReviewDrawerProps {
  documentItem: Record<string, unknown> | null;
  reviewData: DocumentReviewPayload | null;
  isOpen: boolean;
  /** Fetching results from API — show spinner in body and footer. */
  isLoading?: boolean;
  onClose: () => void;
  allowEdit: boolean;
  allowExport?: boolean;
  extractFormat: 'json' | 'csv' | 'md';
  onFormatChange: (fmt: 'json' | 'csv' | 'md') => void;
  onExport: (data: unknown, fmt: string, filename: string) => void;
  onSaved?: () => void | Promise<void>;
  onError?: (message: string, err?: unknown) => void;
}

export const DocumentReviewDrawer: React.FC<DocumentReviewDrawerProps> = ({
  documentItem,
  reviewData,
  isOpen,
  isLoading = false,
  onClose,
  allowEdit,
  allowExport = false,
  extractFormat,
  onFormatChange,
  onExport,
  onSaved,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('extraction');
  const [extractionPages, setExtractionPages] = useState<ExtractionReviewPage[]>([]);
  const [classificationState, setClassificationState] = useState<ClassificationReviewState>({
    documentGroups: [],
    pageClassifications: [],
    totalPages: null,
    extraLabels: {},
  });
  const [initialExtraction, setInitialExtraction] = useState<ExtractionReviewPage[]>([]);
  const [initialClassification, setInitialClassification] = useState<ClassificationReviewState>({
    documentGroups: [],
    pageClassifications: [],
    totalPages: null,
    extraLabels: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!reviewData || !isOpen || isLoading) return;
    const pages = cloneExtractionPages(reviewData.extractionView.pages);
    const cls = cloneClassificationState(reviewData.classificationView);
    setExtractionPages(pages);
    setClassificationState(cls);
    setInitialExtraction(cloneExtractionPages(pages));
    setInitialClassification(cloneClassificationState(cls));
    if (reviewData.reviewSummary.classificationNeedsReview && !reviewData.reviewSummary.extractionNeedsReview) {
      setActiveTab('classification');
    } else {
      setActiveTab('extraction');
    }
  }, [reviewData, isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, saving, isLoading]);

  const threshold = reviewData?.confidenceThreshold ?? 0.6;
  const contentReady = Boolean(reviewData) && !isLoading;
  const extractionDirty = hasReviewableExtractionChanges(extractionPages, initialExtraction);
  const classificationDirty = hasReviewableClassificationChanges(
    classificationState,
    initialClassification
  );
  const isDirty = extractionDirty || classificationDirty;

  const summary = reviewData?.reviewSummary;
  const extBadge = summary?.extractionReviewCount ?? 0;
  const clsBadge = summary?.classificationReviewCount ?? 0;

  const exportPayload = useMemo(() => {
    if (!reviewData) return null;
    return reviewData.extractionResult ?? { pages: extractionPages };
  }, [reviewData, extractionPages]);

  const handleDiscard = () => {
    setExtractionPages(cloneExtractionPages(initialExtraction));
    setClassificationState(cloneClassificationState(initialClassification));
  };

  const handleSave = async () => {
    if (!documentItem?.id || !allowEdit || !isDirty) return;
    const docId = String(documentItem.id);
    const groupId = documentItem.groupId ? String(documentItem.groupId) : null;
    setSaving(true);
    try {
      if (extractionDirty) {
        await patchExtractionReview(docId, groupId, extractionPages, initialExtraction);
      }
      if (classificationDirty) {
        await patchClassificationReview(
          docId,
          groupId,
          classificationReviewPatchBody(classificationState, initialClassification)
        );
      }
      setInitialExtraction(cloneExtractionPages(extractionPages));
      setInitialClassification(cloneClassificationState(classificationState));
      await onSaved?.();
    } catch (err: unknown) {
      onError?.('Could not save review changes', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !documentItem) return null;

  const fileName = String(documentItem.fileName ?? 'Document');
  const subtitle = [
    documentItem.type,
    documentItem.size,
    documentItem.id ? `ID: ${String(documentItem.id).slice(0, 8)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const readOnlyBanner = !allowEdit;

  const reviewHintBanner =
    !isLoading && activeTab === 'raw' ? (
      <p className="inline-flex w-fit max-w-full items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-[10px] leading-snug text-cyan-200/85">
        <FileCode2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" aria-hidden />
        <span>Switch JSON, CSV, or MD to inspect the full extraction payload.</span>
      </p>
    ) : !isLoading && readOnlyBanner ? (
      <p className="inline-flex w-fit max-w-full items-start gap-2 rounded-lg border border-border/25 bg-surface-highest/20 px-3 py-2 text-[10px] leading-snug text-muted-foreground/80">
        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
        <span>View-only — edit requires admin or uploader access.</span>
      </p>
    ) : !isLoading ? (
      <p className="inline-flex w-fit max-w-full items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.08] px-3 py-2 text-[10px] leading-snug text-primary/90">
        <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Edit highlighted fields, then click Save — changes are not sent until you save.
        </span>
      </p>
    ) : null;

  return createPortal(
    (
      <div
        className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-busy={isLoading}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close review"
          className="absolute inset-0 bg-scrim backdrop-blur-md"
          onClick={saving ? undefined : onClose}
        />
        <div
          className={cn(
            'relative z-10 my-auto flex w-full max-h-[min(92vh,56rem)] max-w-[min(56rem,calc(100vw-2rem))] flex-col overflow-hidden',
            'rounded-2xl border-2 border-border/55 bg-surface-lowest shadow-2xl ring-1 ring-border/25 sm:rounded-[28px]',
            'animate-in zoom-in-95 duration-300'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — compact rail for maximum scroll area */}
          <div className="relative shrink-0 border-b border-border/40 bg-surface-high/90 px-3 py-2 sm:px-4 sm:py-2.5">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent"
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-surface-lowest/50 text-primary">
                  <FileIcon type={String(documentItem.type ?? 'pdf')} />
                </div>
                <div className="min-w-0 leading-tight">
                  <h2 className="truncate font-display text-sm font-bold tracking-tight text-foreground sm:text-[15px]">
                    {fileName}
                  </h2>
                  <p className="truncate text-[9px] font-bold uppercase tracking-wider text-muted-foreground/55">
                    {subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/45 bg-surface-lowest/60 text-muted-foreground transition-all hover:text-foreground active:scale-95 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div
              className={cn(
                'relative mt-2 flex flex-wrap items-center gap-1.5',
                isLoading && 'pointer-events-none opacity-50'
              )}
            >
              <button
                type="button"
                onClick={() => setActiveTab('extraction')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all',
                  activeTab === 'extraction'
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-border/30 bg-surface-highest/15 text-muted-foreground/55 hover:text-foreground'
                )}
              >
                <Database className="h-3 w-3" />
                Extraction
                {extBadge > 0 ? (
                  <span className="rounded bg-primary/15 px-1 py-px text-[8px] text-primary tabular-nums">
                    {extBadge}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('classification')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all',
                  activeTab === 'classification'
                    ? 'border-violet/40 bg-violet/15 text-violet'
                    : 'border-border/30 bg-surface-highest/15 text-muted-foreground/55 hover:text-foreground'
                )}
              >
                <Sparkles className="h-3 w-3" />
                Classification
                {clsBadge > 0 ? (
                  <span className="rounded bg-violet/15 px-1 py-px text-[8px] text-violet tabular-nums">
                    {clsBadge}
                  </span>
                ) : null}
              </button>
              {exportPayload ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all',
                    activeTab === 'raw'
                      ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-300'
                      : 'border-border/30 bg-surface-highest/15 text-muted-foreground/55 hover:text-foreground'
                  )}
                >
                  <FileCode2 className="h-3 w-3" />
                  Raw result
                </button>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-surface-lowest px-3 py-3 sm:px-4 sm:py-3.5">
            {isLoading ? (
              <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 py-6">
                <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
                <p className="text-[10px] font-semibold text-muted-foreground/75">
                  Loading extraction and classification results…
                </p>
              </div>
            ) : contentReady && activeTab === 'extraction' ? (
              <ExtractionReviewPanel
                pages={extractionPages}
                threshold={threshold}
                allowEdit={allowEdit}
                onPagesChange={setExtractionPages}
              />
            ) : contentReady && activeTab === 'raw' && exportPayload ? (
              <RawResultPanel
                data={exportPayload}
                format={extractFormat}
                onFormatChange={onFormatChange}
                onDownload={onExport}
                filename={fileName}
                allowDownload={allowExport}
              />
            ) : contentReady ? (
              <ClassificationReviewPanel
                state={classificationState}
                threshold={threshold}
                allowEdit={allowEdit}
                onStateChange={setClassificationState}
              />
            ) : null}
          </div>

          {/* Footer — hint + actions on one row */}
          <div className="shrink-0 border-t border-border/40 bg-surface-high/30 px-3 py-2 sm:px-4 sm:py-2.5">
            <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1 flex items-center">
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Loading…
                  </span>
                ) : (
                  reviewHintBanner
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={!contentReady || !isDirty || saving || !allowEdit || isLoading}
                  className="rounded-lg border border-border/35 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/75 transition-all hover:bg-surface-highest/25 disabled:opacity-40"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!contentReady || !isDirty || saving || !allowEdit || isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground shadow-md shadow-primary/10 transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};
