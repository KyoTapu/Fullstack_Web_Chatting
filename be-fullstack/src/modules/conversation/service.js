import {
  findDirectConversation,
  insertConversation,
  insertParticipants,
  findUserConversations
} from "./repository.js";
import friendRepository from "../friends/repository.js";

// 🔥 create direct
export const createDirectConversation = async (userA, userB) => {
  const blockedRelationship = await friendRepository.findBlockedRelationship(userA, userB);
  if (blockedRelationship) {
    throw new Error(
      blockedRelationship.requester_id === userA
        ? "You have blocked this user"
        : "This user has blocked you"
    );
  }

  // check tồn tại
  let conversationId = await findDirectConversation(userA, userB);

  if (conversationId) {
    return conversationId;
  }

  // tạo mới
  conversationId = await insertConversation({
    type: "direct",
    ownerId: userA
  });

  await insertParticipants(conversationId, [userA, userB]);

  return conversationId;
};


// 🔥 create group
export const createGroupConversation = async (creatorId, name, members) => {

  const conversationId = await insertConversation({
    type: "group",
    ownerId: creatorId,
    name
  });

  const allMembers = [...new Set([creatorId, ...members])];

  await insertParticipants(conversationId, allMembers);

  return conversationId;
};


// 🔥 get conversations
export const getUserConversations = async (userId, options = {}) => {
  return await findUserConversations(userId, options);
};
