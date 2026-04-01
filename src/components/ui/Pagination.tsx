import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + showMax - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - showMax + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 py-4 bg-surface-highest/5 border-t border-border/5 backdrop-blur-xl", className)}>
      <div className="flex items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
          Showing <span className="text-foreground/60">{startItem}-{endItem}</span> of <span className="text-foreground/60">{totalItems}</span>
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 min-w-0 [scrollbar-width:thin]">
        {/* First/Prev */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-surface-highest/5 border border-border/5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-surface-highest/5 transition-all"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-surface-highest/5 border border-border/5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-surface-highest/5 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-[10px] font-black transition-all border",
                currentPage === p
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-surface-highest/5 border-border/5 text-muted-foreground/40 hover:text-foreground hover:bg-surface-highest/10"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Next/Last */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-surface-highest/5 border border-border/5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-surface-highest/5 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-surface-highest/5 border border-border/5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-surface-highest/5 transition-all"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
