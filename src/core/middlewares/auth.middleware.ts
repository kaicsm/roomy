import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { type Claim } from "../domain/claim.types";

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .macro({
    auth: {
      async resolve({ jwt, cookie, status, headers }) {
        let token = cookie.authToken?.value as string | undefined;

        // If there's no token in the cookie, try the Authorization header as a fallback
        if (!token) {
          const rawAuth = (headers?.authorization ?? headers?.Authorization) as
            | string
            | undefined;
          if (rawAuth) {
            token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7) : rawAuth;
          }
        }

        if (!token) {
          return status(401, { message: "Missing authentication token" });
        }

        const payload = (await jwt.verify(token)) as Claim | false;
        if (!payload) {
          return status(401, { message: "Invalid or expired token" });
        }

        return {
          payload: payload,
        };
      },
    },
  });
