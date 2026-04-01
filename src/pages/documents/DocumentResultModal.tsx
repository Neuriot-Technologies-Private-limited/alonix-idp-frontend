import React from 'react';
import { Database, Sparkles, Activity, Download } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { FileIcon, StatusBadge } from './DocumentPrimitives';

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
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Database className="w-4 h-4" />
                Extracted Intelligence
              </div>
              <div className="flex items-center gap-1.5 bg-surface-highest/5 p-1 rounded-xl border border-border/10">
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

            <div className="bg-scrim border border-border/10 rounded-2xl overflow-hidden relative group/code">
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

        {documentItem.classificationData && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet">
              <Sparkles className="w-4 h-4" />
              AI Classification
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(documentItem.classificationData).map(([k, v]) => (
                <div
                  key={k}
                  className="bg-surface-highest/5 border border-border/10 rounded-2xl p-4 hover:bg-surface-highest/10 transition-colors"
                >
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-2">{k}</p>
                  <p className="text-xs font-black text-foreground truncate">
                    {Array.isArray(v)
                      ? v.join(', ')
                      : typeof v === 'number'
                        ? `${(v * 100).toFixed(0)}%`
                        : String(v)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {documentItem.jobs && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-success">
              <Activity className="w-4 h-4" />
              Process Ledger
            </div>
            <div className="bg-surface-highest/5 border border-border/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/10 bg-surface-highest/10">
                    <th className="px-5 py-2.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                      Sequence
                    </th>
                    <th className="px-5 py-2.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                      Outcome
                    </th>
                    <th className="px-5 py-2.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                      Runtime
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {documentItem.jobs.map((j: any) => (
                    <tr key={j.jobId}>
                      <td className="px-5 py-3">
                        <p className="text-[11px] font-black text-foreground">{j.taskType}</p>
                        <p className="text-[8px] text-muted-foreground/30 uppercase tracking-widest mt-0.5">{j.jobId}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={
                            j.status === 'completed'
                              ? 'Complete'
                              : j.status === 'running'
                                ? 'Processing'
                                : 'Failed'
                          }
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground/50">
                            {j.startTime ? new Date(j.startTime).toLocaleTimeString() : '—'}
                          </span>
                          <span className="text-[8px] text-muted-foreground/20 font-black uppercase tracking-tighter">
                            Start Sequence
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
};
