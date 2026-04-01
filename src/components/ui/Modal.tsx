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
            'relative z-10 my-auto w-full bg-surface-lowest border border-border/20 dark:border-border/10 rounded-[32px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden',
            maxWidth,
            maxHeight
          )}
        >
        {/* Header */}
        <div 
          className={cn(
            "flex items-start justify-between p-5 border-b border-border/10 relative",
            headerGradient && "bg-gradient-to-br from-primary/5 to-transparent"
          )}
        >
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-11 h-11 rounded-xl bg-surface-highest/10 border border-border/20 flex items-center justify-center text-primary shadow-inner">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-black text-foreground font-display tracking-tight truncate">{title}</h2>
              {subtitle && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">{subtitle}</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-highest/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-highest/20 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-border/10 bg-surface-highest/10">
            {footer}
          </div>
        )}
        </div>
      </div>
    ),
    document.body
  );
};
