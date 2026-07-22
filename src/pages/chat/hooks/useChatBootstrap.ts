import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { connectSocket, disconnectSocket } from '../../../services/chatSocket';

interface UseChatBootstrapOptions {
  activeGroupId: string;
  onGroupChange: () => void;
}

export function useChatBootstrap({
  activeGroupId,
  onGroupChange,
}: UseChatBootstrapOptions) {
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  const syncAuthContext = useAuthStore((s) => s.syncAuthContext);
  const prevResolvedGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !context) return;
    const email = (user.email || '').trim();
    let gid = context.activeGroupId || user.groupId || user.groupID || activeGroupId || '';

    connectSocket(email, gid);

    void syncAuthContext()
      .then(() => {
        const refreshed = useAuthStore.getState().context;
        const nextGid =
          refreshed?.activeGroupId || refreshed?.groups?.[0]?.groupId || gid;
        if (
          prevResolvedGroupIdRef.current !== null &&
          prevResolvedGroupIdRef.current !== nextGid
        ) {
          onGroupChange();
        }
        prevResolvedGroupIdRef.current = nextGid;
        if (nextGid && nextGid !== gid) {
          connectSocket(email, nextGid);
        }
      })
      .catch(() => {
        prevResolvedGroupIdRef.current = gid;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap when user/context ids settle
  }, [user?.email, context?.activeGroupId]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);
}
