import { http } from "./http";

// conversation
export const getConversations = () => http("/conversations");

export const createDirect = (recipientId) =>
  http("/conversations/direct", {
    method: "POST",
    body: JSON.stringify({ recipientId }),
  });

// message
export const getMessages = (conversationId) =>
  http(`/messages/${conversationId}`);

export const getMessageDetails = (messageId) =>
  http(`/messages/item/${messageId}`);

export const sendDirectMessage = (data) =>
  http("/messages/direct", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const sendGroupMessage = (data) =>
  http("/messages/group", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const sendDirectFile = (formData) =>
  http("/messages/direct/file", {
    method: "POST",
    body: formData,
  });

export const sendGroupFile = (formData) =>
  http("/messages/group/file", {
    method: "POST",
    body: formData,
  });

export const editMessage = (messageId, data) =>
  http(`/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const recallMessage = (messageId) =>
  http(`/messages/${messageId}/recall`, {
    method: "POST",
  });

export const toggleMessageReaction = (messageId, emoji) =>
  http(`/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });

  
export const getMyConversationsApi = () => {
  return http("/conversations");
};
