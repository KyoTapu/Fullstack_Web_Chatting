import { pool } from "../../../config/dbconfig.js";
import friendRepository from "../friends/repository.js";
import {
  insertParticipants,
  findUserGroups,
  findGroupDetails,
  getParticipantRole,
  deleteGroup,
  updateGroupName,
  removeParticipant,
} from "./repository.js";

export const getUserGroups = async (userId, options = {}) => {
  return await findUserGroups(userId, options);
};

export const getGroupDetail = async (userId, groupId) => {
  const role = await getParticipantRole(groupId, userId);
  if (!role) {
    throw new Error("FORBIDDEN: You are not a member of this group.");
  }
  return await findGroupDetails(groupId);
};

export const createGroup = async (ownerId, name, memberIds) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertConv = await client.query(
      `INSERT INTO conversations (type, name, owner_id) VALUES ('group', $1, $2) RETURNING id`,
      [name, ownerId]
    );
    const groupId = insertConv.rows[0].id;

    await client.query(
      `INSERT INTO participants (conversation_id, user_id, role) VALUES ($1, $2, 'OWNER')`,
      [groupId, ownerId]
    );

    if (memberIds && memberIds.length > 0) {
      const friendIds = await friendRepository.getFriendUserIds(ownerId);
      const friendSet = new Set(friendIds);
      const uniqueMembers = [...new Set(memberIds)].filter((id) => id !== ownerId);
      const notFriends = uniqueMembers.filter((id) => !friendSet.has(id));
      if (notFriends.length > 0) {
        throw new Error("You can only add users from your friends list.");
      }
      if (uniqueMembers.length > 0) {
        const values = uniqueMembers.map((_, i) => `($1, $${i + 2}, 'MEMBER')`).join(",");
        await client.query(
          `INSERT INTO participants (conversation_id, user_id, role) VALUES ${values}`,
          [groupId, ...uniqueMembers]
        );
      }
    }

    await client.query("COMMIT");
    return groupId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const addMembersToGroup = async (requesterId, groupId, newMemberIds) => {
  const role = await getParticipantRole(groupId, requesterId);
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("FORBIDDEN: Only Owner or Admin can add members.");
  }

  const details = await findGroupDetails(groupId);
  if (!details) throw new Error("Group not found.");

  const existingIds = (details.members || []).map((m) => m.id);
  const toAdd = newMemberIds.filter((id) => !existingIds.includes(id));

  if (toAdd.length === 0) {
    return { added: 0, message: "No new members to add." };
  }

  const friendIds = await friendRepository.getFriendUserIds(requesterId);
  const friendSet = new Set(friendIds);
  const notFriends = toAdd.filter((id) => !friendSet.has(id));
  if (notFriends.length > 0) {
    throw new Error("You can only add users from your friends list.");
  }

  await insertParticipants(groupId, toAdd, "MEMBER");
  return { added: toAdd.length, message: "Members added successfully." };
};

export const deleteGroupService = async (userId, groupId) => {
  const role = await getParticipantRole(groupId, userId);
  if (role !== "OWNER") {
    throw new Error("FORBIDDEN: Only the owner can delete this group.");
  }
  await deleteGroup(groupId);
};

export const renameGroupService = async (userId, groupId, name) => {
  const role = await getParticipantRole(groupId, userId);
  if (role !== "OWNER") {
    throw new Error("FORBIDDEN: Only the owner can rename this group.");
  }
  if (!name?.trim()) {
    throw new Error("Group name cannot be empty.");
  }
  return await updateGroupName(groupId, name.trim());
};

export const leaveGroupService = async (userId, groupId) => {
  const role = await getParticipantRole(groupId, userId);
  if (!role) {
    throw new Error("FORBIDDEN: You are not a member of this group.");
  }

  if (role === "OWNER") {
    throw new Error("FORBIDDEN: Group owner cannot leave the group. Delete it instead.");
  }

  await removeParticipant(groupId, userId);
  return { message: "Left group successfully" };
};
