import { RoomRepository } from "../repositories/room.repo";
import { RoomService } from "../services/room.service";

export class RoomController {
  private roomRepo: RoomRepository;
  private roomService: RoomService;

  constructor() {
    this.roomRepo = new RoomRepository();
    this.roomService = new RoomService(this.roomRepo);
  }

  async createRoom(
    body: {
      name: string;
      isPublic?: boolean;
      maxParticipants?: number;
    },
    userId: string,
  ) {
    return this.roomService.createRoom(
      userId,
      body.name,
      body.isPublic,
      body.maxParticipants,
    );
  }

  async getRoomDetails(roomId: string) {
    return this.roomService.getRoomDetails(roomId);
  }

  async joinRoom(roomId: string, userId: string) {
    return this.roomService.joinRoom(roomId, userId);
  }

  async leaveRoom(roomId: string, userId: string) {
    return this.roomService.leaveRoom(roomId, userId);
  }

  async updatePlayback(
    roomId: string,
    userId: string,
    body: {
      mediaUrl?: string;
      mediaType?: string;
      isPlaying?: boolean;
      currentTime?: number;
      playbackSpeed?: number;
    },
  ) {
    return this.roomService.updatePlayback(roomId, userId, body);
  }

  async getPlaybackState(roomId: string) {
    return this.roomService.getPlaybackState(roomId);
  }

  async listActiveRooms() {
    return this.roomService.listActiveRooms();
  }
}
