import { useContext } from 'react';
import { AlertContext, type AlertContextValue } from './AlertContext';

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return ctx;
}

/** Optional: returns null outside provider (e.g. Storybook) instead of throwing */
export function useAlertOptional(): AlertContextValue | null {
  return useContext(AlertContext);
}
