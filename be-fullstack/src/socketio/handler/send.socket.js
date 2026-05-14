const registerUserHandler = (io, socket) => {

  // 🏠 join conversation
  socket.on("join_conversation", (conversationId) => {
    if (!conversationId) return;

    socket.join(String(conversationId));

    console.log(
      `User ${socket.user?.id || "unknown"} joined ${conversationId}`
    );
  });

  // 📩 send message
  socket.on("send_message", (message) => {
    const { conversationId } = message;

    console.log("SEND MESSAGE:", message);

    if (!conversationId) return;

    io.to(String(conversationId)).emit("receive_message", message);
  });

  socket.on("typing", ({ conversationId, userId, isTyping }) => {
    if (!conversationId) return;
    socket.to(String(conversationId)).emit("typing", { conversationId, userId, isTyping });
  });

};

export default registerUserHandler;
