import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { UserRepository } from "../repositories/user.repo";
import { AuthService } from "../services/auth.service";

const userRepo = new UserRepository();
const authService = new AuthService(userRepo);

export const AuthController = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .post(
    "/login",
    async ({ body, jwt }) => {
      const user = await authService.login(body);
      const token = await jwt.sign({ sub: user.id, email: user.email });
      return { user, token };
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
      const user = await authService.register(body);
      const token = await jwt.sign({ sub: user.id, email: user.email });
      return { user, token };
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
