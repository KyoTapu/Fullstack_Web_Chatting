import { pool } from "../../../config/dbconfig.js";

const baseSelect = `
  SELECT 
    u.user_id AS id,
    u.username,
    u.email,
    u.created_at,
    u.updated_at,
    p.avatar_url,
    p.full_name,
    p.short_description
  FROM users u
  LEFT JOIN user_profiles p 
    ON u.user_id = p.user_id
`;

class FriendRepository {
  buildSearchClause(keyword, startIndex = 2) {
    const term = String(keyword || "").trim();
    if (!term) {
      return { clause: "", params: [] };
    }

    return {
      clause: `
        AND (
          u.username ILIKE $${startIndex}
          OR u.email ILIKE $${startIndex}
          OR COALESCE(p.full_name, '') ILIKE $${startIndex}
          OR COALESCE(p.short_description, '') ILIKE $${startIndex}
        )
      `,
      params: [`%${term}%`],
    };
  }

  buildPaginationMeta(total, page, limit) {
    const safeTotal = Number.parseInt(total, 10) || 0;
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
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
  }

  // Check if friendship exists (pending, accepted, or blocked)
  async getFriendshipStatus(userA, userB) {
    const { rows } = await pool.query(
      `
      SELECT * FROM friendships 
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)
      ORDER BY updated_at DESC, created_at DESC
      `,
      [userA, userB]
    );
    return rows[0];
  }

