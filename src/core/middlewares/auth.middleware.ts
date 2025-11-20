import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { Claim } from "../domain/claim.types";

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .macro({
    auth: {
      async resolve({ jwt, cookie, status }) {
        const token = cookie.session?.value as string;

        if (!token) {
          return status(401, "Missing authentication token");
        }

        const payload = (await jwt.verify(token)) as Claim | false;
        if (!payload) {
          return status(401, "Invalid or expired token");
        }

        return {
          payload: payload,
        };
      },
    },
  });
