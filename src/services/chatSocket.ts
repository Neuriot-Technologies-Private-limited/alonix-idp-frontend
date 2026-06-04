import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketIdentity: { groupId: string } | null = null;

function socketBaseUrl(): string {
  const base = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '';
  return base.replace(/\/$/, '') || window.location.origin;
}

/** Server joins `user:${email}` and `user:${userId}`; pass the signed-in user's email. */
/** Connect using httpOnly JWT cookie; groupId scopes Socket.IO rooms. */
export function connectSocket(_email: string, groupId: string) {
  const nextIdentity = { groupId: String(groupId || '').trim() };
  if (!nextIdentity.groupId) return;

  // Reconnect when workspace changes so server joins the correct rooms.
  if (socket?.connected && socketIdentity) {
    const sameIdentity = socketIdentity.groupId === nextIdentity.groupId;
    if (sameIdentity) return;
    socket.disconnect();
    socket = null;
  }

  socket = io(socketBaseUrl(), {
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
    query: { groupId: nextIdentity.groupId },
    withCredentials: true,
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
