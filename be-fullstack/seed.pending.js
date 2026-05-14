import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

dotenv.config();

const { Client } = pg;

const TARGET_USER_ID = process.env.SEED_TARGET_USER_ID || "f07bc12f-222d-4040-8861-b6ae08dbd12e";
const TARGET_USERNAME = process.env.SEED_TARGET_USERNAME || "tamPhuc";
const TARGET_EMAIL = process.env.SEED_TARGET_EMAIL || "tapu@gmail.com";
const PENDING_TO_ADD = Number(process.env.SEED_PENDING_TO_ADD || 10);
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "123456";
const SALT_ROUNDS = 10;
const PENDING_USER_PREFIX = process.env.SEED_PENDING_USER_PREFIX || "pending_user";

const isSupabase = (process.env.DATABASE_URL || "").includes("supabase.com");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});

const assertEnv = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment (.env).");
  }
};

const toInt = (value) => Number.parseInt(value, 10) || 0;

const tableExists = async (tableName) => {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName]
  );
  return result.rows[0]?.exists === true;
};

const columnExists = async (tableName, columnName) => {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [tableName, columnName]
  );
  return result.rows[0]?.exists === true;
};

const getEnumValues = async (tableName, columnName) => {
  const result = await client.query(
    `
      SELECT e.enumlabel
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = 'public'
        AND c.relname = $1
        AND a.attname = $2
      ORDER BY e.enumsortorder
    `,
    [tableName, columnName]
  );
  return result.rows.map((row) => row.enumlabel);
};

const pickPendingStatus = async () => {
  const enumValues = await getEnumValues("friendships", "status");
  if (enumValues.includes("PENDING")) return "PENDING";
  if (enumValues.includes("pending")) return "pending";
  return "PENDING";
};

const findTargetUser = async () => {
  const byId = await client.query(
    `
      SELECT user_id, username, email
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [TARGET_USER_ID]
  );
  if (byId.rows[0]) return byId.rows[0];

  const byNameOrEmail = await client.query(
    `
      SELECT user_id, username, email
      FROM users
      WHERE username = $1 OR email = $2
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1
    `,
    [TARGET_USERNAME, TARGET_EMAIL]
  );

  return byNameOrEmail.rows[0] || null;
};

const getCandidateUsersWithoutRelationship = async (targetUserId, limit) => {
  const result = await client.query(
    `
      SELECT u.user_id, u.username, u.email
      FROM users u
      WHERE u.user_id <> $1
        AND NOT EXISTS (
          SELECT 1
          FROM friendships f
          WHERE (f.requester_id = u.user_id AND f.addressee_id = $1)
             OR (f.requester_id = $1 AND f.addressee_id = u.user_id)
        )
      ORDER BY u.created_at DESC NULLS LAST
      LIMIT $2
    `,
    [targetUserId, limit]
  );
  return result.rows;
};

const createOnePendingUser = async ({ passwordHash, index, hasShortDescription }) => {
  let attempt = 0;
  while (attempt < 20) {
    attempt += 1;
    const unique = `${Date.now().toString(36)}_${index}_${Math.floor(Math.random() * 1e6)}`;
    const username = `${PENDING_USER_PREFIX}_${unique}`;
    const email = `${PENDING_USER_PREFIX}_${unique}@mail.com`;
    const userId = randomUUID();

    const insertUser = await client.query(
      `
        INSERT INTO users (user_id, username, email, password_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING user_id, username, email
      `,
      [userId, username, email, passwordHash]
    );

    if (!insertUser.rows[0]) {
      continue;
    }

    const created = insertUser.rows[0];

    if (await tableExists("user_profiles")) {
      const fields = ["user_id", "full_name", "avatar_url"];
      const values = [
        created.user_id,
        `Pending User ${index + 1}`,
        `https://i.pravatar.cc/150?u=${created.user_id}`,
      ];

      if (hasShortDescription) {
        fields.push("short_description");
        values.push("Pending friend request for testing.");
      }

      const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");
      await client.query(
        `INSERT INTO user_profiles (${fields.join(", ")}) VALUES (${placeholders})`,
        values
      );
    }

    return created;
  }

  throw new Error("Could not create unique pending requester user after multiple attempts.");
};

const createPendingUsers = async (count) => {
  if (count <= 0) return [];

  const hasShortDescription = await columnExists("user_profiles", "short_description");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const created = [];

  for (let i = 0; i < count; i += 1) {
    const user = await createOnePendingUser({ passwordHash, index: i, hasShortDescription });
    created.push(user);
  }

  return created;
};

const countPendingRequestsForTarget = async (targetUserId, pendingStatus) => {
  const result = await client.query(
    `
      SELECT COUNT(*)::int AS total
      FROM friendships
      WHERE addressee_id = $1
        AND status = $2
    `,
    [targetUserId, pendingStatus]
  );
  return toInt(result.rows[0]?.total);
};

const insertPendingRequests = async (requesters, targetUserId, pendingStatus) => {
  let inserted = 0;

  for (const requester of requesters) {
    const result = await client.query(
      `
        INSERT INTO friendships (requester_id, addressee_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (requester_id, addressee_id) DO NOTHING
        RETURNING friendship_id
      `,
      [requester.user_id, targetUserId, pendingStatus]
    );

    if (result.rowCount > 0) inserted += 1;
  }

  return inserted;
};

async function seedPendingRequests() {
  assertEnv();
  await client.connect();

  try {
    if (!(await tableExists("users"))) throw new Error("Table 'users' not found.");
    if (!(await tableExists("friendships"))) throw new Error("Table 'friendships' not found.");

    const targetUser = await findTargetUser();
    if (!targetUser) {
      throw new Error(
        `Target user not found. Checked user_id='${TARGET_USER_ID}', username='${TARGET_USERNAME}', email='${TARGET_EMAIL}'.`
      );
    }

    const pendingStatus = await pickPendingStatus();
    const beforePending = await countPendingRequestsForTarget(targetUser.user_id, pendingStatus);

    console.log("[seed:pending] Start");
    console.log(
      `[seed:pending] target=${targetUser.username} (${targetUser.user_id}) | add=${PENDING_TO_ADD} | existingPending=${beforePending}`
    );

    await client.query("BEGIN");

    let requesters = await getCandidateUsersWithoutRelationship(targetUser.user_id, PENDING_TO_ADD);
    if (requesters.length < PENDING_TO_ADD) {
      const missing = PENDING_TO_ADD - requesters.length;
      const createdUsers = await createPendingUsers(missing);
      requesters = [...requesters, ...createdUsers];
      console.log(`[seed:pending] Created extra users for pending requests: ${createdUsers.length}`);
    }

    const selectedRequesters = requesters.slice(0, PENDING_TO_ADD);
    const inserted = await insertPendingRequests(selectedRequesters, targetUser.user_id, pendingStatus);

    await client.query("COMMIT");

    const afterPending = await countPendingRequestsForTarget(targetUser.user_id, pendingStatus);
    console.log(`[seed:pending] Inserted pending requests: ${inserted}/${PENDING_TO_ADD}`);
    console.log(`[seed:pending] Pending now for ${targetUser.username}: ${afterPending}`);
    console.log("[seed:pending] Done");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

seedPendingRequests().catch((error) => {
  console.error("[seed:pending] Error:", error.message || error);
  process.exit(1);
});
