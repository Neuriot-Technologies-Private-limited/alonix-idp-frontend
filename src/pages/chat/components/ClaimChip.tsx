import React from 'react';
import { Hash } from 'lucide-react';
import { cn } from '../../../utils/cn';

type ClaimChipProps = {
  claimId: string;
  onClick?: (claimId: string) => void;
  className?: string;
  density?: 'comfortable' | 'compact';
};

export const ClaimChip: React.FC<ClaimChipProps> = ({
  claimId,
  onClick,
  className,
  density = 'comfortable',
}) => {
  const label = `# ${claimId}`;
  const compact = density === 'compact';
  const chipClass = cn(
    'inline-flex max-w-[8.5rem] shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary',
    compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]',
    className
  );
  const iconClass = cn('shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3 w-3');

  if (!onClick) {
    return (
      <span className={chipClass} title={label} aria-label={`Claim ID ${claimId}`}>
        <Hash className={iconClass} aria-hidden />
        <span className="truncate">{claimId}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cn(chipClass, 'transition hover:bg-primary/20 hover:border-primary/45')}
      aria-label={`Filter chat by claim ${claimId}`}
      title={label}
      onClick={() => onClick(claimId)}
    >
      <Hash className={iconClass} aria-hidden />
      <span className="truncate">{claimId}</span>
    </button>
  );
};
