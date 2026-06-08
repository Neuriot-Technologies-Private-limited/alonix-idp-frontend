import React from 'react';
import ConnectorBrowserContent from '../../components/connectors/ConnectorBrowserContent';

type DocumentsConnectorModalProps = {
  open: boolean;
  connectorDialogRef: React.RefObject<HTMLDivElement | null>;
  initialConnectorId: string | null;
  onClose: () => void;
  onViewIngestedDocuments?: (connectorId: string) => void;
};

export const DocumentsConnectorModal: React.FC<DocumentsConnectorModalProps> = ({
  open,
  connectorDialogRef,
  initialConnectorId,
  onClose,
  onViewIngestedDocuments,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] isolate flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden overscroll-contain p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in fade-in duration-300">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-scrim backdrop-blur-md"
        onClick={onClose}
        aria-label="Close connector browser"
      />
      <div
        ref={connectorDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connector-browser-title"
        aria-describedby="connector-browser-description"
        tabIndex={-1}
        className="relative z-10 my-auto flex w-[min(96rem,calc(100vw-1.25rem))] max-h-[min(92vh,900px)] min-h-0 min-w-0 flex-col overflow-hidden rounded-[32px] border border-border/25 bg-surface-lowest p-4 shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.04] outline-none animate-in zoom-in-95 duration-300 dark:border-border/35 dark:shadow-black/40 dark:ring-white/[0.06] sm:p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <ConnectorBrowserContent
          variant="modal"
          onClose={onClose}
          initialConnectorId={initialConnectorId}
          onViewIngestedDocuments={onViewIngestedDocuments}
        />
      </div>
    </div>
  );
};
