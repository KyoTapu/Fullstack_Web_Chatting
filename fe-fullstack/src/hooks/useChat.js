import { useEffect, useState, useCallback } from "react";
import {
  getMessages,
  getMessageDetails,
  sendDirectMessage,
  sendGroupMessage,
  sendDirectFile,
  sendGroupFile,
  editMessage,
  recallMessage,
  toggleMessageReaction,
} from "../api/chat.api";
import { useAuth } from "../context/AuthContext";

const CHAT_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_DELETE_WINDOW_MS = 10 * 60 * 1000;
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,  
  timeZone: CHAT_TIME_ZONE,
});

const toDisplayTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
};

const dispatchConversationUpdated = (conversationId) => {
  if (typeof window === "undefined" || !conversationId) return;

  window.dispatchEvent(
    new CustomEvent("chat:conversation-updated", {
      detail: { conversationId: String(conversationId) },
    }),
  );
};

export default function useChat(conversation) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const conversationId = conversation?._id || conversation?.id;

  const formatMessage = (msg) => {
    if (!msg) return null;

    const createdAt = msg.createdAt || new Date().toISOString();
    const editedAt = msg.editedAt || null;
    const recalledAt = msg.recalledAt || null;
    const editWindowEndsAt =
      msg.editWindowEndsAt ||
      new Date(new Date(createdAt).getTime() + MESSAGE_EDIT_WINDOW_MS).toISOString();
    const deleteWindowEndsAt =
      msg.deleteWindowEndsAt ||
      new Date(new Date(createdAt).getTime() + MESSAGE_DELETE_WINDOW_MS).toISOString();

    return {
      _id: msg._id || msg.id || `fallback-${Date.now()}`,
      id: msg._id || msg.id,
      userId: msg.senderId || msg.userId,
      content: msg.content || "",
      type: msg.type || "text",
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null,
      fileSize: typeof msg.fileSize === "number" ? msg.fileSize : null,
      mimeType: msg.mimeType || null,
      mentions: Array.isArray(msg.mentions) ? msg.mentions : [],
      time: toDisplayTime(createdAt),
      createdAt,
      editedAt,
      recalledAt,
      isEdited: Boolean(msg.isEdited || editedAt),
      isRecalled: Boolean(msg.isRecalled || recalledAt),
      reactions: Array.isArray(msg.reactions)
        ? msg.reactions
            .map((reaction) => ({
              emoji: reaction?.emoji || "",
              userId: reaction?.userId || reaction?.id || "",
              createdAt: reaction?.createdAt || null,
            }))
            .filter((reaction) => reaction.emoji && reaction.userId)
        : [],
      editWindowEndsAt,
      deleteWindowEndsAt,
      updatedAt: msg.updatedAt || createdAt,
      pending: Boolean(msg.pending),
    };
  };

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);

    try {
      const res = await getMessages(conversationId);
      const raw = res?.data?.data || res?.data || res || [];

      if (Array.isArray(raw)) {
        setMessages(raw.map(formatMessage).filter(Boolean).reverse());
      } else {
        console.error("Invalid messages format:", raw);
        setMessages([]);
      }
    } catch (err) {
      console.error("Load messages error:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const getRecipientId = (activeConversation, me) => {
    if (activeConversation?.friend?.id) return activeConversation.friend.id;
    if (activeConversation?.friend?._id) return activeConversation.friend._id;

    if (Array.isArray(activeConversation?.members)) {
      const currentId = String(me?.id);
      const otherUser = activeConversation.members.find((m) => String(m?.id) !== currentId);
      return otherUser?.id || null;
    }

    return null;
  };

  const replaceMessage = useCallback((incomingMessage) => {
    const formattedMessage = formatMessage(incomingMessage);
    if (!formattedMessage) return null;

    setMessages((prev) => {
      const nextMessages = [...prev];
      const existingIndex = nextMessages.findIndex(
        (message) => String(message._id) === String(formattedMessage._id),
      );

      if (existingIndex >= 0) {
        nextMessages[existingIndex] = {
          ...nextMessages[existingIndex],
          ...formattedMessage,
          pending: false,
        };
        return nextMessages;
      }

      return [...nextMessages, formattedMessage];
    });
    return formattedMessage;
  }, []);

  const replaceTempMessage = useCallback((tempId, incomingMessage) => {
    const formattedMessage = formatMessage(incomingMessage);
    if (!formattedMessage) return null;

    setMessages((prev) => {
      const existingIndex = prev.findIndex(
        (message) => String(message._id) === String(formattedMessage._id),
      );
      const tempIndex = prev.findIndex((message) => String(message._id) === String(tempId));

      if (existingIndex >= 0 && tempIndex >= 0 && existingIndex !== tempIndex) {
        return prev.filter((message) => String(message._id) !== String(tempId));
      }

      if (tempIndex >= 0) {
        return prev.map((message) =>
          String(message._id) === String(tempId)
            ? {
                ...formattedMessage,
                pending: false,
              }
            : message,
        );
      }

      if (existingIndex >= 0) {
        return prev.map((message, index) =>
          index === existingIndex
            ? {
                ...message,
                ...formattedMessage,
                pending: false,
              }
            : message,
        );
      }

      return [...prev, formattedMessage];
    });
    return formattedMessage;
  }, []);

  const handleSend = async (payload) => {
    const content = typeof payload === "string" ? payload : payload?.content || "";
    const mentions = Array.isArray(payload?.mentions) ? payload.mentions : [];

    if (!conversationId || !content.trim()) return;

    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      _id: tempId,
      userId: currentUser?.id,
      content,
      type: "text",
      mentions,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      let res;

      if (conversation.type === "group") {
        res = await sendGroupMessage({
          conversationId,
          content,
          mentions,
        });
      } else {
        const recipientId = getRecipientId(conversation, currentUser);
        if (!recipientId) {
          throw new Error("Cannot determine recipientId");
        }

        res = await sendDirectMessage({
          conversationId,
          recipientId,
          content,
          mentions,
        });
      }

      const newMsgRaw = res.data?.message || res.message || res.data?.data || res.data;
      if (!newMsgRaw) throw new Error("No message returned from API");

      replaceTempMessage(tempId, newMsgRaw);
      dispatchConversationUpdated(conversationId);
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async (file) => {
    if (!conversationId || !file) return;

    setSending(true);

    const tempId = `temp-file-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const messageType = file.type?.startsWith("image/") ? "image" : "file";

    const tempMsg = {
      _id: tempId,
      userId: currentUser?.id,
      content: file.name,
      type: messageType,
      fileUrl: previewUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);

      let res;
      if (conversation.type === "group") {
        res = await sendGroupFile(formData);
      } else {
        const recipientId = getRecipientId(conversation, currentUser);
        if (!recipientId) {
          throw new Error("Cannot determine recipientId");
        }
        formData.append("recipientId", recipientId);
        res = await sendDirectFile(formData);
      }

      const newMsgRaw = res.data?.message || res.message || res.data?.data || res.data;
      if (!newMsgRaw) throw new Error("No message returned from API");

      replaceTempMessage(tempId, newMsgRaw);
      dispatchConversationUpdated(conversationId);
    } catch (err) {
      console.error("Send file error:", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      URL.revokeObjectURL(previewUrl);
      setSending(false);
    }
  };

  const handleUpdateMessage = async (messageId, payload) => {
    const content = typeof payload === "string" ? payload : payload?.content || "";
    const mentions = Array.isArray(payload?.mentions) ? payload.mentions : [];
    if (!messageId || !content.trim()) {
      throw new Error("Content required");
    }

    setSending(true);

    try {
      const res = await editMessage(messageId, {
        content,
        mentions,
      });
      const updatedRaw = res?.message || res?.data?.message || res?.data || res;
      const updatedMessage = replaceMessage(updatedRaw);
      dispatchConversationUpdated(conversationId);
      return updatedMessage;
    } finally {
      setSending(false);
    }
  };

  const handleRecallMessage = async (messageId) => {
    if (!messageId) {
      throw new Error("Message not found");
    }

    const res = await recallMessage(messageId);
    const updatedRaw = res?.message || res?.data?.message || res?.data || res;
    const updatedMessage = replaceMessage(updatedRaw);
    dispatchConversationUpdated(conversationId);
    return updatedMessage;
  };

  const handleToggleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) {
      throw new Error("Reaction emoji required");
    }

    const res = await toggleMessageReaction(messageId, emoji);
    const updatedRaw = res?.message || res?.data?.message || res?.data || res;
    return replaceMessage(updatedRaw);
  };

  const loadMessageDetails = async (messageId) => {
    if (!messageId) {
      throw new Error("Message not found");
    }

    const res = await getMessageDetails(messageId);
    const raw = res?.message || res?.data?.message || res?.data || res;
    return formatMessage(raw);
  };

  const refreshMessages = async () => {
    await loadMessages();
  };

  return {
    messages,
    setMessages,
    loading,
    sending,
    handleSend,
    handleSendFile,
    handleUpdateMessage,
    handleRecallMessage,
    handleToggleReaction,
    loadMessageDetails,
    refreshMessages,
    formatMessage,
    replaceMessage,
  };
}
