import { createContext } from 'react';
import type { AlertOptions, ConfirmOptions } from './types';

export interface AlertContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const AlertContext = createContext<AlertContextValue | null>(null);
