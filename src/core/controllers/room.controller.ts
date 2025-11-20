import Elysia, { t } from "elysia";
import { RoomRepository } from "../repositories/room.repo";
import { RoomService } from "../services/room.service";
import type { WsIncomingMessage } from "../domain/ws.types";
import { authMiddleware } from "../middlewares/auth.middleware";

const roomRepo = new RoomRepository();
const roomService = new RoomService(roomRepo);

export const RoomController = new Elysia({ prefix: "/rooms" })
  .use(authMiddleware)

  .get(
    "/",
    async () => {
      return roomService.listActiveRooms();
    },
    {
      auth: true,
    },
  )

  .post(
    "/",
    async ({ body, payload }) => {
      return roomService.createRoom(
        payload.sub,
        body.name,
        body.isPublic,
        body.maxParticipants,
      );
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3 }),
        isPublic: t.Optional(t.Boolean()),
        maxParticipants: t.Optional(t.Number({ minimum: 2, maximum: 50 })),
      }),
      auth: true,
    },
  )

  .get(
    "/:roomId",
    async ({ params }) => {
      return roomService.getRoomDetails(params.roomId);
    },
    {
      auth: true,
    },
  )

  .ws("/:roomId/ws", {
    body: t.Object({
      type: t.String(),
      payload: t.Optional(t.Any()),
    }),

    auth: true,

    async open(ws) {
      const { roomId } = ws.data.params;
      const payload = ws.data.payload;

      const userId = payload.sub;

      try {
        const isMember = await roomRepo.isMember(roomId, userId);
        if (!isMember) {
          await roomService.joinRoom(roomId, userId);
        }

        ws.subscribe(roomId);

        const memberCount = await roomRepo.getMemberCount(roomId);
        ws.publish(roomId, {
          type: "USER_JOINED",
          payload: { userId, memberCount },
        });

        console.log(`WS: User ${userId} joined room ${roomId}`);
      } catch (e) {
        ws.send({ type: "ERROR", payload: "Failed to join room" });
        ws.close();

        console.log(`WS: User ${userId} failed to join room ${roomId}. ${e}`);
      }
    },

    async message(ws, message: WsIncomingMessage) {
      const { roomId } = ws.data.params;
      const payload = ws.data.payload;

      const userId = payload.sub;

      switch (message.type) {
        case "UPDATE_PLAYBACK":
          try {
            const newState = await roomService.updatePlayback(
              roomId,
              userId,
              message.payload,
            );

            ws.publish(roomId, {
              type: "PLAYBACK_UPDATED",
              payload: newState,
            });
          } catch (error) {
            ws.send({ type: "ERROR", payload: "Failed to update playback" });
          }
          break;

        case "SYNC_REQUEST":
          const details = await roomService.getRoomDetails(roomId);
          ws.send({
            type: "SYNC_FULL_STATE",
            payload: details,
          });
          break;
      }
    },

    async close(ws) {
      const { roomId } = ws.data.params;
      const payload = ws.data.payload;

      const userId = payload.sub;

      if (userId) {
        await roomService.leaveRoom(roomId, userId);
        ws.unsubscribe(roomId);

        const memberCount = await roomRepo.getMemberCount(roomId);
        ws.publish(roomId, {
          type: "USER_LEFT",
          payload: { userId, memberCount },
        });

        // Host migration logic
        const room = await roomRepo.getMetadata(roomId);

        if (room && room.hostId === userId) {
          const members = await roomRepo.getMembers(roomId);

          if (members.length > 0) {
            await roomRepo.updateHost(roomId, members[0]);
          }
        }
      }
    },
  });
