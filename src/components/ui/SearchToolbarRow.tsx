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
  <section className={cn('flex flex-col lg:flex-row gap-3 lg:items-center', className)}>
    <SearchInput {...search} />
    {end ? (
      <div className="w-full lg:w-auto overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin] shrink-0">
        {end}
      </div>
    ) : null}
  </section>
);
