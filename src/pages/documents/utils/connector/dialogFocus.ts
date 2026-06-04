export function getConnectorDialogFocusables(root: HTMLElement): HTMLElement[] {
  const sel =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => {
    if (el.closest('[inert]')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  });
}
