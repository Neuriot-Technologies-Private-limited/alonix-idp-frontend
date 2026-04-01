import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Variants:
 * - "page"  : Full‑screen overlay (initial app load / page transitions)
 * - "section": Fills its parent container (per‑tab / card loading)
 * - "inline": Tiny inline spinner beside text
 */
type LoaderVariant = 'page' | 'section' | 'inline';

interface LoaderProps {
  variant?: LoaderVariant;
  label?: string;
  className?: string;
}

// ─── Animated logo ring ──────────────────────────────────────────────────────
const SpinnerRing: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    className="animate-spin"
    style={{ animationDuration: '900ms' }}
  >
    {/* Track */}
    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeOpacity="0.08" strokeWidth="3" />
    {/* Arc */}
    <circle
      cx="20"
      cy="20"
      r="16"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="60 40"
      className="text-primary"
    />
  </svg>
);

// ─── Pulsing dots (used inside section / page variants as secondary indicator) ─
const PulsingDots: React.FC = () => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1 h-1 rounded-full bg-primary/60 animate-bounce"
        style={{ animationDelay: `${i * 100}ms`, animationDuration: '700ms' }}
      />
    ))}
  </div>
);

// ─── Page loader (full‑screen) ────────────────────────────────────────────────
const PageLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl gap-6">
    {/* Ambient glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
    </div>

    <div className="relative flex flex-col items-center gap-4">
      {/* Outer ring decoration */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <SpinnerRing size={32} />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          {label ?? 'Loading'}
        </p>
        <PulsingDots />
      </div>
    </div>
  </div>
);

// ─── Section loader (fills parent, min-height so it's visible) ───────────────
const SectionLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 w-full text-muted-foreground/40">
    <SpinnerRing size={36} />
    {label && (
      <p className="text-[9px] font-black uppercase tracking-[0.3em]">{label}</p>
    )}
    <PulsingDots />
  </div>
);

// ─── Inline loader ─────────────────────────────────────────────────────────────
const InlineLoader: React.FC<{ label?: string; className?: string }> = ({ label, className }) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <SpinnerRing size={14} />
    {label && <span className="text-[10px] font-bold text-muted-foreground/60">{label}</span>}
  </span>
);

// ─── Public export ─────────────────────────────────────────────────────────────
export const Loader: React.FC<LoaderProps> = ({ variant = 'section', label, className }) => {
  if (variant === 'page') return <PageLoader label={label} />;
  if (variant === 'inline') return <InlineLoader label={label} className={className} />;
  return <SectionLoader label={label} />;
};

export default Loader;