  async findBlockedRelationship(userA, userB) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM friendships
      WHERE status = 'BLOCKED'
        AND (
          (requester_id = $1 AND addressee_id = $2)
          OR
          (requester_id = $2 AND addressee_id = $1)
        )
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
      `,
      [userA, userB]
    );

    return rows[0] || null;
  }

  // Find specifically a pending request sent to the user
  async findPendingRequest(requestId) {
    const { rows } = await pool.query(
      `
      SELECT * FROM friendships 
      WHERE friendship_id = $1 AND status = 'PENDING'
      `,
      [requestId]
    );
    return rows[0];
  }

  // Create PENDING request
  async sendRequest(requesterId, addresseeId) {
    const { rows } = await pool.query(
      `
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES ($1, $2, 'PENDING')
      RETURNING *
      `,
      [requesterId, addresseeId]
    );
    return rows[0];
  }

  // Accept request
  async acceptRequest(friendshipId) {
    const { rows } = await pool.query(
      `
      UPDATE friendships
      SET status = 'ACCEPTED', updated_at = NOW()
      WHERE friendship_id = $1
      RETURNING *
      `,
      [friendshipId]
    );
    return rows[0];
  }

  // Delete/Decline request
  async removeFriendship(friendshipId) {
    await pool.query(
      `
      DELETE FROM friendships
      WHERE friendship_id = $1
      `,
      [friendshipId]
    );
  }

  async blockUser(blockerId, blockedUserId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        DELETE FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1)
        `,
        [blockerId, blockedUserId]
      );

      const { rows } = await client.query(
        `
        INSERT INTO friendships (requester_id, addressee_id, status)
        VALUES ($1, $2, 'BLOCKED')
        RETURNING *
        `,
        [blockerId, blockedUserId]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async unblockUser(blockerId, blockedUserId) {
    const { rows } = await pool.query(
      `
      DELETE FROM friendships
      WHERE requester_id = $1
        AND addressee_id = $2
        AND status = 'BLOCKED'
      RETURNING *
      `,
      [blockerId, blockedUserId]
    );

    return rows[0] || null;
  }

  // Get My Friends
  async getFriends(userId, { page = 1, limit = 10, paginated = false, keyword = "" } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
    const offset = (safePage - 1) * safeLimit;
    const search = this.buildSearchClause(keyword, 2);

    const friendListBaseQuery = `
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      JOIN friendships f
        ON (
          (f.requester_id = u.user_id AND f.addressee_id = $1)
          OR
          (f.addressee_id = u.user_id AND f.requester_id = $1)
        )
      WHERE f.status = 'ACCEPTED'
        AND u.user_id != $1
        ${search.clause}
    `;

    const baseParams = [userId, ...search.params];

    if (!paginated) {
      const { rows } = await pool.query(
        `
        SELECT DISTINCT
          u.user_id AS id,
          u.username,
          u.email,
          u.created_at,
          u.updated_at,
          p.avatar_url,
          p.full_name,
          p.short_description
        ${friendListBaseQuery}
        ORDER BY u.username ASC
        `,
        baseParams
      );
      return rows;
    }

    const dataParams = [...baseParams, safeLimit, offset];
    const limitPlaceholder = `$${baseParams.length + 1}`;
    const offsetPlaceholder = `$${baseParams.length + 2}`;

    const dataQuery = pool.query(
      `
      SELECT DISTINCT
        u.user_id AS id,
        u.username,
        u.email,
        u.created_at,
        u.updated_at,
        p.avatar_url,
        p.full_name,
        p.short_description
      ${friendListBaseQuery}
      ORDER BY u.username ASC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
      `,
      dataParams
    );

    const countQuery = pool.query(
      `
      SELECT COUNT(DISTINCT u.user_id)::int AS total
      ${friendListBaseQuery}
      `,
      baseParams
    );

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = countResult.rows[0]?.total || 0;

    return {
      data: dataResult.rows,
      pagination: this.buildPaginationMeta(total, safePage, safeLimit),
    };
  }

  /** UUIDs of accepted friends (excludes self) — for group invite validation */
  async getFriendUserIds(userId) {
    const { rows } = await pool.query(
      `
      SELECT u.user_id
      FROM users u
      JOIN friendships f
        ON (f.requester_id = u.user_id AND f.addressee_id = $1)
        OR (f.addressee_id = u.user_id AND f.requester_id = $1)
      WHERE f.status = 'ACCEPTED' AND u.user_id != $1
      `,
      [userId]
    );
    return rows.map((r) => r.user_id);
  }

  // Get Pending Requests targeted to me
  async getPendingRequests(userId) {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      JOIN friendships f ON f.requester_id = u.user_id
      WHERE f.addressee_id = $1 AND f.status = 'PENDING'
      ORDER BY f.created_at DESC
      `,
      [userId]
    );
    
    // Attach the friendship_id so we can easily accept/decline
    return rows.map((row, index) => {
      // Small trick: since baseSelect doesn't return friendship_id, 
      // let's adjust query to get friendship_id.
      return row;
    });
  }

  // Get Pending Requests - fixed version returning friendship details
  async getPendingRequestsWithId(userId, { page = 1, limit = 20, paginated = false } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
    const offset = (safePage - 1) * safeLimit;

    const basePendingQuery = `
      FROM friendships f
      JOIN users u ON u.user_id = f.requester_id
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      WHERE f.addressee_id = $1
        AND f.status = 'PENDING'
    `;

    if (!paginated) {
      const { rows } = await pool.query(
        `
        SELECT 
          f.friendship_id,
          f.created_at as request_date,
          u.user_id AS id,
          u.username,
          u.email,
          p.avatar_url,
          p.full_name,
          p.short_description
        ${basePendingQuery}
        ORDER BY f.created_at DESC
        `,
        [userId]
      );
      return rows;
    }

    const dataQuery = pool.query(
      `
      SELECT 
        f.friendship_id,
        f.created_at as request_date,
        u.user_id AS id,
        u.username,
        u.email,
        p.avatar_url,
        p.full_name,
        p.short_description
      ${basePendingQuery}
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, safeLimit, offset]
    );

    const countQuery = pool.query(
      `
      SELECT COUNT(*)::int AS total
      ${basePendingQuery}
      `,
      [userId]
    );

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = countResult.rows[0]?.total || 0;

    return {
      data: dataResult.rows,
      pagination: this.buildPaginationMeta(total, safePage, safeLimit),
    };
  }

  async getBlockedUsers(userId, { page = 1, limit = 20, paginated = false, keyword = "" } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
    const offset = (safePage - 1) * safeLimit;
    const search = this.buildSearchClause(keyword, 2);
    const baseParams = [userId, ...search.params];

    const blockedUsersBaseQuery = `
      FROM friendships f
      JOIN users u ON u.user_id = f.addressee_id
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      WHERE f.requester_id = $1
        AND f.status = 'BLOCKED'
        ${search.clause}
    `;

    if (!paginated) {
      const { rows } = await pool.query(
        `
        SELECT
          f.friendship_id,
          f.updated_at AS blocked_at,
          u.user_id AS id,
          u.username,
          u.email,
          p.avatar_url,
          p.full_name,
          p.short_description
        ${blockedUsersBaseQuery}
        ORDER BY f.updated_at DESC
        `,
        baseParams
      );

      return rows;
    }

    const dataQuery = pool.query(
      `
      SELECT
        f.friendship_id,
        f.updated_at AS blocked_at,
        u.user_id AS id,
        u.username,
        u.email,
        p.avatar_url,
        p.full_name,
        p.short_description
      ${blockedUsersBaseQuery}
      ORDER BY f.updated_at DESC
      LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
      `,
      [...baseParams, safeLimit, offset]
    );

    const countQuery = pool.query(
      `
      SELECT COUNT(*)::int AS total
      ${blockedUsersBaseQuery}
      `,
      baseParams
    );

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = countResult.rows[0]?.total || 0;

    return {
      data: dataResult.rows,
      pagination: this.buildPaginationMeta(total, safePage, safeLimit),
    };
  }

  // Get friendship statuses between current user and a list of users (2-way relationship)
  async getRelationshipStatuses(userId, otherUserIds = []) {
    if (!Array.isArray(otherUserIds) || otherUserIds.length === 0) return [];

    const { rows } = await pool.query(
      `
      SELECT
        f.friendship_id,
        f.status,
        f.requester_id,
        f.addressee_id,
        CASE
          WHEN f.requester_id = $1 THEN f.addressee_id
          ELSE f.requester_id
        END AS other_user_id
      FROM friendships f
      WHERE
        (f.requester_id = $1 AND f.addressee_id = ANY($2::uuid[]))
        OR
        (f.addressee_id = $1 AND f.requester_id = ANY($2::uuid[]))
      `,
      [userId, otherUserIds]
    );

    return rows;
  }

  async getSuggestions(userId, { limit = 15 } = {}) {
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 15);
    const { rows } = await pool.query(
      `
      SELECT 
        u.user_id AS id,
        u.username,
        u.email,
        p.avatar_url,
        p.full_name,
        p.short_description
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.user_id != $1
        AND NOT EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.requester_id = u.user_id AND f.addressee_id = $1)
             OR (f.addressee_id = u.user_id AND f.requester_id = $1)
        )
      ORDER BY RANDOM()
      LIMIT $2
      `,
      [userId, safeLimit]
    );
    return rows;
  }
}

export default new FriendRepository();
