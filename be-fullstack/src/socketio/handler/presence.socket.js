export const createPresenceHandler = (io) => {
  const getUserRoom = (userId) => `user:${String(userId)}`;

  const getVisibleOnlineUsers = async () => {
    const sockets = await io.fetchSockets();
    const userIds = new Set();

    for (const socket of sockets) {
      const userId = socket.user?.id;
      const visible = socket.user?.visible;
      if (!userId) continue;
      if (visible === false) continue;
      userIds.add(String(userId));
    }

    return Array.from(userIds);
  };

  const emitOnlineUsers = async () => {
    const onlineUsers = await getVisibleOnlineUsers();
    io.emit("getOnlineUsers", onlineUsers);
  };

  const broadcastVisibilityUpdate = async (userId) => {
    await emitOnlineUsers();
    console.log(`Updated online visibility for user ${userId}`);
  };

  const registerSocketUser = async (socket, userId) => {
    if (!userId) return;

    socket.user = {
      id: String(userId),
      visible: socket.user?.visible ?? true,
    };
    socket.join(getUserRoom(userId));

    await broadcastVisibilityUpdate(userId);
    console.log("Registered user:", userId);
  };

  const updateVisibility = async (socket, visible) => {
    const currentUserId = socket.user?.id;
    if (!currentUserId) return;

    socket.user = {
      ...socket.user,
      visible: Boolean(visible),
    };

    const sockets = await io.fetchSockets();
    for (const sock of sockets) {
      if (sock.user?.id === currentUserId) {
        sock.user = {
          ...sock.user,
          visible: Boolean(visible),
        };
      }
    }

    await broadcastVisibilityUpdate(currentUserId);
  };

  const removeSocketUser = async (socket) => {
    // Emit updated list when a socket disconnects.
    await emitOnlineUsers();
  };

  const getUserSocketId = (userId) => {
    const users = io.sockets.sockets;
    for (const [_, sock] of users) {
      if (String(sock.user?.id) === String(userId)) {
        return sock.id;
      }
    }
    return null;
  };

  const registerPresenceHandler = (socket) => {
    socket.on("register", async (userId) => {
      await registerSocketUser(socket, userId);
    });

    socket.on("set_online_visibility", async ({ visible }) => {
      await updateVisibility(socket, visible);
    });

    socket.on("disconnect", async () => {
      await removeSocketUser(socket);
    });
  };

  return {
    getUserSocketId,
    registerPresenceHandler,
  };
};
