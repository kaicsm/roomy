import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL!,
});

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("Redis connected!"));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function disconnectRedis() {
  if (redis.isOpen) {
    redis.destroy();
  }
}
