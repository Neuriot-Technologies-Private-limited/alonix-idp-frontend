import React from 'react';
import { cn } from '../../utils/cn';

export type ProductScreenshotFrameProps = {
  src: string;
  alt: string;
  /** Shown in faux browser URL bar */
  pathLabel?: string;
  className?: string;
  priority?: boolean;
  /** Tailwind aspect-* class for crop (hides PDF/scroll whitespace) */
  imageAspect?: string;
  /** object-position utility, e.g. object-top */
  imagePosition?: string;
};

export const ProductScreenshotFrame: React.FC<ProductScreenshotFrameProps> = ({
  src,
  alt,
  pathLabel = 'app.alonix.ai',
  className,
  priority = false,
  imageAspect = 'aspect-[16/10]',
  imagePosition = 'object-top',
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-border/15 bg-[#070b14] shadow-2xl shadow-black/30',
      className,
    )}
  >
    <div className="flex items-center gap-3 border-b border-white/5 bg-[#0c1220] px-4 py-3">
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
      </div>
      <div className="mx-auto flex h-7 min-w-0 max-w-md flex-1 items-center justify-center rounded-md border border-white/10 bg-black/30 px-3 font-mono text-[10px] text-white/50 truncate">
        {pathLabel}
      </div>
    </div>
    <div className={cn('relative w-full overflow-hidden bg-[#070b14]', imageAspect)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('absolute inset-0 h-full w-full object-cover', imagePosition)}
      />
    </div>
  </div>
);

export default ProductScreenshotFrame;
