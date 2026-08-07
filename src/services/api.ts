import { Album, Track, Singer, Organization, Playlist, ChatMessage, DashboardStats } from '../types';

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
  getTracks: (albumId?: string) => {
    const query = albumId ? `?albumId=${encodeURIComponent(albumId)}` : '';
    return request<Track[]>(`/tracks${query}`);
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

  // PLAYLISTS
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

  // CHAT
  getChatMessages: () => request<ChatMessage[]>('/chat/messages'),
  sendChatMessage: (payload: Partial<ChatMessage>) =>
    request<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify(payload) }),

  // DASHBOARD STATS CALCULATOR
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [albRes, trkRes, sngRes, orgRes, plRes, chatRes] = await Promise.allSettled([
      api.getAlbums(),
      api.getTracks(),
      api.getSingers(),
      api.getOrganizations(),
      api.getPlaylists(),
      api.getChatMessages(),
    ]);

    const alb = albRes.status === 'fulfilled' ? albRes.value : [];
    const trk = trkRes.status === 'fulfilled' ? trkRes.value : [];
    const sng = sngRes.status === 'fulfilled' ? sngRes.value : [];
    const org = orgRes.status === 'fulfilled' ? orgRes.value : [];
    const pl = plRes.status === 'fulfilled' ? plRes.value : [];
    const chat = chatRes.status === 'fulfilled' ? chatRes.value : [];

    const totalPlayCount = trk.reduce((acc, t) => acc + (t.playCount || 0), 0);

    return {
      totalAlbums: alb.length,
      totalTracks: trk.length,
      totalSingers: sng.length,
      totalOrganizations: org.length,
      totalPlaylists: pl.length,
      totalChatMessages: chat.length,
      totalPlayCount,
    };
  },
};
