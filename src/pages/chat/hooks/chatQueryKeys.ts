export const CHAT_SESSIONS_PAGE_SIZE = 10;

export const chatQueryKeys = {
  sessions: (groupId: string) => ['chat-sessions', groupId] as const,
  history: (groupId: string, sessionId: string) =>
    ['chat-history', groupId, sessionId] as const,
};
