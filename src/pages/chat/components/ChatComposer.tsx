import React from 'react';
import { SendHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '../../../brand/useBrand';
import { ClaimIdCombobox } from './ClaimIdCombobox';

type ChatComposerProps = {
  value: string;
  isResponseLoading: boolean;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  claimIds?: string[];
  selectedClaimId?: string | null;
  onClaimIdChange?: (claimId: string | null) => void;
  claimIdsLoading?: boolean;
};

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  isResponseLoading,
  submitDisabled = false,
  submitDisabledReason,
  inputRef,
  onChange,
  onSubmit,
  claimIds = [],
  selectedClaimId = null,
  onClaimIdChange,
  claimIdsLoading = false,
}) => {
  const { t } = useTranslation('chat');
  const brand = useBrand();
  return (
    <div className="shrink-0 space-y-1.5 border-t border-border/40 bg-surface-highest/20 px-4 pt-3 backdrop-blur-md sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      {submitDisabledReason && (
        <p className="mx-auto max-w-7xl text-[11px] text-destructive font-medium">{submitDisabledReason}</p>
      )}
      <form
        className="mx-auto flex w-full max-w-7xl items-center gap-2 rounded-2xl border border-border/80 bg-surface-highest/20 px-2 py-1.5 shadow-inner shadow-glass transition focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 sm:gap-3 sm:px-3"
        onSubmit={onSubmit}
      >
        <ClaimIdCombobox
          claimIds={claimIds}
          value={selectedClaimId}
          onChange={onClaimIdChange ?? (() => {})}
          disabled={isResponseLoading || submitDisabled}
          loading={claimIdsLoading}
        />
        <span className="h-6 w-px shrink-0 bg-border/50" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          spellCheck={false}
          placeholder="Ask something…"
          className="h-12 min-w-0 flex-1 border-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
          value={isResponseLoading ? 'Waiting for reply…' : value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={isResponseLoading || submitDisabled}
        />
        {!isResponseLoading && (
          <button
            type="submit"
            disabled={submitDisabled || !value.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Send"
          >
            <SendHorizontal className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </form>
      <p className="mx-auto max-w-7xl text-center text-[11px] leading-relaxed text-muted-foreground/60">
        {t('mistakesDisclaimer', { brandName: brand.name })}
      </p>
    </div>
  );
};
