import { config } from "dotenv";
import Elysia from "elysia";
import { authRoute } from "./routes/auth.route";
import openapi from "@elysiajs/openapi";
import { roomRoute } from "./routes/room.route";
import { connectRedis } from "./infra/cache/redis.config";

config();

const PORT = process.env.PORT!;

await connectRedis();

const app = new Elysia({ prefix: "/api" })
  .use(openapi())
  .group("/v1", (group) => group.use(authRoute).use(roomRoute))
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
  });
