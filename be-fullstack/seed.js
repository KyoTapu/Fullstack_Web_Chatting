import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

dotenv.config();

const { Client } = pg;

const SALT_ROUNDS = 10;
const NUM_USERS = Number(process.env.SEED_NUM_USERS || 30);
const TARGET_USER_ID = process.env.SEED_TARGET_USER_ID || "f07bc12f-222d-4040-8861-b6ae08dbd12e";
const TARGET_USERNAME = process.env.SEED_TARGET_USERNAME || "tamPhuc";
const TARGET_EMAIL = process.env.SEED_TARGET_EMAIL || "tapu@gmail.com";
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "123456";
const DIRECTS_FOR_TARGET = Number(process.env.SEED_DIRECTS_FOR_TARGET || 12);

const names = [
  "Nguyen Van A",
  "Tran Thi B",
  "Le Van C",
  "Pham Thi D",
  "Hoang Van E",
  "Vo Thi F",
  "Dang Van G",
  "Bui Thi H",
];

const skills = ["JavaScript", "React", "NodeJS", "SQL", "Docker"];
const hobbies = ["Gaming", "Music", "Travel", "Reading", "Coding"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randArr = (arr) => {
  const count = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: count }, () => rand(arr));
};

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

const logCheck = (label, ok, detail = "") => {
  const status = ok ? "[ok]" : "[warn]";
  const suffix = detail ? ` -> ${detail}` : "";
  console.log(`${status} ${label}${suffix}`);
};

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

const pickConversationTypes = async () => {
  const enumValues = await getEnumValues("conversations", "type");
  if (enumValues.includes("DM") && enumValues.includes("GROUP")) {
    return { dm: "DM", group: "GROUP" };
  }
  if (enumValues.includes("direct") && enumValues.includes("group")) {
    return { dm: "direct", group: "group" };
  }
  return { dm: "direct", group: "group" };
};

const pickFriendshipAccepted = async () => {
  const enumValues = await getEnumValues("friendships", "status");
  if (enumValues.includes("ACCEPTED")) return "ACCEPTED";
  if (enumValues.includes("accepted")) return "accepted";
  return "ACCEPTED";
};

const pickParticipantRoles = async () => {
  const enumValues = await getEnumValues("participants", "role");

  if (enumValues.includes("OWNER") && enumValues.includes("MEMBER")) {
    return { owner: "OWNER", member: "MEMBER" };
  }

  if (enumValues.includes("owner") && enumValues.includes("member")) {
    return { owner: "owner", member: "member" };
  }

  return { owner: "OWNER", member: "MEMBER" };
};

const truncateExistingTables = async () => {
  const orderedTables = ["participants", "messages", "friendships", "conversations", "user_profiles", "users"];
  const existing = [];

  for (const table of orderedTables) {
    if (await tableExists(table)) existing.push(table);
  }

  if (!existing.length) return;

  const quoted = existing.map((t) => `"${t}"`).join(", ");
  await client.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
  return existing;
};

const seedUsers = async () => {
  const users = [];
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  users.push({
    user_id: TARGET_USER_ID,
    username: TARGET_USERNAME,
    email: TARGET_EMAIL,
    password_hash: passwordHash,
  });

  for (let i = 1; i <= NUM_USERS; i += 1) {
    users.push({
      user_id: randomUUID(),
      username: `user${i}`,
      email: `user${i}@mail.com`,
      password_hash: passwordHash,
    });
  }

  for (const user of users) {
    await client.query(
      `
        INSERT INTO users (user_id, username, email, password_hash)
        VALUES ($1, $2, $3, $4)
      `,
      [user.user_id, user.username, user.email, user.password_hash]
    );
  }

  return users;
};

const seedProfiles = async (users) => {
  const hasShortDescription = await columnExists("user_profiles", "short_description");
  const hasTheme = await columnExists("user_profiles", "theme");

  for (const user of users) {
    const fields = [
      "user_id",
      "full_name",
      "title",
      "bio",
      "hobbies",
      "skills",
      "avatar_url",
    ];

    const values = [
      user.user_id,
      rand(names),
      "Software Developer",
      "Love building scalable systems.",
      JSON.stringify(randArr(hobbies)),
      JSON.stringify(randArr(skills)),
      `https://i.pravatar.cc/150?u=${user.user_id}`,
    ];

    if (hasShortDescription) {
      fields.push("short_description");
      values.push("Friendly and active teammate.");
    }

    if (hasTheme) {
      fields.push("theme");
      values.push("light");
    }

    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");
    const sql = `INSERT INTO user_profiles (${fields.join(", ")}) VALUES (${placeholders})`;
    await client.query(sql, values);
  }

  return users.length;
};

