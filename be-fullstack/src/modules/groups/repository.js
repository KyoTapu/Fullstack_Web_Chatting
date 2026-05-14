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

const buildSearchClause = (keyword, startIndex = 2) => {
  const term = String(keyword || "").trim();
  if (!term) return { clause: "", params: [] };

  return {
    clause: `
      AND (
        c.name ILIKE $${startIndex}
        OR EXISTS (
          SELECT 1
          FROM participants sp
          JOIN users su ON su.user_id = sp.user_id
          LEFT JOIN user_profiles sup ON sup.user_id = su.user_id
          WHERE sp.conversation_id = c.id
            AND (
              su.username ILIKE $${startIndex}
              OR su.email ILIKE $${startIndex}
              OR COALESCE(sup.full_name, '') ILIKE $${startIndex}
            )
        )
      )
    `,
    params: [`%${term}%`],
  };
};

export const insertParticipants = async (conversationId, members, role) => {
  if (!members || members.length === 0) return;
  const values = members.map((_, i) => `($1, $${i + 2}, '${role}')`).join(",");

  await pool.query(
    `INSERT INTO participants (conversation_id, user_id, role)
     VALUES ${values}`,
    [conversationId, ...members]
  );
};

export const getParticipantRole = async (conversationId, userId) => {
  const result = await pool.query(
    `SELECT role FROM participants 
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  return result.rows[0]?.role || null;
};

export const findGroupDetails = async (conversationId) => {
  const result = await pool.query(
    `SELECT 
      c.id, c.name, c.type, c.owner_id, c.created_at,
      json_agg(
        json_build_object(
          'id', u.user_id,
          'username', u.username,
          'full_name', up.full_name,
          'avatar_url', up.avatar_url,
          'role', p.role
        )
      ) AS members
     FROM conversations c
     JOIN participants p ON p.conversation_id = c.id
     JOIN users u ON u.user_id = p.user_id
     LEFT JOIN user_profiles up ON up.user_id = u.user_id
     WHERE c.id = $1 AND c.type = 'group'
     GROUP BY c.id`,
    [conversationId]
  );
  return result.rows[0];
};

export const findUserGroups = async (userId, { page = 1, limit = 20, paginated = false, keyword = "" } = {}) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const offset = (safePage - 1) * safeLimit;
  const search = buildSearchClause(keyword, 2);
  const baseParams = [userId, ...search.params];

  const baseFilter = `
    WHERE c.type = 'group'
      AND EXISTS (
        SELECT 1
        FROM participants me
        WHERE me.conversation_id = c.id
          AND me.user_id = $1
      )
      ${search.clause}
  `;
  const baseSelect = `
    FROM conversations c
  `;

  const dataSql = `
    SELECT 
      c.id, c.name, c.type, c.owner_id, c.last_message_content, c.last_message_at,
      json_agg(
        json_build_object(
          'id', u.user_id,
          'username', u.username,
          'full_name', up.full_name,
          'avatar_url', up.avatar_url,
          'role', p.role
        )
      ) AS members
    ${baseSelect}
    JOIN participants p ON p.conversation_id = c.id
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.user_id
    ${baseFilter}
    GROUP BY c.id
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  `;

  if (!paginated) {
    const result = await pool.query(dataSql, baseParams);
    return result.rows;
  }

  const countResult = await pool.query(
    `
      SELECT COUNT(DISTINCT c.id)::int AS total
      ${baseSelect}
      ${baseFilter}
    `,
    baseParams
  );

  const limitPlaceholder = `$${baseParams.length + 1}`;
  const offsetPlaceholder = `$${baseParams.length + 2}`;

  const dataResult = await pool.query(
    `
      WITH selected AS (
        SELECT c.id, c.last_message_at, c.created_at
        ${baseSelect}
        ${baseFilter}
        ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
        LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
      )
      SELECT 
        c.id, c.name, c.type, c.owner_id, c.last_message_content, c.last_message_at,
        json_agg(
          json_build_object(
            'id', u.user_id,
            'username', u.username,
            'full_name', up.full_name,
            'avatar_url', up.avatar_url,
            'role', p.role
          )
        ) AS members
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

  const total = countResult.rows[0]?.total || 0;
  return {
    data: dataResult.rows,
    pagination: buildPaginationMeta(total, safePage, safeLimit),
  };
};

export const deleteGroup = async (groupId) => {
  await pool.query(`DELETE FROM messages WHERE conversation_id = $1`, [groupId]).catch(() => {});
  await pool.query(`DELETE FROM participants WHERE conversation_id = $1`, [groupId]);
  await pool.query(`DELETE FROM conversations WHERE id = $1 AND type = 'group'`, [groupId]);
};

export const updateGroupName = async (groupId, name) => {
  const result = await pool.query(
    `UPDATE conversations SET name = $1 WHERE id = $2 AND type = 'group' RETURNING id, name`,
    [name, groupId]
  );
  return result.rows[0];
};

export const removeParticipant = async (groupId, userId) => {
  await pool.query(
    `DELETE FROM participants WHERE conversation_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
};
