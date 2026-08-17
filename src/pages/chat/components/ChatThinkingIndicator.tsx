import React from 'react';

interface ChatThinkingIndicatorProps {
  label: string;
  question?: string | null;
  questionLabel?: string;
  answerLabel?: string;
}

export const ChatThinkingIndicator: React.FC<ChatThinkingIndicatorProps> = ({
  label,
  question,
  questionLabel,
  answerLabel,
}) => (
  <div
    className="mb-7 h-auto rounded-2xl border border-border/10 bg-surface-highest/10 shadow-xl shadow-glass backdrop-blur-sm sm:mb-8"
    aria-live="polite"
  >
    {question ? (
      <div className="border-b border-border/10 bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {questionLabel}
        </div>
        <div className="text-[15px] font-medium leading-relaxed text-foreground">{question}</div>
      </div>
    ) : null}
    <div className="bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {question ? answerLabel || label : label}
      </div>
      <div className="flex items-center gap-2">
        {question ? (
          <span className="text-[15px] leading-relaxed text-muted-foreground/80">{label}…</span>
        ) : null}
        <span className="flex items-center gap-1" aria-label={label}>
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:0ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:150ms]" />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  </div>
);
