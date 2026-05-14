import { pool } from "../../../config/dbconfig.js";

const buildPaginationMeta = (total, page, limit) => {
  const safeTotal = Number.parseInt(total, 10) || 0;
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
};

// 🔥 tìm direct conversation đã tồn tại
export const findDirectConversation = async (userA, userB) => {
  const result = await pool.query(
    `SELECT c.id
     FROM conversations c
     JOIN participants p1 ON c.id = p1.conversation_id
     JOIN participants p2 ON c.id = p2.conversation_id
     WHERE c.type = 'direct'
       AND (
         (p1.user_id = $1 AND p2.user_id = $2)
         OR
         (p1.user_id = $2 AND p2.user_id = $1)
       )
     LIMIT 1`,
    [userA, userB],
  );

  return result.rows[0]?.id;
};

// 🔥 tạo conversation
export const insertConversation = async ({ type, ownerId, name }) => {
  const result = await pool.query(
    `INSERT INTO conversations (type, name, owner_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [type, name || null, ownerId],
  );

  return result.rows[0].id;
};

// 🔥 thêm participants
export const insertParticipants = async (conversationId, members) => {
  const values = members.map((_, i) => `($1, $${i + 2})`).join(",");

  await pool.query(
    `INSERT INTO participants (conversation_id, user_id)
     VALUES ${values}`,
    [conversationId, ...members],
  );
};

// 🔥 get conversations của user
const buildTypeCondition = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  if (!normalized) return "";

  if (normalized === "direct" || normalized === "dm") {
    return " AND (LOWER(c.type::text) = 'direct' OR LOWER(c.type::text) = 'dm') ";
  }

  if (normalized === "group") {
    return " AND LOWER(c.type::text) = 'group' ";
  }

  return "";
};

const buildKeywordCondition = (keyword, startIndex = 2) => {
  const term = String(keyword || "").trim();
  if (!term) return { clause: "", params: [] };

  return {
    clause: `
      AND (
        c.last_message_content ILIKE $${startIndex}
        OR c.name ILIKE $${startIndex}
        OR EXISTS (
          SELECT 1
          FROM participants p2
          JOIN users u2 ON u2.user_id = p2.user_id
          LEFT JOIN user_profiles up2 ON up2.user_id = u2.user_id
          WHERE p2.conversation_id = c.id
            AND p2.user_id != $1
            AND (
              u2.username ILIKE $${startIndex}
              OR u2.email ILIKE $${startIndex}
              OR COALESCE(up2.full_name, '') ILIKE $${startIndex}
            )
        )
      )
    `,
    params: [`%${term}%`],
  };
};

export const findUserConversations = async (
  userId,
  { page = 1, limit = 20, paginated = false, type = "", keyword = "" } = {}
) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const offset = (safePage - 1) * safeLimit;
  const typeCondition = buildTypeCondition(type);
  const keywordCondition = buildKeywordCondition(keyword, 2);
  const baseParams = [userId, ...keywordCondition.params];

  const baseDetailQuery = `
    SELECT 
      c.id,
      c.type,
      c.name,
      c.owner_id,
      c.last_message_content,
      c.last_message_sender,
      c.last_message_at,
      c.created_at,
      c.updated_at,
      json_agg(
        json_build_object(
          'id', u.user_id,
          'username', u.username,
          'full_name', up.full_name,
          'avatar_url', up.avatar_url
        )
      ) AS members,
      (
        SELECT json_build_object(
          'id', u2.user_id,
          'username', u2.username,
          'full_name', up2.full_name,
          'avatar_url', up2.avatar_url
        )
        FROM participants p2
        JOIN users u2 ON u2.user_id = p2.user_id
        LEFT JOIN user_profiles up2 ON up2.user_id = u2.user_id
        WHERE p2.conversation_id = c.id
          AND p2.user_id != $1
        LIMIT 1
      ) AS friend
    FROM conversations c
    JOIN participants p ON p.conversation_id = c.id
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.user_id
    WHERE c.id IN (
      SELECT conversation_id
      FROM participants
      WHERE user_id = $1
    )
    ${typeCondition}
    ${keywordCondition.clause}
    GROUP BY c.id
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;

  if (!paginated) {
    const result = await pool.query(baseDetailQuery, baseParams);
    return result.rows;
  }

  const countQuery = pool.query(
    `
      SELECT COUNT(DISTINCT c.id)::int AS total
      FROM conversations c
      WHERE EXISTS (
        SELECT 1
        FROM participants self_p
        WHERE self_p.conversation_id = c.id
          AND self_p.user_id = $1
      )
      ${typeCondition}
      ${keywordCondition.clause}
    `,
    baseParams
  );

  const limitPlaceholder = `$${baseParams.length + 1}`;
  const offsetPlaceholder = `$${baseParams.length + 2}`;

  const paginatedQuery = pool.query(
    `
      WITH selected AS (
        SELECT c.id, c.last_message_at, c.created_at
        FROM conversations c
        WHERE EXISTS (
          SELECT 1
          FROM participants self_p
          WHERE self_p.conversation_id = c.id
            AND self_p.user_id = $1
        )
        ${typeCondition}
        ${keywordCondition.clause}
        ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
        LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
      )
      SELECT 
        c.id,
        c.type,
        c.name,
        c.owner_id,
        c.last_message_content,
        c.last_message_sender,
        c.last_message_at,
        c.created_at,
        c.updated_at,
        json_agg(
          json_build_object(
            'id', u.user_id,
            'username', u.username,
            'full_name', up.full_name,
            'avatar_url', up.avatar_url
          )
        ) AS members,
        (
          SELECT json_build_object(
            'id', u2.user_id,
            'username', u2.username,
            'full_name', up2.full_name,
            'avatar_url', up2.avatar_url
          )
          FROM participants p2
          JOIN users u2 ON u2.user_id = p2.user_id
          LEFT JOIN user_profiles up2 ON up2.user_id = u2.user_id
          WHERE p2.conversation_id = c.id
            AND p2.user_id != $1
          LIMIT 1
        ) AS friend
      FROM selected s
      JOIN conversations c ON c.id = s.id
      JOIN participants p ON p.conversation_id = c.id
      JOIN users u ON u.user_id = p.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.user_id
      GROUP BY c.id, s.last_message_at, s.created_at
      ORDER BY s.last_message_at DESC NULLS LAST, s.created_at DESC
    `,
    [...baseParams, safeLimit, offset]
  );

  const [countResult, dataResult] = await Promise.all([countQuery, paginatedQuery]);
  const total = countResult.rows[0]?.total || 0;

  return {
    data: dataResult.rows,
    pagination: buildPaginationMeta(total, safePage, safeLimit),
  };
};
