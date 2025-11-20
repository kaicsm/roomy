import { redis } from "../../infra/cache/redis.config";
import { PlaybackState, RoomMetadata } from "../domain/room.types";

export class RoomRepository {
  async createMetadata(roomId: string, metadata: RoomMetadata): Promise<void> {
    await redis.set(`room:${roomId}:metadata`, JSON.stringify(metadata));
    await redis.sadd("active_rooms", roomId);
  }

  async getMetadata(roomId: string): Promise<RoomMetadata | null> {
    const data = await redis.get(`room:${roomId}:metadata`);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as RoomMetadata;
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
    await redis.set(`room:${roomId}:playback`, JSON.stringify(state));
  }

  async getPlaybackState(roomId: string): Promise<PlaybackState | null> {
    const data = await redis.get(`room:${roomId}:playback`);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as PlaybackState;
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
    await redis.sadd(`room:${roomId}:connections:${userId}`, connectionId);
  }

  async removeConnection(
    roomId: string,
    userId: string,
    connectionId: string,
  ): Promise<void> {
    await redis.srem(`room:${roomId}:connections:${userId}`, connectionId);

    // If no more connections for this user, delete the set
    const count = await redis.scard(`room:${roomId}:connections:${userId}`);
    if (count === 0) {
      await redis.del(`room:${roomId}:connections:${userId}`);
    }
  }

  async hasActiveConnections(roomId: string, userId: string): Promise<boolean> {
    return (await redis.scard(`room:${roomId}:connections:${userId}`)) > 0;
  }

  async getActiveRooms(): Promise<string[]> {
    return await redis.smembers("active_rooms");
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.deleteMetadata(roomId);
    await redis.del(`room:${roomId}:members`);
    await this.deletePlaybackState(roomId);
  }

  async updateHost(roomId: string, newHostId: string): Promise<void> {
    const metadata = await this.getMetadata(roomId);
    if (!metadata) {
      throw new Error("Room not found");
    }

    metadata.hostId = newHostId;
    await this.createMetadata(roomId, metadata);
  }
}
