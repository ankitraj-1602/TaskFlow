import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../api/socket';

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const socket = connectSocket();
    if (!socket) return;

    set({ socket, isConnected: socket.connected });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, isConnected: false });
  },
}));