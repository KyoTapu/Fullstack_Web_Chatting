import Message from "./scheme.js";
import {
  checkParticipant,
  setLastMessageSnapshot,
  createConversation,
  addParticipants,
  findDirectConversation,
} from "./repository.js";
import friendRepository from "../friends/repository.js";

export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_DELETE_WINDOW_MS = 10 * 60 * 1000;
export const RECALLED_MESSAGE_TEXT = "This message was deleted.";

const isMessageTypeValid = (type) => ["text", "image", "file"].includes(type);
const normalizeReactionEmoji = (emoji) => String(emoji || "").trim();

const buildConversationPreview = (message) => {
  if (!message) {
    return {
      senderId: null,
      content: null,
      lastMessageAt: null,
    };
  }

  if (message.isRecalled) {
    return {
      senderId: String(message.senderId),
      content: RECALLED_MESSAGE_TEXT,
      lastMessageAt: message.createdAt,
    };
  }

  if (message.type === "image") {
    return {
      senderId: String(message.senderId),
      content: message.content?.trim() ? `Photo: ${message.content.trim()}` : "Sent a photo.",
      lastMessageAt: message.createdAt,
    };
  }

  if (message.type === "file") {
    return {
      senderId: String(message.senderId),
      content: message.fileName ? `File: ${message.fileName}` : "Sent a file.",
      lastMessageAt: message.createdAt,
    };
  }

  return {
    senderId: String(message.senderId),
    content: typeof message.content === "string" ? message.content.trim() : "",
    lastMessageAt: message.createdAt,
  };
};

const syncConversationLastMessage = async (conversationId) => {
  const latestMessage = await Message.findOne({
    conversationId: String(conversationId),
  })
    .sort({ createdAt: -1 })
    .lean();

  const snapshot = buildConversationPreview(latestMessage);

  await setLastMessageSnapshot({
    conversationId,
    senderId: snapshot.senderId,
    content: snapshot.content,
    lastMessageAt: snapshot.lastMessageAt,
  });
};

const getMessageForParticipant = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  const isMember = await checkParticipant(message.conversationId, userId);
  if (!isMember) {
    throw new Error("Forbidden");
  }

  return message;
};

const normalizeMentions = async (conversationId, mentions = []) => {
  if (!Array.isArray(mentions) || !mentions.length) {
    return [];
  }

  const normalizedMentions = [];
  const seen = new Set();

  for (const mention of mentions) {
    const mentionUserId = String(mention?.userId || mention?.id || mention?._id || "").trim();
    if (!mentionUserId || seen.has(mentionUserId)) {
      continue;
    }

    const isParticipant = await checkParticipant(conversationId, mentionUserId);
    if (!isParticipant) {
      continue;
    }

    seen.add(mentionUserId);
    normalizedMentions.push({
      userId: mentionUserId,
      value: typeof mention?.value === "string" ? mention.value.trim() : null,
      label: typeof mention?.label === "string" ? mention.label.trim() : null,
    });
  }

  return normalizedMentions;
};

export const createMessage = async ({
  conversationId,
  senderId,
  content,
  type = "text",
  fileUrl = null,
  fileName = null,
  fileSize = null,
  mimeType = null,
  mentions = [],
}) => {
  const normalizedType = isMessageTypeValid(type) ? type : "text";
  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (normalizedType === "text" && !normalizedContent) {
    throw new Error("Content required");
  }

  if (normalizedType !== "text" && !fileUrl) {
    throw new Error("File URL required");
  }

  const displayContent = normalizedType === "text"
    ? normalizedContent
    : (normalizedContent || fileName || (normalizedType === "image" ? "[Image]" : "[File]"));

  const isMember = await checkParticipant(conversationId, senderId);
  if (!isMember) {
    throw new Error("Forbidden");
  }

  const normalizedMentions = await normalizeMentions(conversationId, mentions);

  const message = await Message.create({
    conversationId: String(conversationId),
    senderId: String(senderId),
    content: displayContent,
    type: normalizedType,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    mentions: normalizedMentions,
  });

  try {
    const snapshot = buildConversationPreview(message);
    await setLastMessageSnapshot({
      conversationId,
      senderId: snapshot.senderId,
      content: snapshot.content,
      lastMessageAt: snapshot.lastMessageAt,
    });
  } catch (err) {
    console.error("Sync last message failed:", err);
  }

  return message;
};

