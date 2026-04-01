import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  /** Show a clear control when non-empty (adds right padding when enabled). */
  showClear?: boolean;
  /** `aria-label` for the text field (defaults to placeholder or "Search"). */
  'aria-label'?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * App-wide search field: left icon, consistent surface + focus ring.
 * Use on list pages, modals, and filter bars.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value,
    onChange,
    placeholder = 'Search…',
    id,
    name,
    autoComplete = 'off',
    showClear = false,
    'aria-label': ariaLabel,
    className,
    inputClassName,
  },
  ref
) {
  const label = ariaLabel ?? placeholder ?? 'Search';
  return (
    <div className={cn('relative flex-1 group min-w-0 w-full', className)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors pointer-events-none"
        aria-hidden
      />
      <input
        ref={ref}
        id={id}
        name={name}
        type="search"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          'w-full bg-surface-highest/10 border border-border/20 dark:bg-surface-highest/5 dark:border-border/20 rounded-xl pl-10 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/35 min-h-[44px]',
          showClear ? 'pr-10' : 'pr-5',
          'py-3',
          inputClassName
        )}
      />
      {showClear && value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors p-0.5 rounded-md"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
});
