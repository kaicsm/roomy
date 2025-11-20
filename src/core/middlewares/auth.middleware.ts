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
          return status("Unauthorized");
        }

        const payload = (await jwt.verify(token)) as Claim;
        return {
          payload: payload,
        };
      },
    },
  });
