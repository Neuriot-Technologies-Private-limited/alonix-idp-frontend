import { useState } from 'react';
import { consumeAuthUrlParams } from '../utils/authUrlParams';

/** One-time read of auth URL params (hash, then query); strips sensitive keys from the address bar. */
export function useAuthUrlParams(keys: string[]): Record<string, string> {
  const [params] = useState(() => consumeAuthUrlParams(keys));
  return params;
}
