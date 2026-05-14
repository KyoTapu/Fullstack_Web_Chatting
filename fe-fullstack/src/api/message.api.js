import {http} from "./http";

export const sendDirectMessageApi = (receiverId, content) => {
  return http("/messages/direct", {
    method: "POST",
    body: JSON.stringify({ receiverId, content }),
  });
};

export const sendGroupMessageApi = (groupId, content) => {
  return http("/messages/group", {
    method: "POST",
    body: JSON.stringify({ groupId, content }),
  });
};

export const getConversationMessagesApi = (conversationId) => {
  return http(`/messages/${conversationId}`);
};
