import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { FileIcon } from './DocumentPrimitives';

export interface DocumentAssetIdentityProps {
  fileName: string;
  type: string;
  size: string;
  /** Slightly larger icon area for mobile cards. */
  density?: 'table' | 'card';
  onFileNameClick?: () => void;
  canOpenFile?: boolean;
  isOpening?: boolean;
}

export const DocumentAssetIdentity: React.FC<DocumentAssetIdentityProps> = ({
  fileName,
  type,
  size,
  density = 'table',
  onFileNameClick,
  canOpenFile = false,
  isOpening = false,
}) => {
  const isCard = density === 'card';
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
        {canOpenFile && onFileNameClick ? (
          <button
            type="button"
            onClick={onFileNameClick}
            className={cn(
              'text-[13px] font-bold text-foreground truncate text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm inline-flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait',
              !isCard && 'group-hover/row:text-primary transition-colors cursor-pointer',
              isCard && 'leading-snug break-words cursor-pointer'
            )}
            title="Open document"
            disabled={isOpening}
          >
            {isOpening ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
            {fileName}
          </button>
        ) : (
          <p
            className={cn(
              'text-[13px] font-bold text-foreground truncate',
              !isCard && 'group-hover/row:text-primary transition-colors',
              isCard && 'leading-snug break-words'
            )}
          >
            {fileName}
          </p>
        )}
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
