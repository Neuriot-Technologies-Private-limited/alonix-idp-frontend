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

/** Theme token names — map to --color-sensitivity-* in index.css (not hardcoded palette). */
type SensitivityTone =
  | 'sensitivity-public'
  | 'sensitivity-internal'
  | 'sensitivity-confidential'
  | 'sensitivity-high'
  | 'sensitivity-restricted';

const LEVEL_TONE: Record<DocumentSensitivityLevel, SensitivityTone> = {
  PUBLIC: 'sensitivity-public',
  INTERNAL_USE: 'sensitivity-internal',
  CONFIDENTIAL: 'sensitivity-confidential',
  HIGHLY_CONFIDENTIAL: 'sensitivity-high',
  RESTRICTED: 'sensitivity-restricted',
};

/** Readable on dark document rows; uses theme variables via Tailwind semantic color utilities. */
const TONE_BADGE_CLASS: Record<SensitivityTone, string> = {
  'sensitivity-public':
    'border-sensitivity-public/45 bg-sensitivity-public/12 text-sensitivity-public dark:border-sensitivity-public/55 dark:bg-sensitivity-public/22 dark:text-sensitivity-public shadow-sm',
  'sensitivity-internal':
    'border-sensitivity-internal/45 bg-sensitivity-internal/12 text-sensitivity-internal dark:border-sensitivity-internal/55 dark:bg-sensitivity-internal/22 dark:text-sensitivity-internal shadow-sm',
  'sensitivity-confidential':
    'border-sensitivity-confidential/50 bg-sensitivity-confidential/14 text-sensitivity-confidential dark:border-sensitivity-confidential/65 dark:bg-sensitivity-confidential/28 dark:text-sensitivity-confidential shadow-sm',
  'sensitivity-high':
    'border-sensitivity-high/50 bg-sensitivity-high/14 text-sensitivity-high dark:border-sensitivity-high/60 dark:bg-sensitivity-high/26 dark:text-sensitivity-high shadow-sm',
  'sensitivity-restricted':
    'border-sensitivity-restricted/50 bg-sensitivity-restricted/14 text-sensitivity-restricted dark:border-sensitivity-restricted/60 dark:bg-sensitivity-restricted/26 dark:text-sensitivity-restricted shadow-sm',
};

const LEVEL_META: Record<DocumentSensitivityLevel, { Icon: typeof Globe; label: string }> = {
  PUBLIC: { Icon: Globe, label: 'Public' },
  INTERNAL_USE: { Icon: Building2, label: 'Internal' },
  CONFIDENTIAL: { Icon: Lock, label: 'Confidential' },
  HIGHLY_CONFIDENTIAL: { Icon: ShieldAlert, label: 'Hi-confidential' },
  RESTRICTED: { Icon: OctagonAlert, label: 'Restricted' },
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
  const tone = LEVEL_TONE[key];
  const { Icon, label } = LEVEL_META[key];
  const full = DOCUMENT_SENSITIVITY_LABELS[key];
  const hint = DOCUMENT_SENSITIVITY_HINTS[key];

  return (
    <span
      title={`${full} — ${hint}`}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1 rounded-md border font-black uppercase tracking-wider tabular-nums',
        density === 'compact' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        TONE_BADGE_CLASS[tone],
        className
      )}
    >
      <Icon
        className={cn('shrink-0', density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </span>
  );
};
