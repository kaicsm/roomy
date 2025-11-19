import { config } from "dotenv";
import Elysia from "elysia";
import openapi from "@elysiajs/openapi";
import { connectRedis } from "./infra/cache/redis.config";
import { AuthController } from "./core/controllers/auth.controller";
import { RoomController } from "./core/controllers/room.controller";

config();

const PORT = process.env.PORT!;

await connectRedis();

const app = new Elysia({ prefix: "/api" })
  .use(openapi())
  .group("/v1", (group) => group.use(AuthController).use(RoomController))
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
  });
