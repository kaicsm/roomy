import Elysia, { t } from "elysia";
import jwt from "@elysiajs/jwt";
import { RoomRepository } from "../repositories/room.repo";
import { RoomService } from "../services/room.service";
import type { WsIncomingMessage } from "../domain/ws.types";

const roomRepo = new RoomRepository();
const roomService = new RoomService(roomRepo);

export const RoomController = new Elysia({ 
  prefix: "/rooms",
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

  .get("/", async () => {
    return roomService.listActiveRooms();
  })

  .post(
    "/",
    async ({ body, headers, jwt, cookie: { session } }) => {
      let token = headers.authorization?.replace("Bearer ", "");
      if (!token && session?.value) {
        token = session.value as string;
      }

      if (!token) throw new Error("Token not provided");

      const payload = await jwt.verify(token);
      if (!payload) throw new Error("Invalid token");

      return roomService.createRoom(
        payload.sub as string,
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
    },
  )

  .get("/:roomId", async ({ params }) => {
    return roomService.getRoomDetails(params.roomId);
  })

  .ws("/:roomId/ws", {
    body: t.Object({
      type: t.String(),
      payload: t.Optional(t.Any()),
    }),

    query: t.Object({
      token: t.String(),
    }),

    async open(ws) {
      const { roomId } = ws.data.params;
      const { token } = ws.data.query;

      const payload = await ws.data.jwt.verify(token);
      if (!payload) {
        ws.send({ type: "ERROR", payload: "Invalid Token" });
        ws.close();
        return;
      }
      const userId = payload.sub as string;

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
      const { token } = ws.data.query;

      const payload = await ws.data.jwt.verify(token);
      if (!payload) return;
      const userId = payload.sub as string;

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
      const { token } = ws.data.query;
      const payload = await ws.data.jwt.verify(token);
      if (!payload) return;
      const userId = payload.sub as string;

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
