import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deleteChat,
  getChatHistory,
  getChatSessionsPage,
} from '../../../services/chatApi';
import { mapHistoryMessageToPair } from '../utils/mapChatMessages';
import {
  buildChatTranscriptFilename,
  downloadTextFile,
  formatChatSessionTranscript,
  type ChatTranscriptMessage,
} from '../utils/formatChatSessionTranscript';
import type { ChatAlertState, ConversationPair } from '../types/chatConversation';
import { CHAT_SESSIONS_PAGE_SIZE, chatQueryKeys } from './chatQueryKeys';

interface UseChatSessionsOptions {
  userEmail: string;
  activeGroupId: string;
  sessionsQueryEnabled: boolean;
  showToast: (msg: string, type?: 'error' | 'ok') => void;
  onCurrentSessionDeleted?: () => void;
}

export function useChatSessions({
  userEmail,
  activeGroupId,
  sessionsQueryEnabled,
  showToast,
  onCurrentSessionDeleted,
}: UseChatSessionsOptions) {
  const queryClient = useQueryClient();
  const groupKey = activeGroupId?.trim() || '';

  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [localPairs, setLocalPairs] = useState<ConversationPair[]>([]);
  /** When `sidebar`, pairs come from history query; composer keeps `local`. */
  const [historySyncMode, setHistorySyncMode] = useState<'sidebar' | 'local'>('local');
  const [alertModal, setAlertModal] = useState<ChatAlertState>({
    open: false,
    title: '',
    msg: '',
  });
  const [downloadingSessionId, setDownloadingSessionId] = useState<string | null>(null);

  const sessionsQuery = useInfiniteQuery({
    queryKey: chatQueryKeys.sessions(groupKey),
    queryFn: async ({ pageParam }) => {
      const response = await getChatSessionsPage(groupKey || undefined, {
        limit: CHAT_SESSIONS_PAGE_SIZE,
        cursor: pageParam,
      });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: sessionsQueryEnabled && Boolean(userEmail && groupKey),
  });

  const chatDataState = useMemo(
    () => sessionsQuery.data?.pages.flatMap((page) => page.sessions ?? []) ?? [],
    [sessionsQuery.data]
  );

  const isSessionsListLoading = sessionsQuery.isPending;
  const isFetchingMoreSessions = sessionsQuery.isFetchingNextPage;

  const historyQuery = useQuery({
    queryKey: chatQueryKeys.history(groupKey, currentSession ?? ''),
    queryFn: async () => {
      const response = await getChatHistory(currentSession!, groupKey || undefined);
      const messages = Array.isArray(response.data) ? response.data : [];
      return (messages as Record<string, unknown>[]).map(mapHistoryMessageToPair);
    },
    enabled:
      sessionsQueryEnabled &&
      historySyncMode === 'sidebar' &&
      Boolean(userEmail && groupKey && currentSession),
  });

  const isHistoryLoading =
    historySyncMode === 'sidebar' && Boolean(currentSession) && historyQuery.isPending;

  const conversationPairs = useMemo(() => {
    if (historySyncMode === 'sidebar') {
      if (historyQuery.isError) return [];
      return historyQuery.data ?? [];
    }
    return localPairs;
  }, [historySyncMode, historyQuery.data, historyQuery.isError, localPairs]);

  const setConversationPairs: Dispatch<SetStateAction<ConversationPair[]>> = useCallback(
    (action) => {
      if (historySyncMode === 'sidebar' && currentSession) {
        const key = chatQueryKeys.history(groupKey, currentSession);
        queryClient.setQueryData<ConversationPair[]>(key, (prev) => {
          const base = prev ?? [];
          return typeof action === 'function' ? action(base) : action;
        });
        return;
      }
      setLocalPairs(action);
    },
    [currentSession, groupKey, historySyncMode, queryClient, setLocalPairs]
  );

  useEffect(() => {
    if (historySyncMode === 'sidebar' && historyQuery.isError) {
      showToast('Failed to load chat history.', 'error');
    }
  }, [historySyncMode, historyQuery.isError, showToast]);

  useEffect(() => {
    if (sessionsQuery.isError) {
      showToast('Failed to load chat sessions.', 'error');
    }
  }, [sessionsQuery.isError, showToast]);

  const invalidateChatSessions = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions(groupKey) });
  }, [groupKey, queryClient]);

  const invalidateChatHistory = useCallback(
    (sessionId: string) => {
      void queryClient.invalidateQueries({
        queryKey: chatQueryKeys.history(groupKey, sessionId),
      });
    },
    [groupKey, queryClient]
  );

  const createNewChat = useCallback(() => {
    setLocalPairs([]);
    setCurrentSession(null);
    setHistorySyncMode('local');
  }, [setLocalPairs, setCurrentSession, setHistorySyncMode]);

  const selectChatSession = useCallback(
    (sessionId: string, setErrorText: (msg: string) => void) => {
      if (!userEmail) return;
      setErrorText('');
      setHistorySyncMode('sidebar');
      setCurrentSession(sessionId);
    },
    [setCurrentSession, setHistorySyncMode, userEmail]
  );

  const handleDownloadChatSession = useCallback(
    async (sessionId: string, title: string, setErrorText: (msg: string) => void) => {
      if (!sessionId || !userEmail || downloadingSessionId) return;
      setDownloadingSessionId(sessionId);
      try {
        const response = await getChatHistory(sessionId, groupKey || undefined);
        const messages = Array.isArray(response.data)
          ? (response.data as ChatTranscriptMessage[])
          : [];
        const body = formatChatSessionTranscript({
          title,
          exportedAt: new Date(),
          messages,
        });
        downloadTextFile(buildChatTranscriptFilename(title), body);
        showToast('Chat transcript downloaded.', 'ok');
      } catch (error: unknown) {
        const ax = error as { response?: { data?: { message?: string; error?: string } } };
        const backendMsg =
          ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          (error instanceof Error ? error.message : '') ||
          'Failed to download chat transcript.';
        setAlertModal({ open: true, title: 'Download chat failed', msg: backendMsg });
        setErrorText(backendMsg);
        showToast(backendMsg, 'error');
      } finally {
        setDownloadingSessionId(null);
      }
    },
    [downloadingSessionId, groupKey, showToast, userEmail]
  );

  const handleDeleteChatSession = useCallback(
    async (sessionId: string, setErrorText: (msg: string) => void) => {
      if (!sessionId || !userEmail) return;
      try {
        await deleteChat(sessionId, groupKey || undefined);
        if (currentSession === sessionId) {
          createNewChat();
          onCurrentSessionDeleted?.();
        }
        queryClient.removeQueries({ queryKey: chatQueryKeys.history(groupKey, sessionId) });
        invalidateChatSessions();
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
    [
      createNewChat,
      currentSession,
      groupKey,
      invalidateChatSessions,
      onCurrentSessionDeleted,
      queryClient,
      setAlertModal,
      showToast,
      userEmail,
    ]
  );

  const fetchNextSessionsPage = useCallback(() => {
    if (sessionsQuery.hasNextPage && !sessionsQuery.isFetchingNextPage) {
      void sessionsQuery.fetchNextPage();
    }
  }, [sessionsQuery]);

  return {
    chatDataState,
    currentSession,
    setCurrentSession,
    isSessionsListLoading,
    isHistoryLoading,
    isFetchingNextSessionsPage: isFetchingMoreSessions,
    hasMoreSessions: Boolean(sessionsQuery.hasNextPage),
    fetchNextSessionsPage,
    conversationPairs,
    setConversationPairs,
    alertModal,
    setAlertModal,
    invalidateChatSessions,
    invalidateChatHistory,
    createNewChat,
    selectChatSession,
    handleDownloadChatSession,
    handleDeleteChatSession,
    downloadingSessionId,
  };
}
