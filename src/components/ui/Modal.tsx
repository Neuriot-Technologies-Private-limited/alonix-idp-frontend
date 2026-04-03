import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  headerGradient?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'max-w-xl',
  maxHeight = 'max-h-[90vh]',
  headerGradient = true,
}) => {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    (
      <div
        className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close dialog"
          className="absolute inset-0 bg-scrim backdrop-blur-md"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative z-10 my-auto w-full flex flex-col overflow-hidden rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300',
            'bg-surface-lowest',
            'border-2 border-border/55 dark:border-border/50',
            'ring-1 ring-border/25 dark:ring-border/35',
            maxWidth,
            maxHeight
          )}
        >
        {/* Header: elevated “rail” vs deeper body */}
        <div
          className={cn(
            'relative flex items-center justify-between gap-3 px-5 py-3 sm:py-3.5',
            'border-b border-border/45 dark:border-border/40',
            headerGradient
              ? 'bg-gradient-to-b from-surface-high/95 via-surface-high/85 to-surface-high/70 dark:from-surface-high dark:via-surface-high/95 dark:to-surface-low'
              : 'bg-surface-high/90 dark:bg-surface-high'
          )}
        >
          {headerGradient ? (
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-transparent dark:from-primary/[0.1]"
              aria-hidden
            />
          ) : null}
          <div className="relative flex min-w-0 flex-1 items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-surface-lowest/60 text-primary shadow-inner dark:bg-surface-lowest/40">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold tracking-tight text-foreground">
                {title}
              </h2>
              {subtitle && (
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {subtitle}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'relative shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95',
              'border border-border/50 bg-surface-lowest/70 text-muted-foreground shadow-sm',
              'hover:border-border hover:bg-surface-lowest hover:text-foreground',
              'dark:border-border/55 dark:bg-surface-lowest/50 dark:hover:bg-surface-highest/40'
            )}
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-surface-lowest p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border/45 bg-surface-high/35 px-5 py-4 dark:border-border/40 dark:bg-surface-high/25">
            {footer}
          </div>
        )}
        </div>
      </div>
    ),
    document.body
  );
};