const seedFriendships = async (users) => {
  if (!(await tableExists("friendships"))) {
    return { acceptedStatus: null, pairCount: 0 };
  }

  const acceptedStatus = await pickFriendshipAccepted();
  const pairSet = new Set();

  const addFriendship = async (userA, userB) => {
    if (!userA || !userB || userA === userB) return;

    const [left, right] = [userA, userB].sort();
    const pairKey = `${left}:${right}`;
    if (pairSet.has(pairKey)) return;

    pairSet.add(pairKey);

    const requesterId = Math.random() > 0.5 ? userA : userB;
    const addresseeId = requesterId === userA ? userB : userA;

    await client.query(
      `
        INSERT INTO friendships (requester_id, addressee_id, status)
        VALUES ($1, $2, $3)
      `,
      [requesterId, addresseeId, acceptedStatus]
    );
  };

  for (let i = 0; i < users.length; i += 1) {
    for (let j = i + 1; j < users.length; j += 1) {
      if (Math.random() < 0.22) {
        await addFriendship(users[i].user_id, users[j].user_id);
      }
    }
  }

  for (const user of users) {
    if (user.user_id === TARGET_USER_ID) continue;
    await addFriendship(TARGET_USER_ID, user.user_id);
  }

  return {
    acceptedStatus,
    pairCount: pairSet.size,
  };
};

const seedConversations = async (users) => {
  if (!(await tableExists("conversations")) || !(await tableExists("participants"))) {
    return null;
  }

  const conversationIdCol = (await columnExists("conversations", "id")) ? "id" : "conversation_id";
  const conversationOwnerCol = (await columnExists("conversations", "owner_id")) ? "owner_id" : "created_by";
  const participantConversationCol = (await columnExists("participants", "conversation_id"))
    ? "conversation_id"
    : "conversationId";

  const conversationTypes = await pickConversationTypes();
  const participantRoles = await pickParticipantRoles();

  const targetDirects = users
    .filter((u) => u.user_id !== TARGET_USER_ID)
    .slice(0, Math.max(1, DIRECTS_FOR_TARGET));

  for (const otherUser of targetDirects) {
    const convRes = await client.query(
      `
        INSERT INTO conversations (type, ${conversationOwnerCol}, name)
        VALUES ($1, $2, $3)
        RETURNING ${conversationIdCol}
      `,
      [conversationTypes.dm, TARGET_USER_ID, null]
    );

    const convId = convRes.rows[0][conversationIdCol];

    await client.query(
      `
        INSERT INTO participants (${participantConversationCol}, user_id, role)
        VALUES ($1, $2, $3), ($1, $4, $5)
      `,
      [convId, TARGET_USER_ID, participantRoles.member, otherUser.user_id, participantRoles.member]
    );
  }

  const groupRes = await client.query(
    `
      INSERT INTO conversations (type, ${conversationOwnerCol}, name)
      VALUES ($1, $2, $3)
      RETURNING ${conversationIdCol}
    `,
    [conversationTypes.group, TARGET_USER_ID, "Dev Team"]
  );

  const groupId = groupRes.rows[0][conversationIdCol];
  const groupMembers = users.slice(0, Math.min(6, users.length));

  for (const member of groupMembers) {
    const role = member.user_id === TARGET_USER_ID ? participantRoles.owner : participantRoles.member;
    await client.query(
      `
        INSERT INTO participants (${participantConversationCol}, user_id, role)
        VALUES ($1, $2, $3)
      `,
      [groupId, member.user_id, role]
    );
  }

  return {
    conversationIdCol,
    conversationOwnerCol,
    participantConversationCol,
    conversationTypes,
    participantRoles,
    expectedDirects: targetDirects.length,
    groupMembersCount: groupMembers.length,
    groupId,
  };
};

const countTableRows = async (tableName) => {
  if (!(await tableExists(tableName))) return 0;
  const result = await client.query(`SELECT COUNT(*)::int AS total FROM "${tableName}"`);
  return toInt(result.rows[0]?.total);
};

