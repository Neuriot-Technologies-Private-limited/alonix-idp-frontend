import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;
let socketIdentity: { email: string; groupId: string } | null = null;

function socketBaseUrl(): string {
  const base = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '';
  return base.replace(/\/$/, '') || window.location.origin;
}

/** Server joins `user:${email}` and `user:${userId}`; pass the signed-in user's email. */
export function connectSocket(email: string, groupId: string) {
  const nextIdentity = { email: String(email || '').trim(), groupId: String(groupId || '').trim() };
  if (!nextIdentity.email) return;

  // Reconnect when workspace/user context changes so server joins the correct rooms.
  if (socket?.connected && socketIdentity) {
    const sameIdentity =
      socketIdentity.email === nextIdentity.email && socketIdentity.groupId === nextIdentity.groupId;
    if (sameIdentity) return;
    socket.disconnect();
    socket = null;
  }

  const token = useAuthStore.getState().token;
  socket = io(socketBaseUrl(), {
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
    query: { email: nextIdentity.email, groupId: nextIdentity.groupId },
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  socketIdentity = nextIdentity;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketIdentity = null;
}
