import React from 'react';

type AlertState = { open: boolean; title: string; msg: string };

type ChatAlertModalProps = {
  state: AlertState;
  onClose: () => void;
};

export const ChatAlertModal: React.FC<ChatAlertModalProps> = ({ state, onClose }) => {
  if (!state.open) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        className="w-[92%] max-w-lg rounded-xl border border-border/20 bg-surface-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border/10 px-5 py-4">
          <h2 className="text-base font-bold text-foreground">{state.title}</h2>
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="whitespace-pre-wrap break-words px-5 py-4 text-sm leading-snug text-muted-foreground/70">
          {state.msg}
        </div>
        <div className="flex justify-end border-t border-border/10 px-5 py-3">
          <button
            type="button"
            className="rounded-lg border border-violet/30 bg-violet/20 px-3 py-2 text-sm font-semibold text-violet hover:bg-violet/30 hover:text-foreground"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

