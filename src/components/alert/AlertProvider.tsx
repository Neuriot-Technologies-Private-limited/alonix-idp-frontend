import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { AlertOptions, ConfirmOptions } from './types';
import { variantIcon, variantStyles } from './alertVariants';

type Queued =
  | { id: number; kind: 'confirm'; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { id: number; kind: 'alert'; options: AlertOptions; resolve: () => void };

export interface AlertContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return ctx;
}

/** Optional: returns null outside provider (e.g. Storybook) instead of throwing */
export function useAlertOptional(): AlertContextValue | null {
  return useContext(AlertContext);
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Queued[]>([]);
  const nextId = useRef(1);
  const current = queue[0] ?? null;
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const flush = useCallback((fn: (item: Queued) => void) => {
    setQueue((q) => {
      const head = q[0];
      if (!head) return q;
      fn(head);
      return q.slice(1);
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      const id = nextId.current++;
      setQueue((q) => [...q, { id, kind: 'alert', options, resolve }]);
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = nextId.current++;
      setQueue((q) => [...q, { id, kind: 'confirm', options, resolve }]);
    });
  }, []);

  const value = useMemo<AlertContextValue>(() => ({ alert, confirm }), [alert, confirm]);

  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (current.kind === 'confirm') {
          flush((item) => {
            if (item.kind === 'confirm') item.resolve(false);
          });
        } else {
          flush((item) => {
            if (item.kind === 'alert') item.resolve();
          });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flush]);

  useEffect(() => {
    if (!current) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [current]);

  const portal = (
    <AnimatePresence mode="wait">
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[280] flex min-h-[100dvh] items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="presentation"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Dismiss"
            className={cn(
              'absolute inset-0',
              'bg-[radial-gradient(ellipse_120%_100%_at_50%_40%,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.28)_52%,rgba(0,0,0,0.15)_100%)]',
              'backdrop-blur-[14px] backdrop-saturate-150'
            )}
            onClick={() => {
              if (current.kind === 'confirm') {
                flush((item) => {
                  if (item.kind === 'confirm') item.resolve(false);
                });
              } else {
                flush((item) => {
                  if (item.kind === 'alert') item.resolve();
                });
              }
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={current.options.description != null && current.options.description !== '' ? descId : undefined}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'relative z-10 w-full max-w-[min(100%,420px)] overflow-hidden rounded-[28px]',
              'border border-border/20',
              'bg-gradient-to-br from-surface-highest/10 via-surface-highest/5 to-surface-highest/5',
              'backdrop-blur-[28px] backdrop-saturate-175',
              'shadow-[0_24px_64px_-16px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.14),inset_0_0_80px_-20px_rgba(173,198,255,0.06)]',
              'ring-1 ring-border/10'
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,transparent_42%,rgba(173,198,255,0.04)_100%)]"
              aria-hidden
            />
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-[0.85]',
                variantStyles(current.options.variant ?? 'default').accentLine
              )}
            />
            <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
              <div className="flex gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                    variantStyles(current.options.variant ?? 'default').iconWrap
                  )}
                >
                  {current.options.icon ? (
                    <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
                      {current.options.icon}
                    </span>
                  ) : (
                    (() => {
                      const V = variantIcon(current.options.variant ?? 'default');
                      return (
                        <V
                          className={cn('h-6 w-6', variantStyles(current.options.variant ?? 'default').icon)}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      );
                    })()
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <h2
                    id={titleId}
                    className="font-display text-lg font-black leading-snug tracking-tight text-foreground drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] sm:text-xl"
                  >
                    {current.options.title}
                  </h2>
                  {current.options.description != null && current.options.description !== '' && (
                    <div
                      id={descId}
                      className="text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground/90"
                    >
                      {current.options.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                {current.kind === 'confirm' && (
                  <button
                    type="button"
                    className={cn(
                      'rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground',
                      'border border-border/20 bg-surface-highest/5 backdrop-blur-md',
                      'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]',
                      'hover:bg-surface-highest/10 hover:text-foreground hover:border-border/25',
                      'transition-colors active:scale-[0.99]'
                    )}
                    onClick={() => {
                      flush((item) => {
                        if (item.kind === 'confirm') item.resolve(false);
                      });
                    }}
                  >
                    {current.options.cancelLabel ?? 'Cancel'}
                  </button>
                )}
                <button
                  ref={confirmBtnRef}
                  type="button"
                  className={cn(
                    'rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide transition-all active:scale-[0.99]',
                    variantStyles(current.options.variant ?? 'default').primaryBtn
                  )}
                  onClick={() => {
                    if (current.kind === 'confirm') {
                      flush((item) => {
                        if (item.kind === 'confirm') item.resolve(true);
                      });
                    } else {
                      flush((item) => {
                        if (item.kind === 'alert') item.resolve();
                      });
                    }
                  }}
                >
                  {current.kind === 'alert'
                    ? current.options.confirmLabel ?? 'Got it'
                    : current.options.confirmLabel ?? 'Continue'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' ? createPortal(portal, document.body) : null}
    </AlertContext.Provider>
  );
};
