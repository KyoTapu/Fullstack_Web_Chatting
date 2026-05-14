import { io } from "socket.io-client";

let socket = null;

const getSocketUrl = () => {
  // ưu tiên env (production)
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // auto detect protocol
  const isSecure = window.location.protocol === "https:";
  const protocol = isSecure ? "wss" : "ws";

  return `${protocol}://${window.location.host}`;
};

export const connectSocket = (token) => {
  if (!token) return null;

  // luôn reset socket cũ
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const socketUrl = getSocketUrl();

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket"], // tránh polling
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("🔥 Error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
