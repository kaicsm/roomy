import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { UserRepository } from "../repositories/user.repo";
import { AuthService } from "../services/auth.service";

const userRepo = new UserRepository();
const authService = new AuthService(userRepo);

export const AuthController = new Elysia({
  prefix: "/auth",
  cookie: {
    secrets: process.env.COOKIE_SECRET!,
    sign: ["session"],
  },
})
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { session } }) => {
      const user = await authService.login(body);
      const token = await jwt.sign({ sub: user.id, email: user.email });

      session.value = token;
      session.set({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

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
    async ({ body, jwt, cookie: { session } }) => {
      const user = await authService.register(body);
      const token = await jwt.sign({ sub: user.id, email: user.email });

      session.value = token;
      session.set({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

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
