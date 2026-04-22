import React, { useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, X, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react';
import { useUploadStore } from '../../stores/uploadStore';
import type { UploadJob } from '../../stores/uploadStore';
import { cn } from '../../utils/cn';
import { truncateFileName } from '../../utils/truncateFileName';

const AUTO_DISMISS_MS = 5000;

// ─── Individual job row ────────────────────────────────────────────────────────

interface JobRowProps {
  job: UploadJob;
  onDismiss: (id: string) => void;
}

const JobRow: React.FC<JobRowProps> = ({ job, onDismiss }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss 'done' jobs after AUTO_DISMISS_MS
  useEffect(() => {
    if (job.status === 'done') {
      timerRef.current = setTimeout(() => onDismiss(job.id), AUTO_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [job.status, job.id, onDismiss]);

  const shortName = truncateFileName(job.fileName, 34);
  const displaySize =
    job.fileSize >= 1024 * 1024
      ? `${(job.fileSize / 1024 / 1024).toFixed(1)} MB`
      : `${(job.fileSize / 1024).toFixed(0)} KB`;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all group/job',
        job.status === 'uploading' && 'border-primary/20 bg-primary/5',
        job.status === 'done' && 'border-emerald-500/20 bg-emerald-500/5',
        job.status === 'error' && 'border-rose-500/20 bg-rose-500/5'
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {job.status === 'uploading' && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {job.status === 'done' && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
        {job.status === 'error' && (
          <XCircle className="w-4 h-4 text-rose-500" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-bold text-foreground leading-snug truncate"
          title={job.fileName}
        >
          {shortName}
        </p>
        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-muted-foreground/50 tabular-nums">
          {displaySize}
          {job.status === 'uploading' && (
            <span className="ml-1.5 text-primary/70">· uploading…</span>
          )}
          {job.status === 'done' && (
            <span className="ml-1.5 text-emerald-500/80">· uploaded</span>
          )}
          {job.status === 'error' && (
            <span className="ml-1.5 text-rose-500/80">· failed</span>
          )}
        </p>
        {job.status === 'error' && job.error && (
          <p className="text-[9px] text-rose-400 mt-0.5 leading-relaxed" title={job.error}>
            {truncateFileName(job.error, 48)}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      {job.status !== 'uploading' && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(job.id)}
          className="shrink-0 p-1 rounded-md text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors opacity-0 group-hover/job:opacity-100 focus-visible:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// ─── Panel ─────────────────────────────────────────────────────────────────────

export const UploadToastPanel: React.FC = () => {
  const { jobs, removeJob, clearFinished } = useUploadStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleDismiss = useCallback(
    (id: string) => removeJob(id),
    [removeJob]
  );

  if (jobs.length === 0) return null;

  const uploading = jobs.filter((j) => j.status === 'uploading').length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const failed = jobs.filter((j) => j.status === 'error').length;

  const panelTitle =
    uploading > 0
      ? `Uploading ${uploading} file${uploading > 1 ? 's' : ''}…`
      : done > 0 && failed === 0
        ? `${done} file${done > 1 ? 's' : ''} uploaded`
        : failed > 0
          ? `${failed} upload${failed > 1 ? 's' : ''} failed`
          : 'Uploads';

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[60] w-[320px] max-w-[calc(100vw-3rem)]',
        'rounded-2xl border border-border/35 bg-background/90 backdrop-blur-xl shadow-2xl shadow-black/20',
        'animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          <UploadCloud className="w-4 h-4" />
        </div>
        <p className="flex-1 min-w-0 text-[11px] font-black uppercase tracking-wider text-foreground truncate">
          {panelTitle}
        </p>
        <div className="flex items-center gap-1">
          {/* Clear finished */}
          {(done > 0 || failed > 0) && uploading === 0 && (
            <button
              type="button"
              onClick={clearFinished}
              className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-foreground hover:bg-surface-highest/10 transition-all"
            >
              Clear
            </button>
          )}
          {/* Collapse toggle */}
          {jobs.length > 1 && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-1 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface-highest/10 transition-all"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Job list */}
      {!collapsed && (
        <div className="px-3 py-3 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
};
