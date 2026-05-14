import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { FileIcon } from './DocumentPrimitives';
import { truncateFileName } from '../../utils/truncateFileName';
import { DocumentSensitivityBadge } from './DocumentSensitivityBadge';

export interface DocumentAssetIdentityProps {
  fileName: string;
  type: string;
  size: string;
  /** Slightly larger icon area for mobile cards. */
  density?: 'table' | 'card';
  /** Data classification for the asset (from pipeline). */
  sensitivityLevel?: string | null;
  onFileNameClick?: () => void;
  canOpenFile?: boolean;
  isOpening?: boolean;
}

export const DocumentAssetIdentity: React.FC<DocumentAssetIdentityProps> = ({
  fileName,
  type,
  size,
  density = 'table',
  sensitivityLevel,
  onFileNameClick,
  canOpenFile = false,
  isOpening = false,
}) => {
  const isCard = density === 'card';
  const badgeDensity = isCard ? 'comfortable' : 'compact';
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/10 flex items-center justify-center text-primary shrink-0',
          isCard ? 'w-10 h-10 from-primary/25' : 'w-9 h-9 group-hover/row:scale-105 transition-all'
        )}
      >
        <FileIcon type={type} />
      </div>
      <div className="min-w-0">
        <div className={cn('flex flex-wrap items-center gap-1.5 min-w-0', isCard && 'gap-2')}>
          {canOpenFile && onFileNameClick ? (
            <button
              type="button"
              onClick={onFileNameClick}
              className={cn(
                'text-[13px] font-bold text-foreground truncate text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm inline-flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait max-w-[210px]',
                !isCard && 'group-hover/row:text-primary transition-colors cursor-pointer',
                isCard && 'leading-snug break-words cursor-pointer max-w-full'
              )}
              title={fileName}
              disabled={isOpening}
            >
              {isOpening ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" /> : null}
              <span className="truncate">{truncateFileName(fileName, 36)}</span>
            </button>
          ) : (
            <p
              className={cn(
                'text-[13px] font-bold text-foreground truncate max-w-[210px]',
                !isCard && 'group-hover/row:text-primary transition-colors',
                isCard && 'leading-snug break-words max-w-full'
              )}
              title={fileName}
            >
              {truncateFileName(fileName, 36)}
            </p>
          )}
          <DocumentSensitivityBadge level={sensitivityLevel} density={badgeDensity} />
        </div>
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.1em] mt-0.5',
            isCard
              ? 'text-muted-foreground/40 tracking-[0.12em] mt-1'
              : 'text-muted-foreground/30'
          )}
        >
          {type} {isCard ? '·' : '•'} {size}
        </p>
      </div>
    </div>
  );
};
