import React from 'react';
import { Database, AlertCircle, Lock } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ExtractionReviewPage, ReviewField } from '../../types/documentReview';

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
          ? 'border-amber-500/35 bg-amber-500/15 text-amber-400'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      )}
    >
      {pct}%
    </span>
  );
}

export interface ExtractionReviewPanelProps {
  pages: ExtractionReviewPage[];
  threshold: number;
  allowEdit: boolean;
  onPagesChange: (pages: ExtractionReviewPage[]) => void;
}

export const ExtractionReviewPanel: React.FC<ExtractionReviewPanelProps> = ({
  pages,
  threshold,
  allowEdit,
  onPagesChange,
}) => {
  const updateField = (
    pageIdx: number,
    fieldIdx: number,
    patch: Partial<ReviewField>
  ) => {
    onPagesChange(
      pages.map((p, pi) =>
        pi !== pageIdx
          ? p
          : {
              ...p,
              fields: p.fields.map((f, fi) =>
                fi !== fieldIdx ? f : { ...f, ...patch, needsReview: false }
              ),
            }
      )
    );
  };

  if (!pages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/35 bg-surface-highest/10 px-6 py-12 text-center">
        <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-[11px] font-semibold text-muted-foreground/70">
          No extraction pages to review yet.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/45">
          Run extraction on this document, then open results again.
        </p>
      </div>
    );
  }

  const reviewableCount = pages.reduce(
    (n, p) => n + p.fields.filter((f) => f.needsReview).length,
    0
  );

  return (
    <div className="space-y-2.5">
      {allowEdit ? (
        <p className="text-[9px] leading-snug text-muted-foreground/60">
          {reviewableCount > 0
            ? `You can edit ${reviewableCount} field${reviewableCount === 1 ? '' : 's'} below ${Math.round(threshold * 100)}% confidence. High-confidence fields are read-only.`
            : 'All fields meet the confidence threshold — nothing to edit here.'}
        </p>
      ) : null}

      {pages.map((page, pageIdx) => (
        <section
          key={`page-${page.pageNumber}-${pageIdx}`}
          className="overflow-hidden rounded-xl border border-border/25 bg-gradient-to-b from-surface-highest/15 to-transparent"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/25 bg-surface-highest/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Page {page.pageNumber}
              </span>
              {page.fields.some((f) => f.needsReview) ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Needs review
                </span>
              ) : null}
            </div>
            {page.documentType ? (
              <span className="text-[10px] font-semibold text-muted-foreground/70">
                {page.documentType}
              </span>
            ) : null}
          </div>

          <div className="divide-y divide-border/20">
            {page.fields.map((field, fieldIdx) => {
              const canEditField = allowEdit && field.needsReview;
              return (
                <div
                  key={`${field.key}-${fieldIdx}`}
                  className={cn(
                    'grid grid-cols-1 gap-1.5 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]',
                    field.needsReview && 'bg-amber-500/[0.07] ring-1 ring-inset ring-amber-500/20'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
                      Field
                    </p>
                    <p className="truncate text-[11px] font-bold text-foreground">{field.key}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">
                      Value
                    </p>
                    {canEditField ? (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          updateField(pageIdx, fieldIdx, { value: e.target.value })
                        }
                        className="mt-0.5 w-full rounded-lg border border-amber-500/30 bg-surface-lowest/80 px-2.5 py-1.5 text-[11px] text-foreground outline-none focus:border-primary/40"
                        aria-label={`Edit ${field.key}`}
                      />
                    ) : (
                      <div className="mt-0.5 flex items-start gap-1.5">
                        <p className="flex-1 text-[11px] text-foreground/90 break-words">
                          {field.value || '—'}
                        </p>
                        {allowEdit && !field.needsReview ? (
                          <Lock
                            className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/35"
                            aria-label="High confidence — read only"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-start sm:justify-end pb-0.5">
                    {confidencePill(field.confidence, threshold)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
