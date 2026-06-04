import React from 'react';
import { Sparkles, AlertCircle, Lock, Layers, FileStack } from 'lucide-react';
import { cn } from '../../utils/cn';
import type {
  ClassificationReviewState,
  DocumentGroupRow,
  PageClassificationRow,
} from '../../types/documentReview';
import { formatExtraLabelValue, formatPageNumberList, humanizeLabelKey } from '../../types/documentReview';

const REVIEW_FIELD_INPUT =
  'w-full rounded-lg border border-border/50 bg-surface-high/70 px-2.5 py-1.5 text-foreground shadow-inner outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/45 focus:bg-surface-high focus:ring-1 focus:ring-primary/20';

const REVIEW_ROW_HIGHLIGHT =
  'border-primary/30 bg-primary/[0.08] ring-1 ring-primary/15';

const REVIEW_LABEL =
  'inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/90';

function confidencePill(confidence: number | null, threshold: number) {
  if (confidence == null) {
    return (
      <span className="rounded-md border border-border/30 bg-surface-highest/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
        Unknown
      </span>
    );
  }
  const pct = Math.round(confidence * 100);
  const low = confidence < threshold;
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
        low
          ? 'border-orange-400/30 bg-orange-400/10 text-orange-300'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      )}
    >
      {pct}%
    </span>
  );
}

function DocumentGroupCard({
  group,
  threshold,
  allowEdit,
  onCategoryChange,
}: {
  group: DocumentGroupRow;
  threshold: number;
  allowEdit: boolean;
  onCategoryChange: (category: string) => void;
}) {
  const canEdit = allowEdit && group.needsReview;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/35 bg-surface-high/25 px-4 py-3',
        group.needsReview && REVIEW_ROW_HIGHLIGHT
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet/25 bg-violet/10 text-violet">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
              Document type
            </p>
            {canEdit ? (
              <input
                type="text"
                value={group.category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={cn('mt-1 text-sm font-bold', REVIEW_FIELD_INPUT)}
                placeholder="e.g. Invoice, Contract"
              />
            ) : (
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground">{group.category}</p>
                {allowEdit && !group.needsReview ? (
                  <Lock className="h-3 w-3 text-muted-foreground/35" aria-hidden />
                ) : null}
              </div>
            )}
            <p className="mt-1.5 text-[10px] text-muted-foreground/60">
              {formatPageNumberList(group.pageNumbers)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {group.needsReview ? (
            <span className={REVIEW_LABEL}>
              <AlertCircle className="h-3 w-3" />
              Review
            </span>
          ) : null}
          {confidencePill(group.confidence, threshold)}
        </div>
      </div>
    </div>
  );
}

export interface ClassificationReviewPanelProps {
  state: ClassificationReviewState;
  threshold: number;
  allowEdit: boolean;
  onStateChange: (state: ClassificationReviewState) => void;
}

export const ClassificationReviewPanel: React.FC<ClassificationReviewPanelProps> = ({
  state,
  threshold,
  allowEdit,
  onStateChange,
}) => {
  const updateRow = (idx: number, patch: Partial<PageClassificationRow>) => {
    onStateChange({
      ...state,
      pageClassifications: state.pageClassifications.map((r, i) =>
        i !== idx ? r : { ...r, ...patch }
      ),
    });
  };

  const updateGroup = (idx: number, category: string) => {
    onStateChange({
      ...state,
      documentGroups: state.documentGroups.map((g, i) =>
        i !== idx ? g : { ...g, category }
      ),
    });
  };

  const groups = state.documentGroups;
  const rows = state.pageClassifications;
  const hasContent =
    rows.length > 0 ||
    groups.length > 0 ||
    state.totalPages != null ||
    Object.keys(state.extraLabels).length > 0;

  const reviewableCount =
    groups.filter((g) => g.needsReview).length + rows.filter((r) => r.needsReview).length;

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-dashed border-border/35 bg-surface-highest/10 px-6 py-12 text-center">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-[11px] font-semibold text-muted-foreground/70">
          No classification output to review yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {allowEdit ? (
        <p className="text-[10px] text-muted-foreground/65">
          {reviewableCount > 0
            ? `Edit ${reviewableCount} low-confidence classification${reviewableCount === 1 ? '' : 's'} below ${Math.round(threshold * 100)}%. Other results are shown for reference only.`
            : 'All classifications meet the confidence threshold — nothing to edit here.'}
        </p>
      ) : null}

      {groups.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <FileStack className="h-3.5 w-3.5 text-violet" />
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
              How this document was grouped
            </p>
          </div>
          <div className="space-y-2">
            {groups.map((g, i) => (
              <DocumentGroupCard
                key={`${g.category}-${i}`}
                group={g}
                threshold={threshold}
                allowEdit={allowEdit}
                onCategoryChange={(category) => updateGroup(i, category)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {state.totalPages != null ? (
        <div className="rounded-xl border border-border/30 bg-gradient-to-r from-surface-highest/25 to-transparent px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            Total pages in document
          </p>
          <p className="mt-1 text-base font-black text-foreground">{state.totalPages}</p>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
            Category per page
          </p>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {rows.map((row, i) => {
              const canEditRow = allowEdit && row.needsReview;
              return (
                <div
                  key={`${row.pageNum}-${i}`}
                  className={cn(
                    'rounded-xl border border-border/35 bg-surface-high/25 px-3 py-2.5',
                    row.needsReview && REVIEW_ROW_HIGHLIGHT
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black text-foreground">
                          Page {row.pageNum}
                        </span>
                        {row.needsReview ? (
                          <AlertCircle className="h-3 w-3 text-primary/80" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Category
                      </p>
                      {canEditRow ? (
                        <input
                          type="text"
                          value={row.categoryName}
                          onChange={(e) =>
                            updateRow(i, { categoryName: e.target.value })
                          }
                          className={cn('mt-0.5 text-[11px] font-semibold', REVIEW_FIELD_INPUT)}
                          placeholder="Category name"
                        />
                      ) : (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="truncate text-[11px] font-semibold text-foreground/90">
                            {row.categoryName || '—'}
                          </p>
                          {allowEdit && !row.needsReview ? (
                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/35" aria-hidden />
                          ) : null}
                        </div>
                      )}
                    </div>
                    {confidencePill(row.confidence, threshold)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {Object.keys(state.extraLabels).length > 0 ? (
        <section className="rounded-2xl border border-border/20 bg-surface-highest/5 p-4">
          <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            Other details
          </p>
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Object.entries(state.extraLabels).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-border/20 bg-surface-highest/10 px-3 py-2.5"
              >
                <dt className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
                  {humanizeLabelKey(k)}
                </dt>
                <dd className="mt-1 text-[11px] font-medium text-foreground/85 break-words">
                  {formatExtraLabelValue(v)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
};
