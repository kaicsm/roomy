import Elysia, { Cookie, t } from "elysia";
import jwt from "@elysiajs/jwt";
import { UserRepository } from "../repositories/user.repo";
import { AuthService } from "../services/auth.service";
import { SafeUser } from "../domain/user.types";

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
  .decorate(
    "saveSessionCookie",
    async (jwt: any, user: SafeUser, session: Cookie<unknown>) => {
      const token = await jwt.sign({ sub: user.id, email: user.email });

      session.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    },
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { session }, saveSessionCookie }) => {
      const user = await authService.login(body);
      await saveSessionCookie(jwt, user, session);

      return { user };
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
    async ({ body, jwt, cookie: { session }, saveSessionCookie }) => {
      const user = await authService.register(body);
      await saveSessionCookie(jwt, user, session);

      return { user };
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
