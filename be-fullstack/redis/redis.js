import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL || process.env.REDIS_LOCAL,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

async function connectRedisWithRetry() {
  while (!redisClient.isOpen) {
    try {
      console.log("🔄 Connecting to Redis...");
      await redisClient.connect();
      console.log("✅ Redis connected");
    } catch (err) {
      console.log("⏳ Retry Redis in 2s...");
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

await connectRedisWithRetry();
