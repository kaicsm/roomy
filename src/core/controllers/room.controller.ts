import Elysia, { t } from "elysia";
import { RoomRepository } from "../repositories/room.repo";
import { RoomService } from "../services/room.service";
import {
  WsIncomingMessage,
  WsIncomingMessageType,
  WsOutgoingMessageType,
} from "../domain/ws.types";
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
    async ({ params }: { params: { roomId: string } }) => {
      return roomService.getRoomDetails(params.roomId);
    },
    {
      auth: true,
    },
  )

  .ws("/:roomId/ws", {
    body: t.Union([
      t.Object({
        type: t.Literal(WsIncomingMessageType.UpdatePlayback),
        payload: t.Partial(
          t.Object({
            mediaUrl: t.String(),
            mediaType: t.String(),
            isPlaying: t.Boolean(),
            currentTime: t.Number(),
            playbackSpeed: t.Number(),
          }),
        ),
      }),
      t.Object({
        type: t.Literal(WsIncomingMessageType.SyncRequest),
      }),
    ]),

    auth: true,

    async open(ws) {
      const { roomId } = ws.data.params;
      const userId = ws.data.payload.sub;

      try {
        const message = await roomService.handleUserConnection(
          roomId,
          userId,
          ws.id,
        );

        ws.subscribe(roomId);

        ws.send(message);
        ws.publish(roomId, message);
      } catch (e: any) {
        ws.send({
          type: WsOutgoingMessageType.Error,
          payload: e.message || "Failed to join room",
        });
        ws.close();

        console.log(`WS: User ${userId} failed to join room ${roomId}. ${e}`);
      }
    },

    async message(ws, message: WsIncomingMessage) {
      const { roomId } = ws.data.params;
      const userId = ws.data.payload.sub;

      try {
        const result = await roomService.handleUserMessage(
          roomId,
          userId,
          message,
        );

        if (result) {
          if (result.action === "publish") {
            ws.publish(roomId, result.message);
          } else if (result.action === "send") {
            ws.send(result.message);
          }
        }
      } catch (error: any) {
        ws.send({
          type: WsOutgoingMessageType.Error,
          payload: error.message || "Failed to process message",
        });
      }
    },

    async close(ws) {
      const { roomId } = ws.data.params;
      const userId = ws.data.payload.sub;

      try {
        const messagesToPublish = await roomService.handleUserDisconnection(
          roomId,
          userId,
          ws.id,
        );

        messagesToPublish.forEach((message) => {
          ws.publish(roomId, message);
        });

        ws.unsubscribe(roomId);
        console.log(`WS: User ${userId} left room ${roomId}`);
      } catch (error: any) {
        console.log(
          `WS: Error during disconnection for user ${userId} in room ${roomId}. ${error}`,
        );
      }
    },
  });
