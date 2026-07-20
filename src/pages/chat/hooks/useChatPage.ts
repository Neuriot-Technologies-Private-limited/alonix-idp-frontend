import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/authStore';
import { useOrgQuota } from '../../../hooks/useOrgQuota';
import { formatSessionMeta } from '../utils/chatSessionMeta';
import { SOURCE_PILL_CLASS } from '../utils/chatSources';
import { useChatBootstrap } from './useChatBootstrap';
import { useChatComposer } from './useChatComposer';
import { useChatSessions } from './useChatSessions';
import { useChatSourceNavigation } from './useChatSourceNavigation';
import { useChatToast } from './useChatToast';

export function useChatPage() {
  const { atCap, capMessage, blocksUsage } = useOrgQuota();
  const qaBlocked = blocksUsage || atCap('questionsMonth');
  const { t } = useTranslation('chat');
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const chatScrollRef = useRef<HTMLElement | null>(null);
  const { toast, showToast } = useChatToast();

  const userEmail = (user?.email || '').trim();
  const activeGroupId = context?.activeGroupId || user?.groupID || user?.groupId || '';
  const activeGroup = context?.groups?.find((g) => g.groupId === activeGroupId);
  const collectionName = activeGroup?.groupName || user?.groupName || '';

  const composerClearRef = useRef<() => void>(() => {});

  const sessions = useChatSessions({
    userEmail,
    activeGroupId,
    showToast,
    onCurrentSessionDeleted: () => composerClearRef.current(),
  });

  const composer = useChatComposer({
    collectionName,
    activeGroupId,
    qaBlocked,
    capMessage,
    currentSession: sessions.currentSession,
    setCurrentSession: sessions.setCurrentSession,
    setConversationPairs: sessions.setConversationPairs,
    onAnswerSuccess: () => {
      if (userEmail) void sessions.loadChatSessions();
    },
    showToast,
  });

  useEffect(() => {
    composerClearRef.current = () => {
      composer.setText('');
      composer.clearComposerError();
    };
  }, [composer]);

  const resetChatSurface = useCallback(() => {
    sessions.createNewChat();
    composer.setText('');
    composer.clearComposerError();
  }, [composer, sessions]);

  const { handleSourceClick } = useChatSourceNavigation(
    activeGroupId,
    composer.setErrorText,
    showToast
  );

  useChatBootstrap({
    userEmail,
    activeGroupId,
    onGroupChange: resetChatSurface,
    loadChatSessions: sessions.loadChatSessions,
  });

  useEffect(() => {
    const scrollEl = chatScrollRef.current;
    if (!scrollEl) return;
    requestAnimationFrame(() => {
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [sessions.conversationPairs, composer.isResponseLoading]);

  const toggleSidebar = useCallback(() => setSidebarHidden((p) => !p), []);

  const chatHeaderSubtitle = sessions.currentSession
    ? sessions.chatDataState.find((s) => s.session_id === sessions.currentSession)?.title ||
      'Active chat'
    : 'New conversation';

  return {
    t,
    user,
    context,
    sidebarHidden,
    toggleSidebar,
    chatScrollRef,
    toast,
    qaBlocked,
    capMessage,
    sourcePillClass: SOURCE_PILL_CLASS,
    formatSessionMeta,
    handleSourceClick,
    chatHeaderSubtitle,
    resetChatSurface,
    sessions,
    composer,
  };
}
