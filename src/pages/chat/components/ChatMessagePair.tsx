import React from 'react';
import { cn } from '../../../utils/cn';
import type { ConversationPair, NormSource } from '../types/chatConversation';
import { parseHtmlWithSources } from '../utils/chatSources';
import { highlightClaimIdsInHtml, normalizeClaimIds } from '../utils/claimChips';
import { clarificationOptionLetter } from '../utils/clarificationOptionLetter';
import { ClaimChip } from './ClaimChip';

interface ChatMessagePairProps {
  pair: ConversationPair;
  questionLabel: string;
  answerLabel: string;
  clarificationLabel: string;
  onSourceClick: (e: React.MouseEvent, source: NormSource) => Promise<void>;
  clarificationOptionsInteractive?: boolean;
  onClarificationOptionSelect?: (option: string) => void;
  onClarificationCustomInput?: () => void;
  clarificationOptionsDisabled?: boolean;
  onClaimIdClick?: (claimId: string) => void;
}

function ClarificationOptionRow({
  letter,
  label,
  description,
  interactive,
  disabled,
  onClick,
}: {
  letter: string;
  label: string;
  description?: string;
  interactive: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const clickable = interactive && !disabled;
  return (
    <button
      type="button"
      role="option"
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
        clickable
          ? 'cursor-pointer border-amber-500/35 bg-amber-500/5 hover:border-amber-500/55 hover:bg-amber-500/12'
          : 'cursor-default border-border/40 bg-surface-highest/10'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
          clickable
            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
            : 'bg-surface-highest/20 text-muted-foreground'
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-medium leading-snug',
            clickable ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export const ChatMessagePair = React.memo(function ChatMessagePair({
  pair,
  questionLabel,
  answerLabel,
  clarificationLabel,
  onSourceClick,
  clarificationOptionsInteractive = false,
  onClarificationOptionSelect,
  onClarificationCustomInput,
  clarificationOptionsDisabled = false,
  onClaimIdClick,
}: ChatMessagePairProps) {
  const { user: uq, ai } = pair;
  const isClarification = ai.responseKind === 'clarification';
  const options = ai.clarificationOptions ?? [];
  const showOptions = isClarification;
  const claimIds = normalizeClaimIds([uq.claimId, ...(ai.claimIds ?? [])]);
  const sourcedHtml = parseHtmlWithSources(ai.text, ai.sourcesMap || {});
  const html = highlightClaimIdsInHtml(sourcedHtml, claimIds);

  return (
    <div
      className={cn(
        'mb-7 h-auto rounded-2xl border bg-surface-highest/10 shadow-xl shadow-glass backdrop-blur-sm sm:mb-8',
        isClarification ? 'border-amber-500/35 ring-1 ring-amber-500/15' : 'border-border/10'
      )}
    >
      <div className="border-b border-border/10 bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {questionLabel}
          </div>
          {uq.claimId ? <ClaimChip claimId={uq.claimId} onClick={onClaimIdClick} /> : null}
        </div>
        <div className="text-[15px] font-medium leading-relaxed text-foreground">{uq.text}</div>
      </div>
      <div className="bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
        <div
          className={cn(
            'mb-2 flex flex-wrap items-center gap-2',
            isClarification ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            {isClarification ? clarificationLabel : answerLabel}
          </span>
          {!isClarification
            ? (ai.claimIds ?? []).map((id) => (
                <ClaimChip key={id} claimId={id} onClick={onClaimIdClick} />
              ))
            : null}
        </div>
        <div
          className="mt-1 space-y-1 overflow-visible break-words whitespace-pre-wrap pb-1 text-[15px] leading-[1.65] text-muted-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-surface-highest/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-surface-highest/5 [&_pre]:p-4 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_th]:border [&_th]:border-border/60 [&_th]:bg-surface-highest/10 [&_th]:px-3 [&_th]:py-2 [&_tr:nth-child(even)]:bg-surface-highest/5"
          // Sanitized HTML from mdToHtml / parseHtmlWithSources
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={async (e) => {
            const claimPill = (e.target as HTMLElement).closest('[data-claim-id]');
            if (claimPill) {
              e.preventDefault();
              e.stopPropagation();
              const claimId = claimPill.getAttribute('data-claim-id') || '';
              if (claimId) onClaimIdClick?.(claimId);
              return;
            }
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
        {showOptions && (
          <div
            className="mt-4 flex flex-col gap-2"
            role="listbox"
            aria-label="Clarification options"
          >
            {options.map((option, index) => (
              <ClarificationOptionRow
                key={option}
                letter={clarificationOptionLetter(index)}
                label={option}
                interactive={clarificationOptionsInteractive}
                disabled={clarificationOptionsDisabled}
                onClick={() => onClarificationOptionSelect?.(option)}
              />
            ))}
            <ClarificationOptionRow
              letter={clarificationOptionLetter(options.length)}
              label="Custom input"
              description="Type your answer in the box below"
              interactive={clarificationOptionsInteractive}
              disabled={clarificationOptionsDisabled}
              onClick={() => onClarificationCustomInput?.()}
            />
          </div>
        )}
      </div>
    </div>
  );
});
