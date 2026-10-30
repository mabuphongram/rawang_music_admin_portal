import { Album, Track, Singer, Organization, Playlist, ChatMessage, DashboardStats, User, SubscriptionPlan, HeroSlide, Video, Contribution, OwnerClaim, OwnerRequest, ApprovedOwnerRequest, PresenceSnapshot } from '../types';

// Default configuration getters
export function getApiBaseUrl(): string {
  const custom = localStorage.getItem('RAWANG_API_URL');
  if (custom) return custom.replace(/\/+$/, '');
  // APP_URL is the backend API base URL supplied by this deployment. Keep the
  // VITE_ name as a backwards-compatible local-development fallback.
  const envUrl = import.meta.env.APP_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return '/api'; // Relative endpoint pointing to our Express server or proxy
}

export function getMinioPrefix(): string {
  const custom = localStorage.getItem('RAWANG_MINIO_PREFIX');
  if (custom) return custom.replace(/\/+$/, '');
  const envPrefix = import.meta.env.MINIO_PREFIX_URL || import.meta.env.VITE_MINIO_PREFIX;
  if (envPrefix) return envPrefix.replace(/\/+$/, '');
  return '';
}

/**
 * Optional shared key for the live-presence feed. The backend only enforces
 * it when PRESENCE_ADMIN_KEY is set, so local development works untouched.
 */
export function getPresenceKey(): string {
  const custom = localStorage.getItem('RAWANG_PRESENCE_KEY');
  if (custom) return custom;
  return import.meta.env.PRESENCE_ADMIN_KEY || '';
}

export function getSocketBaseUrl(): string {
  const base = getApiBaseUrl();
  if (/^https?:\/\//i.test(base)) {
    return base.replace(/\/api\/?$/i, '');
  }
  return window.location.origin;
}

