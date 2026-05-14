import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ThemedSelectOption {
  value: string;
  label: string;
  /** Secondary line in the dropdown list */
  description?: string;
  disabled?: boolean;
}

export interface ThemedSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  /** When `value` is empty or missing from options */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  listClassName?: string;
  /** e.g. folder icon — sits inside trigger on the left */
  leftIcon?: React.ReactNode;
  'aria-label'?: string;
  /** Optional name for form usage */
  name?: string;
}

const MENU_Z = 220;

/**
 * Theme-aware custom select: uses design tokens (`border`, `surface-*`, `ring`, `primary`)
 * so light/dark stay consistent. Menu is portaled with `position: fixed` for use inside modals.
 */
export const ThemedSelect: React.FC<ThemedSelectProps> = ({
  id: idProp,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  className,
  triggerClassName,
  listClassName,
  leftIcon,
  'aria-label': ariaLabel,
  name,
}) => {
  const uid = useId();
  const listboxId = idProp ?? `themed-select-${uid}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxH: number;
    openUp: boolean;
  } | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value && !o.disabled) ?? null,
    [options, value]
  );

  const displayLabel = selected?.label ?? placeholder;

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const preferredMax = 260;
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxH = Math.min(preferredMax, openUp ? spaceAbove - 4 : spaceBelow - 4);
    setCoords({
      left: rect.left,
      width: rect.width,
      maxH: Math.max(120, maxH),
      openUp,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4, top: undefined }
        : { top: rect.bottom + 4, bottom: undefined }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const idx = options.findIndex((o) => o.value === value && !o.disabled);
    const first = options.findIndex((o) => !o.disabled);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- highlight must match value when opening portaled listbox (with measured layout)
    setHighlight(idx >= 0 ? idx : first >= 0 ? first : 0);
  }, [open, options, value, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.requestAnimationFrame(() => {
      menuRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open]);

  const pick = (idx: number) => {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      }
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => {
        let n = h + 1;
        while (n < options.length && options[n]?.disabled) n++;
        return n < options.length ? n : h;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        let n = h - 1;
        while (n >= 0 && options[n]?.disabled) n--;
        return n >= 0 ? n : h;
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = options.findIndex((o) => !o.disabled);
      if (first >= 0) setHighlight(first);
    } else if (e.key === 'End') {
      e.preventDefault();
      let last = -1;
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          last = i;
          break;
        }
      }
      if (last >= 0) setHighlight(last);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(highlight);
    }
  };

  const menu =
    open && coords ? (
      <div
        ref={menuRef}
        id={`${listboxId}-listbox`}
        role="listbox"
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        style={{
          position: 'fixed',
          zIndex: MENU_Z,
          left: coords.left,
          width: coords.width,
          ...(coords.openUp
            ? { bottom: coords.bottom, maxHeight: coords.maxH }
            : { top: coords.top, maxHeight: coords.maxH }),
        }}
        className={cn(
          'flex min-h-0 flex-col overflow-hidden rounded-xl border-2 border-border/50 bg-surface-lowest py-1 shadow-2xl shadow-black/15 ring-1 ring-border/20 dark:border-border/55 dark:bg-surface-low dark:shadow-black/40 dark:ring-border/25',
          'animate-in fade-in zoom-in-95 duration-150',
          listClassName
        )}
      >
        <ul className="custom-scrollbar min-h-0 flex-1 overflow-y-auto py-0.5">
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHi = idx === highlight;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  id={`${listboxId}-opt-${opt.value}`}
                  className={cn(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] transition-colors',
                    opt.disabled && 'cursor-not-allowed opacity-40',
                    !opt.disabled && isHi && 'bg-primary/10 text-foreground',
                    !opt.disabled && !isHi && 'hover:bg-surface-highest/50 dark:hover:bg-surface-highest/30'
                  )}
                  onMouseEnter={() => !opt.disabled && setHighlight(idx)}
                  onClick={() => !opt.disabled && pick(idx)}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border/50',
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent bg-transparent'
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{opt.label}</span>
                    {opt.description ? (
                      <span className="mt-0.5 block text-[10px] font-medium leading-snug text-muted-foreground/80">
                        {opt.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  if (options.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'flex min-h-[2.625rem] items-center rounded-xl border-2 border-dashed border-border/40 px-3 py-2 text-[12px] text-muted-foreground',
            triggerClassName
          )}
        >
          No options
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={listboxId}
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${listboxId}-listbox` : undefined}
        className={cn(
          'flex w-full min-h-[2.625rem] items-center gap-2 rounded-xl border-2 border-border/45 bg-surface-lowest/95 px-3 py-2 text-left text-[12px] font-medium text-foreground shadow-sm transition-[border-color,box-shadow,background-color]',
          'hover:border-border hover:bg-surface-lowest',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-45 dark:border-border/50 dark:bg-surface-lowest/80',
          open && 'border-primary/50 ring-2 ring-ring/20',
          triggerClassName
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        {leftIcon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/35 bg-surface-highest/20 text-muted-foreground dark:border-border/40 dark:bg-surface-highest/25">
            {leftIcon}
          </span>
        ) : null}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted-foreground')}>{displayLabel}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
};
