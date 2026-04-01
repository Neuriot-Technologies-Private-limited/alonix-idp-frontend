import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

function socketBaseUrl(): string {
  const base = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '';
  return base.replace(/\/$/, '') || window.location.origin;
}

/** Server joins `user:${email}` and `user:${userId}`; pass the signed-in user's email. */
export function connectSocket(email: string, groupId: string) {
  if (socket?.connected) return;
  const token = useAuthStore.getState().token;
  socket = io(socketBaseUrl(), {
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
    query: { email, groupId },
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
