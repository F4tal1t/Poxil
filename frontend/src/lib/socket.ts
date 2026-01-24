import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// Use Vercel-compatible polling by default if websocket fails
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"], 
  reconnectionAttempts: 5,
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