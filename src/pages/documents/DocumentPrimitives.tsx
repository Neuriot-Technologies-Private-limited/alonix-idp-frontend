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
    Complete: { cls: 'text-success bg-success/12 border-success/30 dark:border-success/40', dot: 'bg-success' },
    Processing: { cls: 'text-warning bg-warning/12 border-warning/30 dark:border-warning/40', dot: 'bg-warning' },
    Failed: {
      cls: 'text-destructive bg-destructive/12 border-destructive/30 dark:border-destructive/40',
      dot: 'bg-destructive',
    },
    Idle: {
      cls: 'text-muted-foreground/75 dark:text-muted-foreground/65 bg-muted/15 border-border/25 dark:border-border/40',
      dot: 'bg-muted-foreground/45',
    },
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
            ? 'bg-success/22 border-success/70 text-success shadow-success/25'
            : status === 'processing'
              ? 'bg-warning/22 border-warning/70 text-warning animate-pulse shadow-warning/25'
              : status === 'error'
                ? 'bg-destructive/22 border-destructive/70 text-destructive shadow-destructive/25'
                : 'bg-surface-highest/22 border-border/35 dark:border-border/50 text-muted-foreground/35'
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
      <span className="absolute -top-5 whitespace-nowrap text-[7px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 group-hover/stage:text-primary transition-colors">
        {label}
      </span>
    </div>
    {!isLast && (
      <div
        className={cn(
          'w-4 h-[1px] mx-0.5 transition-colors duration-500',
          status === 'done' ? 'bg-success/60' : 'bg-border/35 dark:bg-border/45'
        )}
      />
    )}
  </div>
);

export const FileIcon: React.FC<{ type: string }> = ({ type }) => {
  const t = type.toUpperCase();
  if (t === 'PDF') return <FileText className="w-4 h-4 text-rose-500 dark:text-rose-300" />;
  if (t === 'JSON') return <FileJson className="w-4 h-4 text-violet-500 dark:text-violet-300" />;
  if (t === 'XLSX' || t === 'CSV')
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-300" />;
  return <FileCode className="w-4 h-4 text-primary" />;
};
