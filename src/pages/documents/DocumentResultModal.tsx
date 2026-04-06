import React from 'react';
import { Database, Sparkles, Download } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { FileIcon } from './DocumentPrimitives';

export interface DocumentResultModalProps {
  documentItem: any;
  isOpen: boolean;
  onClose: () => void;
  extractFormat: 'json' | 'csv' | 'md';
  onFormatChange: (fmt: 'json' | 'csv' | 'md') => void;
  onExport: (data: any, fmt: string, filename: string) => void;
  getExtractionText: (res: any, fmt: string) => string;
  allowExport?: boolean;
}

export const DocumentResultModal: React.FC<DocumentResultModalProps> = ({
  documentItem,
  isOpen,
  onClose,
  extractFormat,
  onFormatChange,
  onExport,
  getExtractionText,
  allowExport = true,
}) => {
  if (!documentItem) return null;
  const classificationLabels =
    documentItem?.classificationData &&
    typeof documentItem.classificationData === 'object' &&
    !Array.isArray(documentItem.classificationData) &&
    documentItem.classificationData.labels &&
    typeof documentItem.classificationData.labels === 'object' &&
    !Array.isArray(documentItem.classificationData.labels)
      ? documentItem.classificationData.labels
      : documentItem.classificationData;

  const groups = Array.isArray((classificationLabels as any)?.document_groups)
    ? (classificationLabels as any).document_groups
    : [];
  const pageClassifications = Array.isArray((classificationLabels as any)?.page_classifications)
    ? (classificationLabels as any).page_classifications
    : [];
  const totalPages =
    typeof (classificationLabels as any)?.total_pages === 'number'
      ? (classificationLabels as any).total_pages
      : null;

  const renderPrimitive = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentItem.fileName}
      subtitle={`${documentItem.type} • ${documentItem.size} • ID: ${documentItem.id.slice(0, 8)}`}
      icon={<FileIcon type={documentItem.type} />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        {documentItem.extractionResult && (
          <section className="space-y-4 rounded-2xl border border-border/25 bg-gradient-to-b from-surface-highest/20 to-transparent p-4 sm:p-5">
            <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-3 py-2">
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Database className="w-4 h-4" />
                Extracted Intelligence
              </div>
              <div className="flex items-center gap-1.5 bg-surface-highest/30 p-1 rounded-xl border border-border/30">
                {(['json', 'csv', 'md'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onFormatChange(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                      extractFormat === f
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground/40 hover:text-foreground'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-scrim/90 border border-border/30 rounded-2xl overflow-hidden relative group/code">
              {allowExport ? (
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() =>
                      onExport(
                        documentItem.extractionResult,
                        extractFormat,
                        documentItem.fileName.replace(/ /g, '_')
                      )
                    }
                    className="p-2 rounded-lg bg-primary text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
              <div className="p-5 overflow-x-auto min-h-[150px]">
                <pre className="text-[11px] font-mono text-success/80 leading-relaxed selection:bg-primary/30">
                  {getExtractionText(documentItem.extractionResult, extractFormat)}
                </pre>
              </div>
            </div>
          </section>
        )}

        {classificationLabels && (
          <section className="space-y-3 rounded-2xl border border-border/25 bg-gradient-to-b from-surface-highest/20 to-transparent p-3.5 sm:p-4">
            <div className="flex items-center gap-2 rounded-xl border border-violet/25 bg-gradient-to-r from-violet/20 via-violet/10 to-transparent px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet">
              <Sparkles className="w-4 h-4" />
              AI Classification
            </div>
            {groups.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">Document Groups</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {groups.map((g: any, i: number) => (
                    <div
                      key={`${g?.category || 'group'}-${i}`}
                      className="rounded-xl border border-violet/20 bg-gradient-to-r from-violet/10 via-surface-highest/30 to-transparent px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate whitespace-nowrap text-[10px] sm:text-[11px] text-foreground/90">
                            <span className="font-black text-foreground">{g?.category || 'Unknown'}</span>
                            <span className="mx-1.5 text-muted-foreground/40">/</span>
                            <span className="font-semibold text-muted-foreground/75">
                              Pages {Array.isArray(g?.pages) ? g.pages.join(', ') : '—'}
                            </span>
                            <span className="mx-1.5 text-muted-foreground/40">/</span>
                            <span className="text-muted-foreground/65">
                              Start {renderPrimitive(g?.start_page)}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-violet bg-violet/10 border border-violet/25 rounded-md px-1.5 py-0.5">
                          {typeof g?.confidence === 'number' ? `${Math.round(g.confidence * 100)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {pageClassifications.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/45">Page Classification</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {pageClassifications.map((row: any, i: number) => (
                    <div
                      key={`${row?.page_num || 'page'}-${i}`}
                      className="rounded-xl border border-border/30 bg-surface-highest/20 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate whitespace-nowrap text-[10px] sm:text-[11px] text-foreground/90">
                            <span className="font-black text-foreground">Page {renderPrimitive(row?.page_num)}</span>
                            <span className="mx-1.5 text-muted-foreground/40">/</span>
                            <span className="font-semibold text-muted-foreground/75">
                              {renderPrimitive(row?.category?.name)}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold text-violet bg-violet/10 border border-violet/25 rounded-md px-1.5 py-0.5">
                          {typeof row?.category?.confidence === 'number'
                            ? `${Math.round(row.category.confidence * 100)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {totalPages !== null ? (
              <div className="rounded-xl border border-border/30 bg-gradient-to-r from-surface-highest/25 to-transparent px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Pages</p>
                <p className="text-base font-black text-foreground leading-tight">{totalPages}</p>
              </div>
            ) : null}

            {groups.length === 0 && pageClassifications.length === 0 && totalPages === null ? (
              <div className="bg-surface-highest/20 border border-border/30 rounded-xl p-3">
                <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-words">
                  {JSON.stringify(classificationLabels, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(classificationLabels)
                .filter(([k]) => !['document_groups', 'page_classifications', 'total_pages'].includes(k))
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-surface-highest/10 border border-border/20 rounded-xl px-3 py-2"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">{k}</p>
                    <p className="text-[10px] text-foreground/80 break-words leading-snug">{renderPrimitive(v)}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

      </div>
    </Modal>
  );
};
