import { io } from 'socket.io-client';

const SOCKET_URL =
  'https://ai-virtual-mouse-mdj7.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('✅ Connected to Render:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔴 Socket disconnected:', reason);
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};