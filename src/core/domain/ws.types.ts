export enum WsIncomingMessageType {
  UpdatePlayback = "UPDATE_PLAYBACK",
  SyncRequest = "SYNC_REQUEST",
}

export enum WsOutgoingMessageType {
  PlaybackUpdated = "PLAYBACK_UPDATED",
  UserJoined = "USER_JOINED",
  UserLeft = "USER_LEFT",
  HostChanged = "HOST_CHANGED",
  SyncFullState = "SYNC_FULL_STATE",
  Error = "ERROR",
}

export type WsIncomingMessage = {
  type: WsIncomingMessageType;
  payload?: any;
};

export type WsOutgoingMessage =
  | { type: WsOutgoingMessageType.PlaybackUpdated; payload: any }
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
  | { type: WsOutgoingMessageType.SyncFullState; payload: any }
  | { type: WsOutgoingMessageType.Error; payload: string };