export const handleSendDirectMessage = async ({
  conversationId,
  senderId,
  recipientId,
  content,
  type = "text",
  fileUrl = null,
  fileName = null,
  fileSize = null,
  mimeType = null,
  mentions = [],
}) => {
  const blockedRelationship = await friendRepository.findBlockedRelationship(senderId, recipientId);
  if (blockedRelationship) {
    throw new Error(
      blockedRelationship.requester_id === senderId
        ? "You have blocked this user"
        : "This user has blocked you"
    );
  }

  let convId = conversationId;

  if (!convId) {
    convId = await findDirectConversation(senderId, recipientId);

    if (!convId) {
      convId = await createConversation(senderId);
      await addParticipants(convId, senderId, recipientId);
    }
  }

  const message = await createMessage({
    conversationId: convId,
    senderId,
    content,
    type,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    mentions,
  });

  return { message, convId };
};

export const getMessagesService = async ({
  conversationId,
  lastTime,
  userId,
}) => {
  const isMember = await checkParticipant(conversationId, userId);
  if (!isMember) {
    throw new Error("Forbidden");
  }

  const query = {
    conversationId: String(conversationId),
  };

  if (lastTime) {
    query.createdAt = { $lt: new Date(lastTime) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(20);

  return messages;
};

export const editMessageService = async ({
  messageId,
  userId,
  content,
  mentions = [],
}) => {
  const message = await getMessageForParticipant(messageId, userId);

  if (String(message.senderId) !== String(userId)) {
    throw new Error("Forbidden");
  }

  if (message.isRecalled) {
    throw new Error("Deleted messages cannot be edited");
  }

  if (message.type !== "text") {
    throw new Error("Only text messages can be edited");
  }

  const normalizedContent = typeof content === "string" ? content.trim() : "";
  if (!normalizedContent) {
    throw new Error("Content required");
  }

  const createdAtMs = new Date(message.createdAt).getTime();
  if (Number.isNaN(createdAtMs) || Date.now() - createdAtMs > MESSAGE_EDIT_WINDOW_MS) {
    throw new Error("Edit window expired");
  }

  const normalizedMentions = await normalizeMentions(message.conversationId, mentions);

  message.content = normalizedContent;
  message.mentions = normalizedMentions;
  message.editedAt = new Date();
  await message.save();

  await syncConversationLastMessage(message.conversationId);

  return message;
};

export const recallMessageService = async ({
  messageId,
  userId,
}) => {
  const message = await getMessageForParticipant(messageId, userId);

  if (String(message.senderId) !== String(userId)) {
    throw new Error("Forbidden");
  }

  if (message.isRecalled) {
    return message;
  }

  const createdAtMs = new Date(message.createdAt).getTime();
  if (Number.isNaN(createdAtMs) || Date.now() - createdAtMs > MESSAGE_DELETE_WINDOW_MS) {
    throw new Error("Delete window expired");
  }

  message.isRecalled = true;
  message.recalledAt = new Date();
  message.content = RECALLED_MESSAGE_TEXT;
  message.fileUrl = null;
  message.fileName = null;
  message.fileSize = null;
  message.mimeType = null;
  message.mentions = [];
  await message.save();

  await syncConversationLastMessage(message.conversationId);

  return message;
};

export const getMessageDetailsService = async ({
  messageId,
  userId,
}) => {
  return getMessageForParticipant(messageId, userId);
};

export const toggleMessageReactionService = async ({
  messageId,
  userId,
  emoji,
}) => {
  const message = await getMessageForParticipant(messageId, userId);

  if (message.isRecalled) {
    throw new Error("Deleted messages cannot be reacted to");
  }

  const normalizedEmoji = normalizeReactionEmoji(emoji);
  if (!normalizedEmoji || normalizedEmoji.length > 16) {
    throw new Error("Reaction emoji required");
  }

  const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
  const existingIndex = reactions.findIndex(
    (reaction) =>
      String(reaction?.userId) === String(userId)
      && String(reaction?.emoji || "") === normalizedEmoji
  );

  if (existingIndex >= 0) {
    reactions.splice(existingIndex, 1);
  } else {
    reactions.push({
      emoji: normalizedEmoji,
      userId: String(userId),
      createdAt: new Date(),
    });
  }

  message.reactions = reactions;
  message.markModified("reactions");
  await message.save();

  return message;
};
