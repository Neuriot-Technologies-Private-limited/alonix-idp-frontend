import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { getConnectorDialogFocusables } from '../../utils/connector/dialogFocus';

export function useConnectorBrowserModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const connectorBrowserOpen = searchParams.get('connectors') === '1';
  const connectorBrowserLinkId = searchParams.get('connectorId');
  const connectorDialogRef = React.useRef<HTMLDivElement>(null);
  const connectorFocusReturnRef = React.useRef<HTMLElement | null>(null);

  const closeConnectorBrowserModal = React.useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('connectors');
    next.delete('connectorId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openConnectorBrowserModal = React.useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('connectors', '1');
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    if (!connectorBrowserOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConnectorBrowserModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connectorBrowserOpen, closeConnectorBrowserModal]);

  React.useEffect(() => {
    if (!connectorBrowserOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [connectorBrowserOpen]);

  React.useLayoutEffect(() => {
    if (!connectorBrowserOpen) return;
    connectorFocusReturnRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let raf = 0;
    raf = requestAnimationFrame(() => {
      const root = connectorDialogRef.current;
      if (!root) return;
      const nodes = getConnectorDialogFocusables(root);
      (nodes[0] ?? root).focus();
    });

    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !connectorDialogRef.current) return;
      const root = connectorDialogRef.current;
      const nodes = getConnectorDialogFocusables(root);
      if (nodes.length < 2) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', onDocKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onDocKeyDown, true);
      connectorFocusReturnRef.current?.focus?.();
    };
  }, [connectorBrowserOpen]);

  return {
    connectorBrowserOpen,
    connectorBrowserLinkId,
    connectorDialogRef,
    openConnectorBrowserModal,
    closeConnectorBrowserModal,
  };
}
