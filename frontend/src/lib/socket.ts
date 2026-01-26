import { io } from "socket.io-client";

// In Vercel, the backend is serverless paths on the same origin
// or a specific URL provided by env
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

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