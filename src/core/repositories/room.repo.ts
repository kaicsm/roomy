import { redis } from "../../infra/cache/redis.config";
import { PlaybackState, RoomMetadata } from "../domain/room.types";

export class RoomRepository {
  async createMetadata(roomId: string, metadata: RoomMetadata): Promise<void> {
    await redis.hset(`room:${roomId}:metadata`, {
      name: metadata.name,
      hostId: metadata.hostId,
      isPublic: String(metadata.isPublic),
      maxParticipants: String(metadata.maxParticipants),
      createdAt: metadata.createdAt,
    });

    await redis.sadd("active_rooms", roomId);
  }

  async getMetadata(roomId: string): Promise<RoomMetadata | null> {
    const data = await redis.hgetall(`room:${roomId}:metadata`);
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
    await redis.srem("active_rooms", roomId);
  }

  async addMember(roomId: string, userId: string): Promise<void> {
    await redis.rpush(`room:${roomId}:members`, userId);
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await redis.lrem(`room:${roomId}:members`, 0, userId);
  }

  async getMembers(roomId: string): Promise<string[]> {
    return await redis.lrange(`room:${roomId}:members`, 0, -1);
  }

  async getMemberCount(roomId: string): Promise<number> {
    return await redis.llen(`room:${roomId}:members`);
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const members = await this.getMembers(roomId);
    return members.includes(userId);
  }

  async createPlaybackState(
    roomId: string,
    state: PlaybackState,
  ): Promise<void> {
    await redis.hset(`room:${roomId}:playback`, {
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
    const data = await redis.hgetall(`room:${roomId}:playback`);
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
    await redis.hset(`room:${roomId}:connections`, userId, connectionId);
  }

  async removeConnection(roomId: string, userId: string): Promise<void> {
    await redis.hdel(`room:${roomId}:connections`, userId);
  }

  async getConnections(roomId: string): Promise<Record<string, string>> {
    return await redis.hgetall(`room:${roomId}:connections`);
  }

  async deleteConnections(roomId: string): Promise<void> {
    await redis.del(`room:${roomId}:connections`);
  }

  async getActiveRooms(): Promise<string[]> {
    return await redis.smembers("active_rooms");
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.deleteMetadata(roomId);
    await redis.del(`room:${roomId}:members`);
    await this.deletePlaybackState(roomId);
    await this.deleteConnections(roomId);
  }

  async updateHost(roomId: string, newHostId: string): Promise<void> {
    const metadata = await this.getMetadata(roomId);
    if (!metadata) {
      throw new Error("Room not found");
    }

    await redis.hset(`room:${roomId}:metadata`, {
      name: metadata.name,
      hostId: newHostId,
      isPublic: String(metadata.isPublic),
      maxParticipants: String(metadata.maxParticipants),
      createdAt: metadata.createdAt,
    });
  }
}
