import React from 'react';
import { cn } from '../../../utils/cn';

type ChatToastState = { msg: string; type: 'error' | 'ok' } | null;

type ChatToastProps = {
  toast: ChatToastState;
};

export const ChatToast: React.FC<ChatToastProps> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[10000] max-w-sm rounded-lg px-4 py-3 text-sm shadow-xl',
        toast.type === 'error'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-success text-success-foreground'
      )}
    >
      {toast.msg}
    </div>
  );
};

