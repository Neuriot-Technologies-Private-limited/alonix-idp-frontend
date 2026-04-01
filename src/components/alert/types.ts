import type { ReactNode } from 'react';

export type AlertVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';

export interface AlertDialogBase {
  title: string;
  description?: ReactNode;
  variant?: AlertVariant;
  /** Override default icon for the variant */
  icon?: ReactNode;
}

export interface AlertOptions extends AlertDialogBase {
  /** Primary button label (default: OK / Got it) */
  confirmLabel?: string;
}

export interface ConfirmOptions extends AlertDialogBase {
  confirmLabel?: string;
  cancelLabel?: string;
}
