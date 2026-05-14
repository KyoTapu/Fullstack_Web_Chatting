const CALL_TTL = 60;
const CALL_TIMEOUT = 30 * 1000;
const callTimeouts = new Map();

const getUserRoom = (userId) => `user:${String(userId)}`;
const getCallKey = (a, b) => `call:${[a, b].sort().join(":")}`; // unique pair key

const isUserOnline = async (io, userId) => {
  if (!userId) return false;
  const socketIds = await io.in(getUserRoom(userId)).allSockets();
  return socketIds.size > 0;
};

const isUserBusy = async (redis, userId) => {
  return await redis.get(`user:${userId}:in_call`);
};

const setUserBusy = async (redis, userId, ttl = CALL_TTL) => {
  await redis.set(`user:${userId}:in_call`, "1", "EX", ttl);
};

const clearUserBusy = async (redis, userId) => {
  await redis.del(`user:${userId}:in_call`);
};

const setCallState = async (redis, from, to, state) => {
  const key = getCallKey(from, to);
  await redis.set(key, JSON.stringify(state), "EX", CALL_TTL);
};

const clearCallState = async (redis, from, to) => {
  await redis.del(getCallKey(from, to));
};

const emitToUser = (io, userId, event, payload) => {
  if (!userId) return;
  io.to(getUserRoom(userId)).emit(event, payload);
};

const emitCallEnded = (io, { fromUserId, toUserId, reason }) => {
  emitToUser(io, toUserId, "call_ended", {
    from: fromUserId ?? null,
    reason,
  });
};

const clearCallTimeout = (fromUserId, toUserId) => {
  const key = getCallKey(fromUserId, toUserId);
  const timeout = callTimeouts.get(key);
  if (!timeout) return;

  clearTimeout(timeout);
  callTimeouts.delete(key);
};

const registerCallHandler = (io, socket) => {
  const redis = io.redis?.pubClient;

  socket.on("call_user", async ({ toUserId, offer, profile, media, isVideoCall = true }) => {
    const fromUserId = socket.user?.id;
    if (!fromUserId || !toUserId) return;

    socket.data.callPeerId = toUserId;
    // check busy
    if (redis && (await isUserBusy(redis, toUserId))) {
      socket.emit("call_unavailable", { toUserId, reason: "busy" });
      return;
    }

    if (redis) {
      await setCallState(redis, fromUserId, toUserId, { status: "ringing" });
      await setUserBusy(redis, fromUserId);
      await setUserBusy(redis, toUserId);
    }

    // KHÔNG phụ thuộc check online nữa
    emitToUser(io, toUserId, "incoming_call", {
      from: fromUserId,
      offer,
      profile,
      media,
      isVideoCall,
    });

    // timeout nếu không accept
    clearCallTimeout(fromUserId, toUserId);
    const timeout = setTimeout(async () => {
      callTimeouts.delete(getCallKey(fromUserId, toUserId));
      emitCallEnded(io, { fromUserId, toUserId, reason: "timeout" });
      emitCallEnded(io, { fromUserId: toUserId, toUserId: fromUserId, reason: "timeout" });

      if (redis) {
        await clearCallState(redis, fromUserId, toUserId);
        await clearUserBusy(redis, fromUserId);
        await clearUserBusy(redis, toUserId);
      }
    }, CALL_TIMEOUT);

    callTimeouts.set(getCallKey(fromUserId, toUserId), timeout);
  });

  socket.on("answer_call", async ({ toUserId, answer, profile, media }) => {
    const fromUserId = socket.user?.id;
    if (!fromUserId || !toUserId) return;

    socket.data.callPeerId = toUserId;

    // clear timeout
    clearCallTimeout(fromUserId, toUserId);

    if (redis) {
      await setCallState(redis, fromUserId, toUserId, { status: "connected" });
    }

    emitToUser(io, toUserId, "call_accepted", {
      answer,
      profile,
      media,
    });
  });

  socket.on("ice_candidate", ({ toUserId, candidate }) => {
    const fromUserId = socket.user?.id;
    if (!fromUserId || !toUserId) return;

    emitToUser(io, toUserId, "ice_candidate", {
      from: fromUserId,
      candidate,
    });
  });

  socket.on("call_media_toggle", ({ toUserId, media }) => {
    const fromUserId = socket.user?.id;
    if (!fromUserId || !toUserId) return;

    emitToUser(io, toUserId, "call_media_toggle", {
      from: fromUserId,
      media,
    });
  });

  socket.on("end_call", async ({ toUserId }) => {
    const fromUserId = socket.user?.id;
    if (!fromUserId || !toUserId) return;

    socket.data.callPeerId = null;
    clearCallTimeout(fromUserId, toUserId);

    emitCallEnded(io, { fromUserId, toUserId, reason: "ended" });
    emitCallEnded(io, { fromUserId, toUserId: fromUserId, reason: "ended" });

    if (redis) {
      await clearCallState(redis, fromUserId, toUserId);
      await clearUserBusy(redis, fromUserId);
      await clearUserBusy(redis, toUserId);
    }
  });

  socket.on("disconnect", async () => {
    const fromUserId = socket.user?.id;
    const peerId = socket.data.callPeerId;

    if (!fromUserId || !peerId) return;
    clearCallTimeout(fromUserId, peerId);

    // delay để tránh reconnect nhanh
    setTimeout(async () => {
      emitCallEnded(io, {
        fromUserId,
        toUserId: peerId,
        reason: "peer_disconnected",
      });

      if (redis) {
        await clearCallState(redis, fromUserId, peerId);
        await clearUserBusy(redis, fromUserId);
        await clearUserBusy(redis, peerId);
      }
    }, 3000);
  });
};

export default registerCallHandler;