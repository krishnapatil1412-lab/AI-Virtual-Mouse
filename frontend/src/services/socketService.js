import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const SOCKET_URL = API_BASE_URL;

// Create a singleton instance
export const socket = io(SOCKET_URL, {
  autoConnect: false, // We'll connect manually when the dashboard mounts
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
