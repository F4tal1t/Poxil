import { io } from "socket.io-client";


let SOCKET_URL = import.meta.env.VITE_API_URL || "https://poxil.onrender.com";


if (SOCKET_URL.includes("vercel.app")) {
    console.warn("Socket URL pointing to Vercel (unsupported). Switching to Render backend.");
    SOCKET_URL = "https://poxil.onrender.com";
}

SOCKET_URL = SOCKET_URL.replace("/api", "").replace(/\/$/, "");

console.log("Socket connecting to:", SOCKET_URL);

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