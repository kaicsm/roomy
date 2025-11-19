import { redis } from "../../infra/cache/redis.config";

export type RoomMetadata = {
  name: string;
  hostId: string;
  isPublic: boolean;
  maxParticipants: number;
  createdAt: string;
};

export type PlaybackState = {
  mediaUrl: string;
  mediaType: string;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  lastUpdatedBy: string;
  lastUpdated: string;
};

export class RoomRepository {
  async createMetadata(roomId: string, metadata: RoomMetadata): Promise<void> {
    await redis.hSet(`room:${roomId}:metadata`, {
      name: metadata.name,
      hostId: metadata.hostId,
      isPublic: String(metadata.isPublic),
      maxParticipants: String(metadata.maxParticipants),
      createdAt: metadata.createdAt,
    });

    await redis.sAdd("active_rooms", roomId);
  }

  async getMetadata(roomId: string): Promise<RoomMetadata | null> {
    const data = await redis.hGetAll(`room:${roomId}:metadata`);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      name: data.name,
      hostId: data.hostId,
      isPublic: data.isPublic === "true",
      maxParticipants: parseInt(data.maxParticipants),
      createdAt: data.createdAt,
    };
  }

  async deleteMetadata(roomId: string): Promise<void> {
    await redis.del(`room:${roomId}:metadata`);
    await redis.sRem("active_rooms", roomId);
  }

  async addMember(roomId: string, userId: string): Promise<void> {
    await redis.sAdd(`room:${roomId}:members`, userId);
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await redis.sRem(`room:${roomId}:members`, userId);
  }

  async getMembers(roomId: string): Promise<string[]> {
    return await redis.sMembers(`room:${roomId}:members`);
  }

  async getMemberCount(roomId: string): Promise<number> {
    return await redis.sCard(`room:${roomId}:members`);
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    return (await redis.sIsMember(`room:${roomId}:members`, userId))
      ? true
      : false;
  }

  async createPlaybackState(
    roomId: string,
    state: PlaybackState,
  ): Promise<void> {
    await redis.hSet(`room:${roomId}:playback`, {
      mediaUrl: state.mediaUrl,
      mediaType: state.mediaType,
      isPlaying: String(state.isPlaying),
      currentTime: String(state.currentTime),
      playbackSpeed: String(state.playbackSpeed),
      lastUpdatedBy: state.lastUpdatedBy,
      lastUpdated: state.lastUpdated,
    });
  }

  async getPlaybackState(roomId: string): Promise<PlaybackState | null> {
    const data = await redis.hGetAll(`room:${roomId}:playback`);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      isPlaying: data.isPlaying === "true",
      currentTime: parseFloat(data.currentTime),
      playbackSpeed: parseFloat(data.playbackSpeed),
      lastUpdatedBy: data.lastUpdatedBy,
      lastUpdated: data.lastUpdated,
    };
  }

  async updatePlaybackState(
    roomId: string,
    state: PlaybackState,
  ): Promise<void> {
    await this.createPlaybackState(roomId, state);
  }

  async deletePlaybackState(roomId: string): Promise<void> {
    await redis.del(`room:${roomId}:playback`);
  }

  async addConnection(
    roomId: string,
    userId: string,
    connectionId: string,
  ): Promise<void> {
    await redis.hSet(`room:${roomId}:connections`, userId, connectionId);
  }

  async removeConnection(roomId: string, userId: string): Promise<void> {
    await redis.hDel(`room:${roomId}:connections`, userId);
  }

  async getConnections(roomId: string): Promise<Record<string, string>> {
    return await redis.hGetAll(`room:${roomId}:connections`);
  }

  async deleteConnections(roomId: string): Promise<void> {
    await redis.del(`room:${roomId}:connections`);
  }

  async getActiveRooms(): Promise<string[]> {
    return await redis.sMembers("active_rooms");
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.deleteMetadata(roomId);
    await redis.del(`room:${roomId}:members`);
    await this.deletePlaybackState(roomId);
    await this.deleteConnections(roomId);
  }
}
