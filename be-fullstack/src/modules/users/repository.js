import { pool } from "../../../config/dbconfig.js";

/**
 * Base select query để tái sử dụng
 * Trả user + profile dạng nested JSON
 */
const baseSelect = `
  SELECT 
    u.user_id AS id,
    u.username,
    u.email,
    u.created_at,
    u.updated_at,

    json_build_object(
      'full_name', p.full_name,
      'title', p.title,
      'phone', p.phone,
      'location', p.location,
      'website', p.website,
      'bio', p.bio,
      'privacy', p.privacy,
      'hobbies', COALESCE(p.hobbies, '[]'::jsonb),
      'skills', COALESCE(p.skills, '[]'::jsonb),
      'education', COALESCE(p.education, '[]'::jsonb),
      'avatar_url', p.avatar_url,
      'cover_url', p.cover_url,
      'theme', COALESCE(p.theme, 'light')
    ) AS profile

  FROM users u
  LEFT JOIN user_profiles p 
    ON u.user_id = p.user_id
`;

class UserRepository {

  /* =========================
     CREATE USER
  ========================== */
  async create(user) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `
          INSERT INTO users (username, email, password_hash)
          VALUES ($1, $2, $3)
          RETURNING *
        `,
        [user.username, user.email, user.password_hash]
      );

      // Tạo profile rỗng cho user mới
      await client.query(
        `
          INSERT INTO user_profiles (user_id)
          VALUES ($1)
        `,
        [rows[0].user_id]
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


async getAll({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const dataQuery = pool.query(
    `
      ${baseSelect}
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT $1
      OFFSET $2
    `,
    [limit, offset]
  );

  const countQuery = pool.query(
    `
      SELECT COUNT(*) 
      FROM users
      WHERE deleted_at IS NULL
    `
  );

  const [dataResult, countResult] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  /* =========================
     FIND BY ID
  ========================== */
  async findById(id) {
    const { rows } = await pool.query(
      `
        ${baseSelect}
        WHERE u.user_id = $1
          AND u.deleted_at IS NULL
      `,
      [id]
    );

    return rows[0];
  }

  /* =========================
     FIND BY EMAIL (Login)
  ========================== */
  async findByEmail(email) {
    const { rows } = await pool.query(
      `
        SELECT 
          u.user_id AS id,
          u.username,
          u.email,
          u.password_hash,
          u.created_at,
          u.updated_at,

          json_build_object(
            'full_name', p.full_name,
            'title', p.title,
            'phone', p.phone,
            'location', p.location,
            'website', p.website,
            'bio', p.bio,
            'privacy', p.privacy,
            'hobbies', COALESCE(p.hobbies, '[]'::jsonb),
            'skills', COALESCE(p.skills, '[]'::jsonb),
            'education', COALESCE(p.education, '[]'::jsonb),
            'avatar_url', p.avatar_url,
            'cover_url', p.cover_url,
            'theme', COALESCE(p.theme, 'light')
          ) AS profile

        FROM users u
        LEFT JOIN user_profiles p 
          ON u.user_id = p.user_id
        WHERE u.email = $1
          AND u.deleted_at IS NULL
      `,
      [email]
    );

    return rows[0];
  }

  /* =========================
     SEARCH USER BY NAME
  ========================== */
 /* =========================
   SEARCH USER (PAGINATION)
========================== */
async findByName(name, { page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const dataQuery = pool.query(
    `
      ${baseSelect}
      WHERE (u.username ILIKE $1 OR u.email ILIKE $1)
        AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT $2
      OFFSET $3
    `,
    [`%${name}%`, limit, offset]
  );

  const countQuery = pool.query(
    `
      SELECT COUNT(*)
      FROM users
      WHERE (username ILIKE $1 OR email ILIKE $1)
        AND deleted_at IS NULL
    `,
    [`%${name}%`]
  );

  const [dataResult, countResult] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  /* =========================
     UPDATE USER PROFILE
  ========================== */
  async updateProfile(userId, profileData) {
    const {
      full_name,
      title,
      phone,
      location,
      website,
      bio,
      short_description,
      avatar_url,
      cover_url,
      hobbies,
      skills,
      education,
      privacy,
      theme,
    } = profileData;

    const { rows } = await pool.query(
      `
        UPDATE user_profiles
        SET 
          full_name = COALESCE($2, full_name),
          title = COALESCE($3, title),
          phone = COALESCE($4, phone),
          location = COALESCE($5, location),
          website = COALESCE($6, website),
          bio = COALESCE($7, bio),
          short_description = COALESCE($8, short_description),
          avatar_url = COALESCE($9, avatar_url),
          cover_url = COALESCE($10, cover_url),
          hobbies = COALESCE($11::jsonb, hobbies),
          skills = COALESCE($12::jsonb, skills),
          education = COALESCE($13::jsonb, education),
          privacy = COALESCE($14, privacy),
          theme = COALESCE($15, theme),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `,
      [
        userId,
        full_name,
        title,
        phone,
        location,
        website,
        bio,
        short_description,
        avatar_url,
        cover_url,
        hobbies ? JSON.stringify(hobbies) : null,
        skills ? JSON.stringify(skills) : null,
        education ? JSON.stringify(education) : null,
        privacy,
        theme,
      ]
    );

    return rows[0];
  }

  /* =========================
     SOFT DELETE USER
  ========================== */
  async softDelete(id) {
    const { rowCount } = await pool.query(
      `
        UPDATE users
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `,
      [id]
    );

    return rowCount > 0;
  }
}

export default new UserRepository();
