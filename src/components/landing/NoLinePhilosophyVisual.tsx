import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import dashboardShot from '../../assets/landing/product-dashboard.png';
import chatShot from '../../assets/landing/product-chat.png';

const VOLUME_BARS = [38, 52, 44, 96, 58, 48, 72, 65];

type UiCardProps = {
  src: string;
  alt: string;
  path: string;
  className?: string;
  delay?: number;
};

const UiCard: React.FC<UiCardProps> = ({ src, alt, path, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={cn(
      'overflow-hidden rounded-2xl bg-[#070b14] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]',
      className,
    )}
  >
    <div className="flex items-center gap-2 border-b border-white/[0.04] bg-[#0c1220]/90 px-3 py-2">
      <div className="flex gap-1" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-red-500/60" />
        <span className="h-2 w-2 rounded-full bg-amber-400/60" />
        <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
      </div>
      <span className="mx-auto truncate font-mono text-[9px] text-white/40">{path}</span>
    </div>
    <div className="relative aspect-[16/9] overflow-hidden bg-[#070b14]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top object-left"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-transparent to-transparent" />
    </div>
  </motion.div>
);

export const NoLinePhilosophyVisual: React.FC = () => (
  <div className="relative mx-auto w-full max-w-xl min-h-[440px] md:min-h-[480px]">
    {/* Tonal depth layers — no hard borders */}
    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-surface-high/50 via-surface-high/25 to-primary/[0.07]" />
    <div className="absolute inset-3 rounded-[1.75rem] bg-surface-high/20" />
    <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary/15 blur-[70px]" />
    <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-violet/10 blur-[60px]" />

    {/* Stacked product UI */}
    <UiCard
      src={dashboardShot}
      alt="Alonix IDP dashboard — operational metrics and activity"
      path="app.alonix.ai/dashboard"
      className="absolute left-0 top-4 z-10 w-[78%]"
      delay={0.1}
    />
    <UiCard
      src={chatShot}
      alt="Alonix IDP chat — grounded document answers"
      path="app.alonix.ai/chat"
      className="absolute right-0 top-[38%] z-20 w-[52%]"
      delay={0.25}
    />

    {/* Floating insight chips */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="absolute left-6 top-[52%] z-30 flex items-center gap-2 rounded-full bg-surface-highest/90 px-3 py-1.5 shadow-lg backdrop-blur-md ring-1 ring-white/[0.08]"
    >
      <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/90">
        Tonal layers
      </span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="absolute right-4 top-[18%] z-30 flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1.5 text-primary-foreground shadow-[0_8px_32px_-4px_rgba(173,198,255,0.45)]"
    >
      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
      <span className="text-[10px] font-bold uppercase tracking-wider">2.4× retrieval</span>
    </motion.div>

    {/* Performance panel — bottom */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="absolute bottom-0 left-0 right-0 z-40 rounded-2xl bg-surface-high/55 p-5 backdrop-blur-xl ring-1 ring-white/[0.05]"
    >
      <div className="mb-4 flex items-end gap-1.5 h-28">
        {VOLUME_BARS.map((h, i) => {
          const peak = h === 96;
          return (
            <div key={i} className="relative flex flex-1 flex-col items-center justify-end h-full group">
              {peak && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute -top-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1 text-[9px] font-bold text-primary-foreground shadow-lg"
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  1-glance Performance
                </motion.div>
              )}
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(
                  'w-full min-h-[4px] rounded-t-lg transition-colors',
                  peak
                    ? 'bg-gradient-to-t from-primary/80 to-primary shadow-[0_-6px_20px_-2px_rgba(173,198,255,0.35)]'
                    : 'bg-surface-highest/80 group-hover:bg-primary/30',
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
        <span>Processing volume</span>
        <span>Intelligence level</span>
      </div>
    </motion.div>
  </div>
);

export default NoLinePhilosophyVisual;
