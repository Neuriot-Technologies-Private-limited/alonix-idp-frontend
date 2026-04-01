import React from 'react';
import { cn } from '../../utils/cn';
import { resolveCustodianDisplay } from '../../utils/custodianDisplay';

export interface DocumentCustodianProps {
  /** Raw uploader from API (email) or normalized `Unknown`. */
  uploader: string | undefined;
  nameByEmail: Map<string, string>;
  /** Table: single line; card: can wrap with label. */
  variant?: 'table' | 'card';
}

/**
 * Shows directory name when available; falls back to a readable handle from the email local-part.
 * Full email on hover (`title`) when it looks like an email.
 */
export const DocumentCustodian: React.FC<DocumentCustodianProps> = ({
  uploader,
  nameByEmail,
  variant = 'table',
}) => {
  const { label, email } = resolveCustodianDisplay(uploader, nameByEmail);
  const initial = (label || 'U').trim().charAt(0).toUpperCase();
  const tooltip = email && email.includes('@') ? email : undefined;

  const avatar = (
    <div
      className={cn(
        'rounded-md bg-surface-highest/5 flex items-center justify-center font-black text-muted-foreground/40 border border-border/5 shrink-0',
        variant === 'table' ? 'w-6 h-6 text-[10px]' : 'h-6 w-6 text-[10px]'
      )}
    >
      {initial}
    </div>
  );

  if (variant === 'card') {
    return (
      <span
        className="inline-flex items-center gap-2 font-semibold text-[11px] text-muted-foreground/70 min-w-0"
        title={tooltip}
      >
        {avatar}
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0" title={tooltip}>
      {avatar}
      <span className="text-[11px] font-bold text-foreground/60 truncate">{label}</span>
    </div>
  );
};