const verifySeed = async ({ users, profileCount, friendshipMeta, conversationMeta }) => {
  const usersCount = await countTableRows("users");
  const profilesCount = await countTableRows("user_profiles");
  const friendshipsCount = await countTableRows("friendships");
  const conversationsCount = await countTableRows("conversations");
  const participantsCount = await countTableRows("participants");

  logCheck("users count", usersCount === users.length, `${usersCount}/${users.length}`);
  logCheck("profiles count", profilesCount === profileCount, `${profilesCount}/${profileCount}`);
  logCheck(
    "friendships inserted pairs",
    friendshipMeta ? friendshipsCount === friendshipMeta.pairCount : true,
    friendshipMeta ? `${friendshipsCount}/${friendshipMeta.pairCount}` : "friendships table not found"
  );

  if (friendshipMeta?.acceptedStatus) {
    const targetFriendsResult = await client.query(
      `
        SELECT COUNT(*)::int AS total
        FROM friendships
        WHERE status = $2
          AND (requester_id = $1 OR addressee_id = $1)
      `,
      [TARGET_USER_ID, friendshipMeta.acceptedStatus]
    );
    const targetFriendCount = toInt(targetFriendsResult.rows[0]?.total);
    const expectedTargetFriends = Math.max(0, users.length - 1);
    logCheck("target user friend count", targetFriendCount === expectedTargetFriends, `${targetFriendCount}/${expectedTargetFriends}`);
  }

  if (conversationMeta) {
    const expectedConversations = conversationMeta.expectedDirects + 1;
    const expectedParticipants = conversationMeta.expectedDirects * 2 + conversationMeta.groupMembersCount;

    logCheck("conversations count", conversationsCount === expectedConversations, `${conversationsCount}/${expectedConversations}`);
    logCheck("participants count", participantsCount === expectedParticipants, `${participantsCount}/${expectedParticipants}`);

    const targetDirectResult = await client.query(
      `
        SELECT COUNT(*)::int AS total
        FROM conversations c
        JOIN participants p
          ON p.${conversationMeta.participantConversationCol} = c.${conversationMeta.conversationIdCol}
        WHERE p.user_id = $1
          AND c.type = $2
      `,
      [TARGET_USER_ID, conversationMeta.conversationTypes.dm]
    );

    const targetDirectCount = toInt(targetDirectResult.rows[0]?.total);
    logCheck("target direct conversations", targetDirectCount === conversationMeta.expectedDirects, `${targetDirectCount}/${conversationMeta.expectedDirects}`);

    const groupMemberResult = await client.query(
      `
        SELECT COUNT(*)::int AS total
        FROM participants
        WHERE ${conversationMeta.participantConversationCol} = $1
      `,
      [conversationMeta.groupId]
    );
    const groupMemberCount = toInt(groupMemberResult.rows[0]?.total);
    logCheck("dev team member count", groupMemberCount === conversationMeta.groupMembersCount, `${groupMemberCount}/${conversationMeta.groupMembersCount}`);

    console.log(
      `[seed] schema: conversations(${conversationMeta.conversationIdCol}, ${conversationMeta.conversationOwnerCol}, type=${conversationMeta.conversationTypes.dm}/${conversationMeta.conversationTypes.group})`
    );
  } else {
    logCheck("conversations seeded", true, "conversations/participants tables not found");
  }
};

async function seed() {
  assertEnv();
  await client.connect();

  try {
    console.log("[seed] Start seeding...");
    console.log(
      `[seed] config: users=${NUM_USERS + 1}, target=${TARGET_USERNAME}, directs=${DIRECTS_FOR_TARGET}, database=${isSupabase ? "supabase" : "postgres"}`
    );
    await client.query("BEGIN");

    const truncatedTables = await truncateExistingTables();
    console.log(
      `[seed] Database cleaned. truncated=${truncatedTables?.length ? truncatedTables.join(",") : "none"}`
    );

    const users = await seedUsers();
    console.log(`[seed] Users created: ${users.length}`);

    const profileCount = await seedProfiles(users);
    console.log(`[seed] Profiles created: ${profileCount}`);

    const friendshipMeta = await seedFriendships(users);
    console.log(
      `[seed] Friendships created: ${friendshipMeta.pairCount} (status=${friendshipMeta.acceptedStatus || "n/a"})`
    );

    const conversationMeta = await seedConversations(users);
    if (conversationMeta) {
      console.log(
        `[seed] Conversations created: directs=${conversationMeta.expectedDirects}, groupMembers=${conversationMeta.groupMembersCount}`
      );
    } else {
      console.log("[seed] Conversations skipped: conversations/participants table not found.");
    }

    await client.query("COMMIT");
    console.log("[seed] Done.");
    await verifySeed({ users, profileCount, friendshipMeta, conversationMeta });
    console.log(`[seed] Login test user -> email: ${TARGET_EMAIL} | password: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error("[seed] Error:", error.message || error);
  process.exit(1);
});
