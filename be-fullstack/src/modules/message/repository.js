import { pool } from "../../../config/dbconfig.js";

export const checkParticipant = async (conversationId, userId) => {
  const result = await pool.query(
    `SELECT 1 FROM participants 
     WHERE conversation_id=$1 AND user_id=$2`,
    [conversationId, userId]
  );

  return result.rowCount > 0;
};

export const updateLastMessage = async ({
  conversationId,
  senderId,
  content
}) => {
  await pool.query(
    `UPDATE conversations
     SET last_message_content = $1,
         last_message_sender = $2,
         last_message_at = NOW()
     WHERE id = $3`,
    [content, senderId, conversationId]
  );
};

export const setLastMessageSnapshot = async ({
  conversationId,
  senderId = null,
  content = null,
  lastMessageAt = null,
}) => {
  await pool.query(
    `UPDATE conversations
     SET last_message_content = $1,
         last_message_sender = $2,
         last_message_at = $3
     WHERE id = $4`,
    [content, senderId, lastMessageAt, conversationId]
  );
};

export const createConversation = async (senderId) => {
  const result = await pool.query(
    `INSERT INTO conversations (type, owner_id)
     VALUES ('direct', $1)
     RETURNING id`,
    [senderId]
  );

  return result.rows[0].id;
};

export const addParticipants = async (conversationId, senderId, recipientId) => {
  await pool.query(
    `INSERT INTO participants (conversation_id, user_id)
     VALUES ($1, $2), ($1, $3)`,
    [conversationId, senderId, recipientId]
  );
};

export const findDirectConversation = async (userA, userB) => {
  const result = await pool.query(
    `
    SELECT c.id
    FROM conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM participants p
      WHERE p.conversation_id = c.id AND p.user_id = $1
    )
    AND EXISTS (
      SELECT 1 FROM participants p
      WHERE p.conversation_id = c.id AND p.user_id = $2
    )
    LIMIT 1
    `,
    [userA, userB]
  );

  return result.rows[0]?.id;
};
