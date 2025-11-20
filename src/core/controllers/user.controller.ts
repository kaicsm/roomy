import Elysia, { t } from "elysia";
import { UserRepository } from "../repositories/user.repo";
import { authMiddleware } from "../middlewares/auth.middleware";
import { UserService } from "../services/user.service";

const userRepo = new UserRepository();
const userService = new UserService(userRepo);

export const UserController = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .get(
    "/:id",
    async ({ params }: { params: { id: string } }) => {
      return await userService.findUserById(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      auth: true,
    },
  )
  .get(
    "/",
    async ({ query }: { query: { ids?: string } }) => {
      return await userService.findUsersByIds(query.ids!);
    },
    {
      query: t.Object({
        ids: t.Optional(t.String()),
      }),
      auth: true,
    },
  );
