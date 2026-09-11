import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Hash, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils/cn';

type ClaimIdComboboxProps = {
  claimIds: string[];
  value: string | null;
  onChange: (claimId: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
};

const MENU_Z = 220;
const NONE = '';

export const ClaimIdCombobox: React.FC<ClaimIdComboboxProps> = ({
  claimIds,
  value,
  onChange,
  disabled = false,
  loading = false,
}) => {
  const { t } = useTranslation('chat');
  const uid = useId();
  const listboxId = `claim-id-${uid}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxH: number;
    openUp: boolean;
  } | null>(null);

  const selected = (value || '').trim();
  const needle = filter.trim().toLowerCase();

  const options = useMemo(() => {
    const ids = [...claimIds];
    if (selected && !ids.includes(selected)) ids.unshift(selected);
    const filtered = ids.filter((id) => id && (!needle || id.toLowerCase().includes(needle)));
    return [{ value: NONE, label: t('claimIdAll') }, ...filtered.map((id) => ({ value: id, label: id }))];
  }, [claimIds, needle, selected, t]);

  const displayLabel = selected || t('claimIdPlaceholder');

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const preferredMax = 280;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxH = Math.min(preferredMax, openUp ? spaceAbove - 4 : spaceBelow - 4);
    setCoords({
      left: rect.left,
      width: Math.max(rect.width, 220),
      maxH: Math.max(140, maxH),
      openUp,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4, top: undefined }
        : { top: rect.bottom + 4, bottom: undefined }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

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
    const t = window.requestAnimationFrame(() => filterRef.current?.focus());
    return () => window.cancelAnimationFrame(t);
  }, [open]);

  const pick = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value ? opt.value : null);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
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
        aria-label={t('claimIdPlaceholder')}
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
          'flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-surface-lowest py-1 shadow-2xl shadow-black/20 ring-1 ring-border/20',
          'animate-in fade-in zoom-in-95 duration-150 dark:bg-surface-low'
        )}
      >
        <div className="relative mx-1.5 mb-1 mt-0.5">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50"
            aria-hidden
          />
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onMenuKeyDown}
            placeholder={t('claimIdFilterPlaceholder')}
            aria-label={t('claimIdFilterPlaceholder')}
            className="h-8 w-full rounded-lg border border-border/40 bg-surface-highest/20 pl-8 pr-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <ul className="custom-scrollbar min-h-0 flex-1 overflow-y-auto py-0.5">
          {options.map((opt, idx) => {
            const isSelected = (opt.value || '') === selected;
            const isHi = idx === highlight;
            return (
              <li key={opt.value || 'all'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors',
                    isHi && 'bg-primary/10 text-foreground',
                    !isHi && 'hover:bg-surface-highest/50'
                  )}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => pick(idx)}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border/50',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-transparent bg-transparent'
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate font-medium', !opt.value && 'text-muted-foreground')}>
                    {opt.label}
                  </span>
                </button>
              </li>
            );
          })}
          {claimIds.length === 0 && !loading ? (
            <li className="px-3 py-2 text-[12px] text-muted-foreground">{t('claimIdEmpty')}</li>
          ) : null}
          {claimIds.length > 0 && needle && options.length === 1 ? (
            <li className="px-3 py-2 text-[12px] text-muted-foreground">{t('claimIdNoMatch')}</li>
          ) : null}
        </ul>
      </div>
    ) : null;

  return (
    <div className="relative flex h-10 w-[7.5rem] shrink-0 items-center rounded-xl hover:bg-surface-highest/30 sm:w-[9.75rem]">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-label={t('claimIdPlaceholder')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${listboxId}-listbox` : undefined}
        className={cn(
          'flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2 text-left text-[12px] font-medium transition-colors sm:px-2.5',
          'text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
          'disabled:cursor-not-allowed disabled:opacity-45',
          open && 'bg-surface-highest/25'
        )}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            setFilter('');
            setHighlight(0);
          }
          setOpen((wasOpen) => !wasOpen);
        }}
      >
        <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted-foreground/70')}>
          {loading && !selected ? t('claimIdLoading') : displayLabel}
        </span>
        {!selected ? (
          <ChevronDown
            className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        ) : null}
      </button>
      {selected && !disabled ? (
        <button
          type="button"
          className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-surface-highest/40 hover:text-foreground"
          aria-label={t('claimIdClear')}
          onClick={() => onChange(null)}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
};
