import Elysia, { t } from "elysia";
import { AuthController } from "../core/controllers/auth.controller";
import jwt from "@elysiajs/jwt";

const authController = new AuthController();

export const authRoute = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .post(
    "/login",
    async ({ body, jwt }) => {
      return authController.login(body, jwt);
    },
    {
      body: t.Object({
        username: t.String({
          minLength: 4,
        }),
        password: t.String({
          minLength: 6,
        }),
      }),
    },
  )
  .post(
    "/register",
    async ({ body, jwt }) => {
      return authController.register(body, jwt);
    },
    {
      body: t.Object({
        username: t.String({
          minLength: 4,
        }),
        password: t.String({
          minLength: 6,
        }),
        email: t.String({
          format: "email",
        }),
      }),
    },
  );
