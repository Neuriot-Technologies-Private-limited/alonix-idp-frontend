import React from 'react';
import { Building2, Globe, Lock, OctagonAlert, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  DOCUMENT_SENSITIVITY_HINTS,
  DOCUMENT_SENSITIVITY_LABELS,
  DOCUMENT_SENSITIVITY_LEVELS,
  type DocumentSensitivityLevel,
} from '../../constants/documentSensitivity';

function normalizeLevel(raw: string | null | undefined): DocumentSensitivityLevel {
  const u = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');
  if ((DOCUMENT_SENSITIVITY_LEVELS as readonly string[]).includes(u)) {
    return u as DocumentSensitivityLevel;
  }
  return 'INTERNAL_USE';
}

const LEVEL_STYLE: Record<
  DocumentSensitivityLevel,
  { Icon: typeof Globe; ring: string; label: string }
> = {
  PUBLIC: {
    Icon: Globe,
    ring: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    label: 'Public',
  },
  INTERNAL_USE: {
    Icon: Building2,
    ring: 'border-sky-500/35 bg-sky-500/10 text-sky-900 dark:text-sky-200',
    label: 'Internal',
  },
  CONFIDENTIAL: {
    Icon: Lock,
    ring: 'border-amber-500/40 bg-amber-500/12 text-amber-950 dark:text-amber-200',
    label: 'Confidential',
  },
  HIGHLY_CONFIDENTIAL: {
    Icon: ShieldAlert,
    ring: 'border-orange-500/45 bg-orange-500/12 text-orange-950 dark:text-orange-200',
    label: 'Hi-confidential',
  },
  RESTRICTED: {
    Icon: OctagonAlert,
    ring: 'border-rose-600/45 bg-rose-600/12 text-rose-950 dark:text-rose-200',
    label: 'Restricted',
  },
};

export interface DocumentSensitivityBadgeProps {
  level: string | null | undefined;
  /** Tighter padding for dense table rows */
  density?: 'comfortable' | 'compact';
  className?: string;
}

/**
 * Icon + short label for document sensitivity; full description in `title` for hover.
 */
export const DocumentSensitivityBadge: React.FC<DocumentSensitivityBadgeProps> = ({
  level,
  density = 'comfortable',
  className,
}) => {
  const key = normalizeLevel(level);
  const { Icon, ring, label } = LEVEL_STYLE[key];
  const full = DOCUMENT_SENSITIVITY_LABELS[key];
  const hint = DOCUMENT_SENSITIVITY_HINTS[key];

  return (
    <span
      title={`${full} — ${hint}`}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1 rounded-md border font-black uppercase tracking-wider tabular-nums',
        density === 'compact' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]',
        ring,
        className
      )}
    >
      <Icon className={cn('shrink-0 opacity-90', density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
};
