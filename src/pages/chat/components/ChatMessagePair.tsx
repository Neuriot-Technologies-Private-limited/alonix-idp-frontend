import React from 'react';
import { cn } from '../../../utils/cn';
import type { ConversationPair, NormSource } from '../types/chatConversation';
import { parseHtmlWithSources } from '../utils/chatSources';

interface ChatMessagePairProps {
  pair: ConversationPair;
  questionLabel: string;
  answerLabel: string;
  clarificationLabel: string;
  onSourceClick: (e: React.MouseEvent, source: NormSource) => Promise<void>;
}

export const ChatMessagePair: React.FC<ChatMessagePairProps> = ({
  pair,
  questionLabel,
  answerLabel,
  clarificationLabel,
  onSourceClick,
}) => {
  const { user: uq, ai } = pair;
  const isClarification = ai.responseKind === 'clarification';
  const html =
    ai.sourcesMap && Object.keys(ai.sourcesMap).length > 0 && ai.rawAnswer
      ? parseHtmlWithSources(ai.text, ai.sourcesMap)
      : ai.text;

  return (
    <div
      className={cn(
        'mb-7 h-auto rounded-2xl border bg-surface-highest/10 shadow-xl shadow-glass backdrop-blur-sm sm:mb-8',
        isClarification ? 'border-amber-500/35 ring-1 ring-amber-500/15' : 'border-border/10'
      )}
    >
      <div className="border-b border-border/10 bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {questionLabel}
        </div>
        <div className="text-[15px] font-medium leading-relaxed text-foreground">{uq.text}</div>
      </div>
      <div className="bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
        <div
          className={cn(
            'mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]',
            isClarification ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
          )}
        >
          {isClarification ? clarificationLabel : answerLabel}
        </div>
        <div
          className="mt-1 space-y-1 overflow-visible break-words whitespace-pre-wrap pb-1 text-[15px] leading-[1.65] text-muted-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-surface-highest/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-surface-highest/5 [&_pre]:p-4 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_th]:border [&_th]:border-border/60 [&_th]:bg-surface-highest/10 [&_th]:px-3 [&_th]:py-2 [&_tr:nth-child(even)]:bg-surface-highest/5"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={async (e) => {
            const pill = (e.target as HTMLElement).closest('[data-source-key]');
            if (!pill) return;
            e.preventDefault();
            e.stopPropagation();
            const key = pill.getAttribute('data-source-key') || '';
            const source = ai.sourcesMap[key];
            if (!source) return;
            const prevText = pill.textContent;
            pill.innerHTML =
              '<span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border/30 border-t-primary" aria-label="Loading"></span>';
            try {
              await onSourceClick(e, source);
            } finally {
              pill.textContent = prevText || '↗';
            }
          }}
          onMouseOver={(e) => {
            const pill = (e.target as HTMLElement).closest('[data-source-key]');
            if (!pill || pill.hasAttribute('title-set')) return;
            const title = pill.getAttribute('data-source-title') || '';
            const page = pill.getAttribute('data-source-page');
            const fp = pill.getAttribute('data-source-filepath');
            let tip = title;
            if (page) tip += ` | Page ${page}`;
            if (fp) tip += ` | ${fp}`;
            pill.setAttribute('title', tip);
            pill.setAttribute('title-set', 'true');
          }}
        />
      </div>
    </div>
  );
};
