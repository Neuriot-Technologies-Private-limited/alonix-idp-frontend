import React from 'react';

type ChatErrorBannerProps = {
  message: string;
};

export const ChatErrorBanner: React.FC<ChatErrorBannerProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="w-full shrink-0 px-4 pb-2 pt-2">
      <p className="mx-auto rounded-lg border border-destructive/25 bg-destructive/20 px-3 py-2 text-center text-sm text-destructive">
        {message}
      </p>
    </div>
  );
};

