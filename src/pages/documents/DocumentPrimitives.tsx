import React from 'react';
import {
  FileText,
  FileCode,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { cls: string; dot: string }> = {
    Complete: { cls: 'text-success bg-success/10 border-success/20', dot: 'bg-success' },
    Processing: { cls: 'text-warning bg-warning/10 border-warning/20', dot: 'bg-warning' },
    Failed: { cls: 'text-destructive bg-destructive/10 border-destructive/20', dot: 'bg-destructive' },
    Idle: { cls: 'text-muted-foreground/40 bg-muted/10 border-border/5', dot: 'bg-muted-foreground/30' },
  };
  const c =
    config[
      status === 'Ingesting...' || status === 'Extracting...' || status === 'Classifying...' ? 'Processing' : status
    ] ?? config.Idle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0',
        c.cls
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', c.dot)} />
      {status}
    </span>
  );
};

export const PipelineStage: React.FC<{
  label: string;
  status: 'done' | 'processing' | 'error' | 'idle';
  isLast?: boolean;
}> = ({ label, status, isLast }) => (
  <div className="flex items-center group/stage">
    <div className="relative flex flex-col items-center">
      <div
        className={cn(
          'w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm',
          status === 'done'
            ? 'bg-success/20 border-success text-success'
            : status === 'processing'
              ? 'bg-warning/20 border-warning text-warning animate-pulse'
              : status === 'error'
                ? 'bg-destructive/20 border-destructive text-destructive'
                : 'bg-surface-highest/10 border-border/20 text-muted-foreground/10'
        )}
      >
        {status === 'done' ? (
          <CheckCircle2 className="w-2.5 h-2.5" />
        ) : status === 'error' ? (
          <AlertCircle className="w-2.5 h-2.5" />
        ) : (
          <div className="w-1 h-1 rounded-full bg-current" />
        )}
      </div>
      <span className="absolute -top-5 whitespace-nowrap text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 group-hover/stage:text-primary transition-colors">
        {label}
      </span>
    </div>
    {!isLast && (
      <div
        className={cn(
          'w-4 h-[1px] mx-0.5 transition-colors duration-500',
          status === 'done' ? 'bg-success/50' : 'bg-surface-highest/10'
        )}
      />
    )}
  </div>
);

export const FileIcon: React.FC<{ type: string }> = ({ type }) => {
  const t = type.toUpperCase();
  if (t === 'PDF') return <FileText className="w-4 h-4" />;
  if (t === 'JSON') return <FileJson className="w-4 h-4" />;
  if (t === 'XLSX' || t === 'CSV') return <FileSpreadsheet className="w-4 h-4" />;
  return <FileCode className="w-4 h-4" />;
};
