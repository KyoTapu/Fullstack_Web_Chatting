import {
  handleSendDirectMessage,
  createMessage,
  getMessagesService,
  editMessageService,
  recallMessageService,
  getMessageDetailsService,
  toggleMessageReactionService,
  MESSAGE_EDIT_WINDOW_MS,
  MESSAGE_DELETE_WINDOW_MS,
} from "./service.js";

const serializeMessage = (message) => {
  if (!message) return message;
  const plain = typeof message.toObject === "function" ? message.toObject() : message;
  const createdAt = plain.createdAt ? new Date(plain.createdAt) : null;
  const editWindowEndsAt =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? new Date(createdAt.getTime() + MESSAGE_EDIT_WINDOW_MS).toISOString()
      : null;
  const deleteWindowEndsAt =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? new Date(createdAt.getTime() + MESSAGE_DELETE_WINDOW_MS).toISOString()
      : null;

  return {
    ...plain,
    id: String(plain.id || plain._id),
    isEdited: Boolean(plain.editedAt),
    isRecalled: Boolean(plain.isRecalled),
    reactions: Array.isArray(plain.reactions)
      ? plain.reactions.map((reaction) => ({
          emoji: reaction?.emoji || "",
          userId: String(reaction?.userId || ""),
          createdAt: reaction?.createdAt || null,
        }))
      : [],
    editWindowEndsAt,
    deleteWindowEndsAt,
  };
};

const emitMessage = (req, conversationId, message) => {
  const io = req.app.get("io");
  if (io) {
    io.to(String(conversationId)).emit("receive_message", message);
  }
};

const emitMessageUpdated = (req, conversationId, message) => {
  const io = req.app.get("io");
  if (io) {
    io.to(String(conversationId)).emit("message_updated", message);
  }
};

const getStatusCodeForMessageError = (errorMessage = "") => {
  switch (errorMessage) {
    case "Forbidden":
      return 403;
    case "Message not found":
      return 404;
    case "Content required":
    case "Only text messages can be edited":
    case "Deleted messages cannot be edited":
    case "Edit window expired":
    case "Delete window expired":
    case "Reaction emoji required":
    case "Deleted messages cannot be reacted to":
      return 400;
    default:
      return 500;
  }
};

const buildFileUrl = (req, fileName) => (
  `${req.protocol}://${req.get("host")}/uploads/chat-files/${encodeURIComponent(fileName)}`
);

const toMessageType = (mimetype) => {
  if (typeof mimetype === "string" && mimetype.startsWith("image/")) {
    return "image";
  }
  return "file";
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, content, mentions = [] } = req.body;
    const senderId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content required" });
    }

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId required" });
    }

    const { message, convId } = await handleSendDirectMessage({
      conversationId,
      senderId,
      recipientId,
      content,
      mentions,
    });

    const serializedMessage = serializeMessage(message);
    emitMessage(req, convId, serializedMessage);

    res.status(201).json({ message: serializedMessage, conversationId: convId });
  } catch (err) {
    if (err.message.includes("blocked")) {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, mentions = [] } = req.body;
    const senderId = req.userId;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content required" });
    }

    const message = await createMessage({
      conversationId,
      senderId,
      content,
      mentions,
    });

    const serializedMessage = serializeMessage(message);
    emitMessage(req, conversationId, serializedMessage);

    res.status(201).json({ message: serializedMessage });
  } catch (err) {
    if (err.message === "Forbidden" || err.message.includes("blocked")) {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }
};

export const sendDirectFile = async (req, res) => {
  try {
    const senderId = req.userId;
    const { conversationId, recipientId, caption = "" } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId required" });
    }

    const { message, convId } = await handleSendDirectMessage({
      conversationId,
      senderId,
      recipientId,
      content: caption,
      type: toMessageType(file.mimetype),
      fileUrl: buildFileUrl(req, file.filename),
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const serializedMessage = serializeMessage(message);
    emitMessage(req, convId, serializedMessage);

    res.status(201).json({ message: serializedMessage, conversationId: convId });
  } catch (err) {
    if (err.message === "Forbidden") {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }
};

export const sendGroupFile = async (req, res) => {
  try {
    const senderId = req.userId;
    const { conversationId, caption = "" } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId required" });
    }

    const message = await createMessage({
      conversationId,
      senderId,
      content: caption,
      type: toMessageType(file.mimetype),
      fileUrl: buildFileUrl(req, file.filename),
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const serializedMessage = serializeMessage(message);
    emitMessage(req, conversationId, serializedMessage);

    res.status(201).json({ message: serializedMessage });
  } catch (err) {
    if (err.message === "Forbidden") {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { lastTime } = req.query;
    const userId = req.userId;

    const messages = await getMessagesService({
      conversationId,
      lastTime,
      userId,
    });

    res.json(messages.map(serializeMessage));
  } catch (err) {
    if (err.message === "Forbidden") {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: "Error loading messages" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, mentions = [] } = req.body;
    const userId = req.userId;

    const message = await editMessageService({
      messageId,
      userId,
      content,
      mentions,
    });

    const serializedMessage = serializeMessage(message);
    emitMessageUpdated(req, message.conversationId, serializedMessage);

    res.json({ message: serializedMessage });
  } catch (err) {
    const statusCode = getStatusCodeForMessageError(err.message);
    res.status(statusCode).json({ message: err.message });
  }
};

export const recallMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await recallMessageService({
      messageId,
      userId,
    });

    const serializedMessage = serializeMessage(message);
    emitMessageUpdated(req, message.conversationId, serializedMessage);

    res.json({ message: serializedMessage });
  } catch (err) {
    const statusCode = getStatusCodeForMessageError(err.message);
    res.status(statusCode).json({ message: err.message });
  }
};

export const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await getMessageDetailsService({
      messageId,
      userId,
    });

    res.json({ message: serializeMessage(message) });
  } catch (err) {
    const statusCode = getStatusCodeForMessageError(err.message);
    res.status(statusCode).json({ message: err.message });
  }
};

export const toggleMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId;

    const message = await toggleMessageReactionService({
      messageId,
      userId,
      emoji,
    });

    const serializedMessage = serializeMessage(message);
    emitMessageUpdated(req, message.conversationId, serializedMessage);

    res.json({ message: serializedMessage });
  } catch (err) {
    const statusCode = getStatusCodeForMessageError(err.message);
    res.status(statusCode).json({ message: err.message });
  }
};
