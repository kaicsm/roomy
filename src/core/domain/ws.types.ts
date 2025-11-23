import type {
  ClientPlaybackPayload,
  PlaybackState,
  RoomFullStatePayload,
} from "./room.types";

export enum WsIncomingMessageType {
  UpdatePlayback = "UPDATE_PLAYBACK",
  SyncRequest = "SYNC_REQUEST",
  Heartbeat = "HEARTBEAT",
}

export enum WsOutgoingMessageType {
  PlaybackUpdated = "PLAYBACK_UPDATED",
  UserJoined = "USER_JOINED",
  UserLeft = "USER_LEFT",
  HostChanged = "HOST_CHANGED",
  SyncFullState = "SYNC_FULL_STATE",
  Error = "ERROR",
}

export type WsIncomingMessage =
  | {
      type: WsIncomingMessageType.UpdatePlayback;
      payload: ClientPlaybackPayload;
    }
  | { type: WsIncomingMessageType.SyncRequest; payload?: never }
  | { type: WsIncomingMessageType.Heartbeat; payload?: never };

export type WsOutgoingMessage =
  | { type: WsOutgoingMessageType.PlaybackUpdated; payload: PlaybackState }
  | {
      type: WsOutgoingMessageType.UserJoined;
      payload: { userId: string; memberCount: number };
    }
  | {
      type: WsOutgoingMessageType.UserLeft;
      payload: { userId: string; memberCount: number };
    }
  | {
      type: WsOutgoingMessageType.HostChanged;
      payload: { newHostId: string };
    }
  | { type: WsOutgoingMessageType.SyncFullState; payload: RoomFullStatePayload }
  | { type: WsOutgoingMessageType.Error; payload: string };
