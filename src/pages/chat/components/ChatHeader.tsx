import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

type ChatHeaderProps = {
  sidebarHidden: boolean;
  subtitle: string;
  onToggleSidebar: () => void;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ sidebarHidden, subtitle, onToggleSidebar }) => {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center border-b border-border/40 bg-surface-highest/10 py-2.5 backdrop-blur-md',
        sidebarHidden ? 'gap-2 px-2 sm:px-3' : 'gap-3 px-3 sm:px-4'
      )}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface-highest/20 text-muted-foreground/80 transition hover:border-border/90 hover:bg-surface-highest/30 hover:text-foreground"
        aria-label={sidebarHidden ? `Show chat list — ${subtitle}` : 'Hide chat list'}
      >
        {sidebarHidden ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>
      {!sidebarHidden && (
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">Assistant</h1>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      )}
    </header>
  );
};

