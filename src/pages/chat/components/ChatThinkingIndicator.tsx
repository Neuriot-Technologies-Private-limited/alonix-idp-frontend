import React from 'react';

interface ChatThinkingIndicatorProps {
  label: string;
}

export const ChatThinkingIndicator: React.FC<ChatThinkingIndicatorProps> = ({ label }) => (
  <div className="mb-6 text-left">
    <div className="rounded-2xl border border-border/10 bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:0ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:150ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);
