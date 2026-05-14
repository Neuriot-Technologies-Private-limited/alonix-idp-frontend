import React from 'react';
import { cn } from '../../utils/cn';
import { SearchInput, type SearchInputProps } from './SearchInput';

export interface SearchToolbarRowProps {
  /** Props forwarded to {@link SearchInput} (value / onChange / placeholder / etc.). */
  search: SearchInputProps;
  /** Filters, tabs, or chips rendered beside the field (scrolls horizontally on small screens). */
  end?: React.ReactNode;
  className?: string;
}

/**
 * Standard layout: full-width search on small screens, search + trailing controls on large screens.
 */
export const SearchToolbarRow: React.FC<SearchToolbarRowProps> = ({ search, end, className }) => (
  <section className={cn('flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center', className)}>
    <div className="min-w-0 w-full flex-1">
      <SearchInput {...search} />
    </div>
    {end ? (
      <div className="w-full shrink-0 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin] lg:w-auto">
        {end}
      </div>
    ) : null}
  </section>
);
