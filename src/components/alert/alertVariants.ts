import type { AlertVariant } from './types';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function variantIcon(variant: AlertVariant): LucideIcon {
  switch (variant) {
    case 'danger':
      return OctagonAlert;
    case 'warning':
      return AlertTriangle;
    case 'success':
      return CheckCircle2;
    case 'info':
      return Info;
    default:
      return Sparkles;
  }
}

export function variantStyles(variant: AlertVariant): {
  iconWrap: string;
  icon: string;
  accentLine: string;
  primaryBtn: string;
} {
  switch (variant) {
    case 'danger':
      return {
        iconWrap:
          'bg-destructive/12 border-destructive/30 text-destructive backdrop-blur-md shadow-glass',
        icon: 'text-destructive',
        accentLine: 'from-destructive/80 via-destructive/20 to-transparent',
        primaryBtn:
          'bg-destructive text-destructive-foreground hover:brightness-110 shadow-glass',
      };
    case 'warning':
      return {
        iconWrap:
          'bg-warning/10 border-warning/20 text-warning backdrop-blur-md shadow-glass',
        icon: 'text-warning',
        accentLine: 'from-warning/70 via-warning/15 to-transparent',
        primaryBtn:
          'bg-warning text-warning-foreground hover:bg-warning/90 shadow-glass',
      };
    case 'success':
      return {
        iconWrap:
          'bg-success/10 border-success/20 text-success backdrop-blur-md shadow-glass',
        icon: 'text-success',
        accentLine: 'from-success/60 via-success/10 to-transparent',
        primaryBtn:
          'bg-success text-success-foreground hover:bg-success/90 shadow-glass',
      };
    case 'info':
      return {
        iconWrap:
          'bg-primary/10 border-primary/28 text-primary backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]',
        icon: 'text-primary',
        accentLine: 'from-primary/70 via-primary/15 to-transparent',
        primaryBtn: 'bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_24px_-6px_rgba(173,198,255,0.4)]',
      };
    default:
      return {
        iconWrap:
          'bg-surface-highest/10 border-border/20 text-foreground backdrop-blur-md shadow-glass',
        icon: 'text-primary',
        accentLine: 'from-primary/50 via-primary/10 to-transparent',
        primaryBtn: 'bg-primary text-primary-foreground hover:brightness-110',
      };
  }
}
