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
