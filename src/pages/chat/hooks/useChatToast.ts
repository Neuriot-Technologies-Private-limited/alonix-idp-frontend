import { useCallback, useState } from 'react';
import type { ChatToastState } from '../types/chatConversation';

export function useChatToast() {
  const [toast, setToast] = useState<ChatToastState | null>(null);

  const showToast = useCallback((msg: string, type: 'error' | 'ok' = 'error') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  return { toast, showToast };
}
