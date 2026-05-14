import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import registerCallHandler from "./handler/call.socket.js";
import registerUserHandler from "./handler/send.socket.js";
import { createPresenceHandler } from "./handler/presence.socket.js";

let io;

const initSocket = async (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  server.io = io;

  const redisUrl = process.env.REDIS_URL;
  console.log("🚀 ~ initSocket ~ redisUrl:", redisUrl);
  if (redisUrl) {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => {
      console.error("❌ Redis pubClient error:", err);
    });
    subClient.on("error", (err) => {
      console.error("❌ Redis subClient error:", err);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    io.redis = { pubClient, subClient };
    console.log("✅ Socket.IO Redis adapter enabled");
  } else {
    console.warn("⚠️ REDIS_URL is not set; Socket.IO runs without Redis adapter");
  }

  const presence = createPresenceHandler(io);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    presence.registerPresenceHandler(socket);
    registerUserHandler(io, socket);
    registerCallHandler(io, socket);
  });
};

export default initSocket;
export { io };
