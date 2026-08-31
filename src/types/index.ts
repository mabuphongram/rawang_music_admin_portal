export type OwnerType = 'singer' | 'organization' | 'anonymous';
export type OwnerModel = 'Singer' | 'Organization';

export interface Album {
  id: string;
  title: string;
  ownerType: OwnerType;
  ownerName: string;
  ownerModel?: OwnerModel;
  ownerId?: string;
  coverResName?: string;
  coverImage?: string;
  releaseYear: number;
  description?: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  albumId: string;
  title: string;
  rawangTitle?: string;
  artistName: string;
  composerName?: string;
  albumName: string;
  ownerType: OwnerType;
  durationSeconds: number;
  audioUrl: string;
  lyrics?: string;
  genre?: string;
  playCount: number;
  hasKaraoke: boolean;
  karaokeAudioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinks {
  youtube?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Singer {
  id: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  phone?: string;
  socialLinks?: SocialLinks;
  // computed stats from backend aggregation
  albumCount?: number;
  trackCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  phone?: string;
  socialLinks?: SocialLinks;
  albumCount?: number;
  trackCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdTimestamp?: number;
  iconName?: string;
  trackIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id?: string;
  senderName: string;
  message?: string;
  timestamp?: number;
  attachedTrackId?: string;
  attachedTrackTitle?: string;
  isUser?: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalAlbums: number;
  totalTracks: number;
  totalSingers: number;
  totalOrganizations: number;
  totalPlaylists: number;
  totalChatMessages: number;
  totalPlayCount: number;
}
