import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { connectSocket, disconnectSocket } from '../../../services/chatSocket';

interface UseChatBootstrapOptions {
  userEmail: string;
  activeGroupId: string;
  onGroupChange: () => void;
  loadChatSessions: (groupIdOverride?: string) => Promise<void>;
}

export function useChatBootstrap({
  onGroupChange,
  loadChatSessions,
}: UseChatBootstrapOptions) {
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  const syncAuthContext = useAuthStore((s) => s.syncAuthContext);
  const prevResolvedGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !context) return;
    const email = (user.email || '').trim();
    let gid = context.activeGroupId || user.groupId || user.groupID || '';

    void (async () => {
      try {
        await syncAuthContext();
        const refreshed = useAuthStore.getState().context;
        gid = refreshed?.activeGroupId || refreshed?.groups?.[0]?.groupId || gid;
      } catch {
        /* keep store context */
      }

      if (prevResolvedGroupIdRef.current !== null && prevResolvedGroupIdRef.current !== gid) {
        onGroupChange();
      }
      prevResolvedGroupIdRef.current = gid;

      connectSocket(email, gid);
      void loadChatSessions(gid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap when user/context ids settle
  }, [user?.email, context?.activeGroupId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);
}
