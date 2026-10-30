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
  albumIds: string[];
  /** Primary album (first of albumIds) — kept for backward compat. */
  albumId?: string;
  /** Manual earnings attribution: exactly one owner per track (null = platform share). */
  ownerId?: string | null;
  ownerModel?: 'Singer' | 'Organization' | null;
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
  videoLinks?: string[];
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
  videoLinks?: string[];
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

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  durationSeconds: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  youtubeVideoId: string;
  durationSeconds: number;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export interface Contribution {
  id: string;
  title: string;
  artistName: string;
  composerName?: string;
  durationSeconds: number;
  audioUrl: string;
  karaokeAudioUrl?: string | null;
  hasKaraoke?: boolean;
  contributorName: string;
  contributorUserId?: string;
  status: ContributionStatus;
  trackId?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type OwnerClaimStatus = 'pending' | 'approved' | 'rejected';

export interface OwnerClaim {
  id: string;
  ownerModel: 'Singer' | 'Organization';
  ownerId: string;
  userId: string;
  status: OwnerClaimStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OwnerRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OwnerRequest {
  id: string;
  name: string;
  ownerModel: 'Singer' | 'Organization';
  phone?: string;
  description?: string;
  requesterName: string;
  requesterPhone: string;
  videoLinks: string[];
  avatarUrl?: string;
  status: OwnerRequestStatus;
  createdUserId?: string;
  createdOwnerId?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedOwnerRequest {
  request: OwnerRequest;
  credentials: { phone: string; tempPassword: string } | null;
  linkedExisting: boolean;
  profile: Singer | Organization;
  claim: OwnerClaim;
}

export interface ChatMessage {  id?: string;
  senderName: string;
  message?: string;
  timestamp?: number;
  attachedTrackId?: string;
  attachedTrackTitle?: string;
  isUser?: boolean;
  createdAt?: string;
}

export type UserRole = 'user' | 'artist' | 'admin';
export type SubscriptionPlan = 'free' | 'one_month' | 'three_months' | 'one_year';
export type SubscriptionStatus = 'active' | 'expired' | 'pending';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string;
  subscriptionStartedAt: string;
  lastPaymentAt?: string | null;
  lastPaymentAmount?: number | null;
  mustChangePassword?: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalAlbums: number;
  totalTracks: number;
  totalSingers: number;
  totalOrganizations: number;
  totalPlaylists: number;
  totalChatMessages: number;
  totalPlayCount: number;
  totalUsers?: number;
  activeSubscriptions?: number;
}

export type PresencePlatform =
  | 'android'
  | 'ios'
  | 'web'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'unknown';

export interface PresenceTrack {
  id?: string;
  title: string;
  artistName?: string;
  albumName?: string;
}

export interface PresenceUser {
  connectionId: string;
  userId: string | null;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: 'user' | 'artist' | 'admin' | 'guest';
  platform: PresencePlatform;
  app: 'flutter' | 'web' | 'admin' | 'unknown';
  appVersion?: string;
  status: 'listening' | 'browsing' | 'idle';
  currentTrack: PresenceTrack | null;
  isGuest: boolean;
  connectedAt: string;
  lastSeen: string;
}

export interface PresenceSnapshot {
  count: number;
  users: PresenceUser[];
  generatedAt: string;
  simulated?: boolean;
}
