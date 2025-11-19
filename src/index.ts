import { config } from "dotenv";
import Elysia from "elysia";
import openapi from "@elysiajs/openapi";
import { connectRedis } from "./infra/cache/redis.config";
import { AuthController } from "./core/controllers/auth.controller";
import { RoomController } from "./core/controllers/room.controller";
import { UserController } from "./core/controllers/user.controller";

config();

const requiredEnvVars = [
  "PORT",
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "COOKIE_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

const PORT = process.env.PORT!;

try {
  await connectRedis();
} catch (error) {
  console.error("Failed to connect to Redis:", error);
  process.exit(1);
}

new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        info: {
          title: "Shogun API",
          version: "1.0.0",
        },
      },
    }),
  )
  .group("/v1", (group) =>
    group.use(AuthController).use(RoomController).use(UserController),
  )
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
  });
