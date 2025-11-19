import Elysia, { t } from "elysia";
import { RoomController } from "../core/controllers/room.controller";
import jwt from "@elysiajs/jwt";

const roomController = new RoomController();

export const roomRoute = new Elysia({ prefix: "/rooms" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )

  .get("/", async () => {
    return roomController.listActiveRooms();
  })

  .post(
    "/",
    async ({ body, headers, jwt }) => {
      const token = headers.authorization?.replace("Bearer ", "");
      if (!token) throw new Error("Token not provided");

      const payload = await jwt.verify(token);
      if (!payload) throw new Error("Invalid token");

      return roomController.createRoom(body, payload.sub as string);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3 }),
        isPublic: t.Optional(t.Boolean()),
        maxParticipants: t.Optional(t.Number({ minimum: 2, maximum: 50 })),
      }),
    },
  )

  .get("/:roomId", async ({ params }) => {
    return roomController.getRoomDetails(params.roomId);
  })

  .post("/:roomId/join", async ({ params, headers, jwt }) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error("Token not provided");

    const payload = await jwt.verify(token);
    if (!payload) throw new Error("Invalid token");

    return roomController.joinRoom(params.roomId, payload.sub as string);
  })

  .post("/:roomId/leave", async ({ params, headers, jwt }) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error("Token not provided");

    const payload = await jwt.verify(token);
    if (!payload) throw new Error("Invalid token");

    return roomController.leaveRoom(params.roomId, payload.sub as string);
  })

  .get("/:roomId/playback", async ({ params }) => {
    return roomController.getPlaybackState(params.roomId);
  })

  .patch(
    "/:roomId/playback",
    async ({ params, body, headers, jwt }) => {
      const token = headers.authorization?.replace("Bearer ", "");
      if (!token) throw new Error("Token not provided");

      const payload = await jwt.verify(token);
      if (!payload) throw new Error("Invalid token");

      return roomController.updatePlayback(
        params.roomId,
        payload.sub as string,
        body,
      );
    },
    {
      body: t.Object({
        mediaUrl: t.Optional(t.String()),
        mediaType: t.Optional(t.String()),
        isPlaying: t.Optional(t.Boolean()),
        currentTime: t.Optional(t.Number({ minimum: 0 })),
        playbackSpeed: t.Optional(t.Number({ minimum: 0.25, maximum: 2 })),
      }),
    },
  );
