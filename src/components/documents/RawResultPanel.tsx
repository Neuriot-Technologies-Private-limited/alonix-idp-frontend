import React, { useMemo, useState } from 'react';
import { Braces, Check, Copy, Download, FileCode2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getExtractionText } from '../../pages/documents/utils/export/extractionExport';

export type RawResultFormat = 'json' | 'csv' | 'md';

const FORMAT_META: Record<RawResultFormat, { label: string; hint: string }> = {
  json: { label: 'JSON', hint: 'Structured object — full extraction payload' },
  csv: { label: 'CSV', hint: 'Page, key, value rows for spreadsheets' },
  md: { label: 'MD', hint: 'Markdown sections per page' },
};

export interface RawResultPanelProps {
  data: unknown;
  format: RawResultFormat;
  onFormatChange: (fmt: RawResultFormat) => void;
  onDownload: (data: unknown, fmt: string, filename: string) => void;
  filename: string;
  allowDownload?: boolean;
}

export const RawResultPanel: React.FC<RawResultPanelProps> = ({
  data,
  format,
  onFormatChange,
  onDownload,
  filename,
  allowDownload = true,
}) => {
  const [copied, setCopied] = useState(false);

  const rawText = useMemo(() => getExtractionText(data, format), [data, format]);

  const handleCopy = async () => {
    if (!rawText) return;
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-border/35 bg-surface-highest/10 px-6 py-12 text-center">
        <FileCode2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-[11px] font-semibold text-muted-foreground/70">
          No raw extraction output yet.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/45">
          Run extraction on this document, then open results again.
        </p>
      </div>
    );
  }

  const safeName = filename.replace(/ /g, '_');

  return (
    <div className="flex min-h-0 flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/30 bg-gradient-to-r from-surface-highest/30 via-surface-highest/15 to-transparent px-2.5 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground/45">
            <Braces className="h-3 w-3 text-primary/60" aria-hidden />
            View as
          </span>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Raw result format">
            {(['json', 'csv', 'md'] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => onFormatChange(f)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest transition-all',
                  format === f
                    ? 'border-primary/45 bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border-border/30 bg-surface-lowest/40 text-muted-foreground/55 hover:border-border/50 hover:text-foreground'
                )}
              >
                {FORMAT_META[f].label}
              </button>
            ))}
          </div>
          <p className="w-full text-[9px] text-muted-foreground/50 sm:w-auto sm:pl-1">
            {FORMAT_META[format].hint}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!rawText}
            className="inline-flex items-center gap-1 rounded-md border border-border/35 bg-surface-lowest/50 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 transition-all hover:border-border/55 hover:text-foreground disabled:opacity-40"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {allowDownload ? (
            <button
              type="button"
              onClick={() => onDownload(data, format, safeName)}
              disabled={!rawText}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-primary-foreground shadow-sm shadow-primary/10 transition-all hover:opacity-90 disabled:opacity-40"
            >
              <Download className="h-3 w-3" aria-hidden />
              Download
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-[14rem] flex-1 overflow-hidden rounded-xl border border-border/25 bg-[#0a0c10] shadow-inner">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/35 to-transparent"
          aria-hidden
        />
        <pre
          className="custom-scrollbar h-full max-h-[min(52vh,28rem)] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-100/85 selection:bg-primary/25"
          aria-label={`Raw extraction as ${format}`}
        >
          <code>{rawText || '—'}</code>
        </pre>
      </div>
    </div>
  );
};
