import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket.io client connected successfully:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket.io connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.io client disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket.io client disconnected manually");
  }
};
