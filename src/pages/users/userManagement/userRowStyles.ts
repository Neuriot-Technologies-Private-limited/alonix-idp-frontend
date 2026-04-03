import { cn } from '../../../utils/cn';

/** Inline icon actions — same baseline as documents pipeline row. */
export const rowActionBtn =
  'shrink-0 h-9 w-9 p-0 rounded-lg border flex items-center justify-center transition-all touch-manipulation active:scale-95';

export const rowActionVariants = {
  neutral: cn(
    rowActionBtn,
    'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-primary/35 hover:bg-primary/10 hover:text-primary'
  ),
  dangerSoft: cn(
    rowActionBtn,
    'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive'
  ),
  dangerStrong: cn(
    rowActionBtn,
    'border-border/10 bg-surface-highest/5 text-muted-foreground/60 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
  ),
} as const;
