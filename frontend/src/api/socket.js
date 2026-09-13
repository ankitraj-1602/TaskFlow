import { io } from 'socket.io-client';

// Socket server URL — must be the BASE URL, no `/api` prefix
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn('🔌 No access token — skipping socket connection');
    return null;
  }

  console.log('🔌 Connecting to socket at:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};