export function resolveMediaUrl(key?: string | null): string {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
    return key;
  }
  const prefix = getMinioPrefix();
  if (prefix) {
    return `${prefix}/${key.replace(/^\/+/, '')}`;
  }
  return key;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP error! Status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // LIVE PRESENCE (admin-only list; REST fallback for the socket feed)
  getPresence: () => {
    const key = getPresenceKey();
    return request<PresenceSnapshot>('/presence', {
      headers: key ? { 'x-presence-key': key } : undefined,
    });
  },

  // Health
  checkHealth: async (customUrl?: string): Promise<{ status: string }> => {
    const baseUrl = customUrl || getApiBaseUrl();
    const healthUrl = baseUrl.endsWith('/api')
      ? baseUrl.replace(/\/api$/, '/health')
      : `${baseUrl}/health`;
    
    try {
      const res = await fetch(healthUrl, { method: 'GET' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch {
      // Fallback check under /api/health
      const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    }
  },

  // ALBUMS
  getAlbums: (ownerType?: string) => {
    const query = ownerType ? `?ownerType=${encodeURIComponent(ownerType)}` : '';
    return request<Album[]>(`/albums${query}`);
  },

  getAlbum: (id: string) => request<Album>(`/albums/${id}`),

  createAlbum: (formData: FormData | Record<string, unknown>) => {
    let body: BodyInit;
    if (formData instanceof FormData) {
      body = formData;
    } else {
      body = JSON.stringify(formData);
    }
    return request<Album>('/albums', {
      method: 'POST',
      body,
    });
  },

  updateAlbum: (id: string, formData: FormData | Record<string, unknown>) => {
    let body: BodyInit;
    if (formData instanceof FormData) {
      body = formData;
    } else {
      body = JSON.stringify(formData);
    }
    return request<Album>(`/albums/${id}`, {
      method: 'PUT',
      body,
    });
  },

  deleteAlbum: (id: string) =>
    request<void>(`/albums/${id}`, { method: 'DELETE' }),

  // TRACKS
  getTracks: (albumId?: string, ownerId?: string) => {
    const params = new URLSearchParams();
    if (albumId) params.set('albumId', albumId);
    if (ownerId) params.set('ownerId', ownerId);
    const query = params.toString();
    return request<Track[]>(`/tracks${query ? `?${query}` : ''}`);
  },

  getTrack: (id: string) => request<Track>(`/tracks/${id}`),

  createTrack: (formData: FormData | Record<string, unknown>) => {
    let body: BodyInit;
    if (formData instanceof FormData) {
      body = formData;
    } else {
      body = JSON.stringify(formData);
    }
    return request<Track>('/tracks', {
      method: 'POST',
      body,
    });
  },

  updateTrack: (id: string, formData: FormData | Record<string, unknown>) => {
    let body: BodyInit;
    if (formData instanceof FormData) {
      body = formData;
    } else {
      body = JSON.stringify(formData);
    }
    return request<Track>(`/tracks/${id}`, {
      method: 'PUT',
      body,
    });
  },

  deleteTrack: (id: string) =>
    request<void>(`/tracks/${id}`, { method: 'DELETE' }),

  // SINGERS
  getSingers: () => request<Singer[]>('/singers'),
  getSinger: (id: string) => request<Singer>(`/singers/${id}`),
  createSinger: (formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<Singer>('/singers', { method: 'POST', body });
  },
  updateSinger: (id: string, formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<Singer>(`/singers/${id}`, { method: 'PUT', body });
  },
  deleteSinger: (id: string) => request<void>(`/singers/${id}`, { method: 'DELETE' }),

  // ORGANIZATIONS
  getOrganizations: () => request<Organization[]>('/organizations'),
  getOrganization: (id: string) => request<Organization>(`/organizations/${id}`),
  createOrganization: (formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<Organization>('/organizations', { method: 'POST', body });
  },
  updateOrganization: (id: string, formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<Organization>(`/organizations/${id}`, { method: 'PUT', body });
  },
  deleteOrganization: (id: string) => request<void>(`/organizations/${id}`, { method: 'DELETE' }),

  // HERO SLIDES (home carousel)
  getHeroSlides: () => request<HeroSlide[]>('/hero-slides'),
  getHeroSlide: (id: string) => request<HeroSlide>(`/hero-slides/${id}`),
  createHeroSlide: (formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<HeroSlide>('/hero-slides', { method: 'POST', body });
  },
  updateHeroSlide: (id: string, formData: FormData | Record<string, unknown>) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    return request<HeroSlide>(`/hero-slides/${id}`, { method: 'PUT', body });
  },
  deleteHeroSlide: (id: string) => request<void>(`/hero-slides/${id}`, { method: 'DELETE' }),

  // VIDEOS (YouTube embeds — no files, ID only)
  getVideos: (published?: boolean) => {
    const query = published !== undefined ? `?isPublished=${published}` : '';
    return request<Video[]>(`/videos${query}`);
  },
  getVideo: (id: string) => request<Video>(`/videos/${id}`),
  createVideo: (payload: Record<string, unknown>) =>
    request<Video>('/videos', { method: 'POST', body: JSON.stringify(payload) }),
  updateVideo: (id: string, payload: Record<string, unknown>) =>
    request<Video>(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteVideo: (id: string) => request<void>(`/videos/${id}`, { method: 'DELETE' }),

  // CONTRIBUTIONS (community pending-review queue)
  getContributions: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Contribution[]>(`/contributions${query}`);
  },
  approveContribution: (id: string, payload: { albumIds: string[]; title?: string; artistName?: string; composerName?: string; albumName?: string; ownerType?: string; genre?: string; lyrics?: string; reviewNote?: string }) =>
    request<{ contribution: Contribution; track: Track }>(`/contributions/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteContribution: (id: string) => request<void>(`/contributions/${id}`, { method: 'DELETE' }),

  // OWNER CLAIMS (artist login <-> profile linkage, admin approved)
  getOwnerClaims: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<OwnerClaim[]>(`/owner-claims${query}`);
  },
  approveOwnerClaim: (id: string, reviewNote?: string) =>
    request<OwnerClaim>(`/owner-claims/${id}/approve`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),
  rejectOwnerClaim: (id: string, reviewNote?: string) =>
    request<OwnerClaim>(`/owner-claims/${id}/reject`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),

  // OWNER REQUESTS (onboarding: review -> account + profile + claim)
  getOwnerRequests: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<OwnerRequest[]>(`/owner-requests${query}`);
  },
  approveOwnerRequest: (id: string, reviewNote?: string) =>
    request<ApprovedOwnerRequest>(`/owner-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),
  rejectOwnerRequest: (id: string, reviewNote?: string) =>
    request<OwnerRequest>(`/owner-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reviewNote }) }),

  // PLAYLISTS (legacy - discarded in Flutter offline, kept for mock compatibility)
  getPlaylists: () => request<Playlist[]>('/playlists'),
  createPlaylist: (payload: Partial<Playlist>) =>
    request<Playlist>('/playlists', { method: 'POST', body: JSON.stringify(payload) }),
  getPlaylistTracks: (playlistId: string) =>
    request<Track[]>(`/playlists/${playlistId}/tracks`),
  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    request<Playlist>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    }),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    request<Playlist>(`/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' }),

  // USERS - manual subscription (1m/3m/1y) after free 2y tier
  getUsers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<User[]>(`/users${q}`);
  },
  getUser: (id: string) => request<User>(`/users/${id}`),
  updateUser: (id: string, payload: { name?: string; phone?: string; email?: string | null; avatarUrl?: string; role?: string }) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateUserSubscription: (id: string, payload: { plan: SubscriptionPlan; amount?: number }) =>
    request<User>(`/users/${id}/subscription`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetUserPassword: (id: string) =>
    request<{ message: string; tempPassword: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  // CHAT
  getChatMessages: () => request<ChatMessage[]>('/chat/messages'),
  sendChatMessage: (payload: Partial<ChatMessage>) =>
    request<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify(payload) }),

  // DASHBOARD STATS CALCULATOR
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [albRes, trkRes, sngRes, orgRes, plRes, chatRes, usrRes] = await Promise.allSettled([
      api.getAlbums(),
      api.getTracks(),
      api.getSingers(),
      api.getOrganizations(),
      api.getPlaylists(),
      api.getChatMessages(),
      api.getUsers().catch(() => [] as any),
    ]);

    const alb = albRes.status === 'fulfilled' ? albRes.value : [];
    const trk = trkRes.status === 'fulfilled' ? trkRes.value : [];
    const sng = sngRes.status === 'fulfilled' ? sngRes.value : [];
    const org = orgRes.status === 'fulfilled' ? orgRes.value : [];
    const pl = plRes.status === 'fulfilled' ? plRes.value : [];
    const chat = chatRes.status === 'fulfilled' ? chatRes.value : [];
    const usr = usrRes.status === 'fulfilled' ? (usrRes.value as any[]) : [];

    const totalPlayCount = trk.reduce((acc, t) => acc + (t.playCount || 0), 0);
    const activeSubs = (usr as any[]).filter((u: any) => u.subscriptionStatus === 'active' && new Date(u.subscriptionExpiresAt) > new Date()).length;

    return {
      totalAlbums: alb.length,
      totalTracks: trk.length,
      totalSingers: sng.length,
      totalOrganizations: org.length,
      totalPlaylists: pl.length,
      totalChatMessages: chat.length,
      totalPlayCount,
      totalUsers: usr.length,
      activeSubscriptions: activeSubs,
    };
  },
};
