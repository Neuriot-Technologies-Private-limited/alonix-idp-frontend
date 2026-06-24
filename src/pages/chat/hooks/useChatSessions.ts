import { useCallback, useState } from 'react';
import {
  deleteChat,
  getChatHistory,
  getChatSessions,
  type ChatSessionDto,
} from '../../../services/chatApi';
import { mapHistoryMessageToPair } from '../utils/mapChatMessages';
import type { ChatAlertState, ConversationPair } from '../types/chatConversation';

interface UseChatSessionsOptions {
  userEmail: string;
  activeGroupId: string;
  showToast: (msg: string, type?: 'error' | 'ok') => void;
  onCurrentSessionDeleted?: () => void;
}

export function useChatSessions({
  userEmail,
  activeGroupId,
  showToast,
  onCurrentSessionDeleted,
}: UseChatSessionsOptions) {
  const [chatDataState, setChatDataState] = useState<ChatSessionDto[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [conversationPairs, setConversationPairs] = useState<ConversationPair[]>([]);
  const [alertModal, setAlertModal] = useState<ChatAlertState>({
    open: false,
    title: '',
    msg: '',
  });

  const sortSessions = useCallback(
    (list: ChatSessionDto[]) =>
      [...list].sort(
        (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      ),
    []
  );

  const loadChatSessions = useCallback(
    async (groupIdOverride?: string) => {
      setIsSessionLoading(true);
      const gid = groupIdOverride ?? activeGroupId;
      try {
        const response = await getChatSessions(gid || undefined);
        const sessions = response.data?.sessions || [];
        setChatDataState(sortSessions(sessions));
      } catch {
        showToast('Failed to load chat sessions.', 'error');
      } finally {
        setIsSessionLoading(false);
      }
    },
    [activeGroupId, showToast, sortSessions]
  );

  const createNewChat = useCallback(() => {
    setConversationPairs([]);
    setCurrentSession(null);
  }, []);

  const selectChatSession = useCallback(
    async (sessionId: string, setErrorText: (msg: string) => void) => {
      if (!userEmail) return;
      setCurrentSession(sessionId);
      setIsSessionLoading(true);
      setErrorText('');

      try {
        const response = await getChatHistory(sessionId, activeGroupId || undefined);
        const messages = Array.isArray(response.data) ? response.data : [];
        setConversationPairs(
          (messages as Record<string, unknown>[]).map(mapHistoryMessageToPair)
        );
      } catch {
        const msg = 'Failed to load chat history.';
        setErrorText(msg);
        showToast(msg, 'error');
        setConversationPairs([]);
      } finally {
        setIsSessionLoading(false);
      }
    },
    [activeGroupId, showToast, userEmail]
  );

  const handleDeleteChatSession = useCallback(
    async (sessionId: string, setErrorText: (msg: string) => void) => {
      if (!sessionId || !userEmail) return;
      try {
        await deleteChat(sessionId, activeGroupId || undefined);
        if (currentSession === sessionId) {
          createNewChat();
          onCurrentSessionDeleted?.();
        }
        void loadChatSessions();
      } catch (error: unknown) {
        const ax = error as { response?: { data?: { message?: string; error?: string } } };
        const backendMsg =
          ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          (error instanceof Error ? error.message : '') ||
          'Failed to delete chat session.';
        setAlertModal({ open: true, title: 'Delete chat failed', msg: backendMsg });
        setErrorText(backendMsg);
        showToast(backendMsg, 'error');
      }
    },
    [activeGroupId, createNewChat, currentSession, loadChatSessions, onCurrentSessionDeleted, showToast, userEmail]
  );

  return {
    chatDataState,
    currentSession,
    setCurrentSession,
    isSessionLoading,
    conversationPairs,
    setConversationPairs,
    alertModal,
    setAlertModal,
    loadChatSessions,
    createNewChat,
    selectChatSession,
    handleDeleteChatSession,
  };
}
