import Elysia, { t } from "elysia";
import { UserRepository } from "../repositories/user.repo";
import { SafeUser } from "../domain/user.types";

const userRepo = new UserRepository();

export const UserController = new Elysia({ prefix: "/users" })
  .get(
    "/:id",
    async ({ params }) => {
      const user = await userRepo.findById(params.id);
      if (!user) {
        throw new Error("User not found");
      }

      const { password: _, ...safeUser } = user;
      return safeUser as SafeUser;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/",
    async ({ query }) => {
      const ids = query.ids;
      if (!ids || typeof ids !== "string") {
        return [];
      }

      const idArray = ids.split(",").filter((id) => id.trim().length > 0);
      if (idArray.length === 0) {
        return [];
      }

      const users = await userRepo.findByIds(idArray);
      return users.map((user) => {
        const { password: _, ...safeUser } = user;
        return safeUser as SafeUser;
      });
    },
    {
      query: t.Object({
        ids: t.Optional(t.String()),
      }),
    },
  );

