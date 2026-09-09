import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper Mongo ObjectId simulator
function generateMongoId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
      .toLowerCase()
  );
}

// Initial Sample Data for Rawang Music
let singers = [
  {
    id: '66b1a2f00000000000000101',
    name: 'Khar Lu',
    avatarUrl: 'singer/avatar_khar_lu.jpg',
    description: 'Master of traditional Rawang mountain melodies and modern acoustic fusion.',
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-01-10').toISOString(),
  },
  {
    id: '66b1a2f00000000000000102',
    name: 'Seng Nu',
    avatarUrl: 'singer/avatar_seng_nu.jpg',
    description: 'Celebrated vocal artist known for contemporary Rawang pop and gospel songs.',
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date('2026-02-01').toISOString(),
  },
];

let organizations = [
  {
    id: '66b1a2f00000000000000201',
    name: 'Rawang Cultural Heritage & Music Association',
    avatarUrl: 'org/avatar_rchma.jpg',
    description: 'Preserving and publishing authentic Rawang indigenous folk music and audio archives.',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
];

let albums = [
  {
    id: '66b1a2f00000000000000001',
    title: 'Voice of Rawang Valleys',
    ownerType: 'singer',
    ownerName: 'Khar Lu',
    ownerModel: 'Singer',
    ownerId: '66b1a2f00000000000000101',
    coverResName: '',
    coverImage: 'albums/66b1a2f00000000000000001/cover.jpg',
    releaseYear: 2026,
    description: 'Atmospheric folk melodies from the high northern mountain ranges.',
    trackCount: 3,
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: '66b1a2f00000000000000002',
    title: 'Hkakabo Razi Echoes',
    ownerType: 'organization',
    ownerName: 'Rawang Cultural Heritage & Music Association',
    ownerModel: 'Organization',
    ownerId: '66b1a2f00000000000000201',
    coverResName: '',
    coverImage: 'albums/66b1a2f00000000000000002/cover.jpg',
    releaseYear: 2025,
    description: 'Archival collection of traditional community flutes and choral anthems.',
    trackCount: 2,
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
  },
];

let tracks = [
  {
    id: '66b1a2f00000000000000011',
    albumId: '66b1a2f00000000000000001',
    title: 'Azi Mung Mountain Song',
    rawangTitle: 'Azi Mung La',
    artistName: 'Khar Lu',
    albumName: 'Voice of Rawang Valleys',
    ownerType: 'singer',
    durationSeconds: 215,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    lyrics: 'High above the snow line\nWhere mountain winds sing freely\nOur ancestors left their melodies\nResonating through time.',
    genre: 'Folk',
    playCount: 2840,
    hasKaraoke: true,
    karaokeAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    createdAt: new Date('2026-01-16').toISOString(),
    updatedAt: new Date('2026-01-16').toISOString(),
  },
  {
    id: '66b1a2f00000000000000012',
    albumId: '66b1a2f00000000000000001',
    title: 'Valley Breeze',
    rawangTitle: 'Kanggaw Mung',
    artistName: 'Khar Lu',
    albumName: 'Voice of Rawang Valleys',
    ownerType: 'singer',
    durationSeconds: 180,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    lyrics: 'Gentle breeze carrying springtime scents across Putao valley...',
    genre: 'Acoustic',
    playCount: 1920,
    hasKaraoke: false,
    karaokeAudioUrl: null,
    createdAt: new Date('2026-01-17').toISOString(),
    updatedAt: new Date('2026-01-17').toISOString(),
  },
  {
    id: '66b1a2f00000000000000013',
    albumId: '66b1a2f00000000000000001',
    title: 'Sunrise Over Hkakabo',
    rawangTitle: 'Dazung Sanggaw',
    artistName: 'Khar Lu',
    albumName: 'Voice of Rawang Valleys',
    ownerType: 'singer',
    durationSeconds: 245,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    lyrics: 'Golden rays illuminating the sacred peak...',
    genre: 'Folk Pop',
    playCount: 3100,
    hasKaraoke: true,
    karaokeAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    createdAt: new Date('2026-01-18').toISOString(),
    updatedAt: new Date('2026-01-18').toISOString(),
  },
  {
    id: '66b1a2f00000000000000014',
    albumId: '66b1a2f00000000000000002',
    title: 'Ancestral Harvest Anthem',
    rawangTitle: 'Rzi Mung Heritage',
    artistName: 'Rawang Cultural Heritage & Music Association',
    albumName: 'Hkakabo Razi Echoes',
    ownerType: 'organization',
    durationSeconds: 310,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    lyrics: 'Celebration of bumper harvest, community feast, and ancient blessing.',
    genre: 'Cultural Choral',
    playCount: 1450,
    hasKaraoke: false,
    karaokeAudioUrl: null,
    createdAt: new Date('2026-02-11').toISOString(),
    updatedAt: new Date('2026-02-11').toISOString(),
  },
];

// Backfill albumIds mirror for seed mock tracks
tracks = tracks.map((t: any) => ({ ...t, albumIds: [t.albumId] }));

let playlists = [
  {
    id: '66b1a2f00000000000000301',
    name: 'Essential Rawang Classics',
    description: 'Top requested traditional and modern Rawang tracks for cultural celebrations.',
    createdTimestamp: Date.now() - 86400000 * 10,
    iconName: 'music',
    trackIds: ['66b1a2f00000000000000011', '66b1a2f00000000000000013'],
    createdAt: new Date('2026-01-20').toISOString(),
    updatedAt: new Date('2026-01-20').toISOString(),
  },
];

let chatMessages = [
  {
    id: '66b1a2f00000000000000401',
    senderName: 'System Broadcast',
    message: 'Welcome to Rawang Music Admin Portal! All systems running smoothly.',
    timestamp: Date.now() - 3600000 * 5,
    attachedTrackId: '66b1a2f00000000000000011',
    attachedTrackTitle: 'Azi Mung Mountain Song',
    isUser: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '66b1a2f00000000000000402',
    senderName: 'Audio Admin',
    message: 'New high quality karaoke tracks uploaded for Khar Lu album.',
    timestamp: Date.now() - 1800000,
    isUser: true,
    createdAt: new Date().toISOString(),
  },
];

// USERS - matches Flutter UserEntity + backend User.js (phone+password JWT, manual 1m/3m/1y)
let users: any[] = [
  {
    id: '66b1a2f00000000000000501',
    phone: '09954395321',
    email: 'mabuphongram171@gmail.com',
    name: 'MB Pongram',
    avatarUrl: '',
    role: 'user',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 4 * 365 * 86400000).toISOString(),
    subscriptionStartedAt: new Date().toISOString(),
    lastPaymentAt: null,
    lastPaymentAmount: null,
    mustChangePassword: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '66b1a2f00000000000000502',
    phone: '09911122233',
    email: null,
    name: 'Seng Mai',
    avatarUrl: '',
    role: 'user',
    subscriptionPlan: 'one_month',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    subscriptionStartedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastPaymentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastPaymentAmount: 5000,
    mustChangePassword: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '66b1a2f00000000000000503',
    phone: '09999988877',
    email: 'artist@rawang.test',
    name: 'Khar Lu',
    avatarUrl: 'singer/avatar_khar_lu.jpg',
    role: 'artist',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 4 * 365 * 86400000).toISOString(),
    subscriptionStartedAt: new Date().toISOString(),
    lastPaymentAt: null,
    lastPaymentAmount: null,
    mustChangePassword: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Health Check (outside /api)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Also health under /api for convenience
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ALBUMS
app.get('/api/albums', (req, res) => {
  const { ownerType } = req.query;
  let result = [...albums];
  if (ownerType) {
    result = result.filter((a) => a.ownerType === ownerType);
  }
  // Oldest first
  result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(result);
});

app.get('/api/albums/:id', (req, res) => {
  const album = albums.find((a) => a.id === req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  res.json(album);
});

app.post('/api/albums', (req, res) => {
  const { title, ownerType, ownerName, releaseYear, ownerModel, ownerId, coverResName, coverImage, description } = req.body;
  if (!title || !ownerType || !ownerName || !releaseYear) {
    return res.status(400).json({ error: 'Missing required fields: title, ownerType, ownerName, releaseYear' });
  }
  const id = generateMongoId();
  const newAlbum = {
    id,
    title,
    ownerType,
    ownerName,
    ownerModel: ownerModel || (ownerType === 'singer' ? 'Singer' : ownerType === 'organization' ? 'Organization' : undefined),
    ownerId: ownerId || '',
    coverResName: coverResName || '',
    coverImage: coverImage || `albums/${id}/cover.jpg`,
    releaseYear: Number(releaseYear),
    description: description || '',
    trackCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  albums.push(newAlbum);
  res.status(201).json(newAlbum);
});

app.put('/api/albums/:id', (req, res) => {
  const index = albums.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Album not found' });

  const existing = albums[index];
  const updated = {
    ...existing,
    ...req.body,
    releaseYear: req.body.releaseYear ? Number(req.body.releaseYear) : existing.releaseYear,
    updatedAt: new Date().toISOString(),
  };
  albums[index] = updated;
  res.json(updated);
});

app.delete('/api/albums/:id', (req, res) => {
  albums = albums.filter((a) => a.id !== req.params.id);
  res.status(204).send();
});

// TRACKS
// Many-to-many: a track carries albumIds[] with albumId as primary mirror.
function trackAlbumIds(t: any): string[] {
  if (Array.isArray(t.albumIds) && t.albumIds.length > 0) return t.albumIds.map(String);
  if (t.albumId) return [String(t.albumId)];
  return [];
}
function parseAlbumIdsField(value: any, fallbackId?: string): string[] {
  let ids: any = value;
  if (typeof ids === 'string') {
    try {
      ids = JSON.parse(ids);
    } catch {
      ids = [ids];
    }
  }
  if (Array.isArray(ids) && ids.length > 0) return ids.map(String);
  if (fallbackId) return [String(fallbackId)];
  return [];
}
function recountAlbumTracks(albumId: string) {
  const alb = albums.find((a) => a.id === albumId);
  if (alb) {
    alb.trackCount = tracks.filter((t) => trackAlbumIds(t).includes(albumId)).length;
  }
}
app.get('/api/tracks', (req, res) => {
  const { albumId } = req.query;
  let result = [...tracks];
  if (albumId) {
    result = result.filter((t) => trackAlbumIds(t).includes(String(albumId)));
  }
  result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(result);
});

app.get('/api/tracks/:id', (req, res) => {
  const track = tracks.find((t) => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  res.json(track);
});

app.post('/api/tracks', (req, res) => {
  const { albumId, albumIds, title, artistName, albumName, ownerType, durationSeconds, audioUrl, rawangTitle, lyrics, genre, playCount, hasKaraoke, karaokeAudioUrl } = req.body;
  const resolvedAlbumIds = parseAlbumIdsField(albumIds, albumId);
  if (resolvedAlbumIds.length === 0 || !title || !artistName || !albumName || !ownerType || !durationSeconds) {
    return res.status(400).json({ error: 'Missing required track fields' });
  }

  const id = generateMongoId();
  const finalHasKaraoke = Boolean(hasKaraoke || karaokeAudioUrl);
  const newTrack = {
    id,
    albumIds: resolvedAlbumIds,
    albumId: resolvedAlbumIds[0],
    title,
    rawangTitle: rawangTitle || '',
    artistName,
    albumName,
    ownerType,
    durationSeconds: Number(durationSeconds),
    audioUrl: audioUrl || `albums/${resolvedAlbumIds[0]}/tracks/${id}.mp3`,
    lyrics: lyrics || '',
    genre: genre || 'Folk',
    playCount: Number(playCount || 0),
    hasKaraoke: finalHasKaraoke,
    karaokeAudioUrl: karaokeAudioUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tracks.push(newTrack);

  // Update album trackCounts
  resolvedAlbumIds.forEach(recountAlbumTracks);

  res.status(201).json(newTrack);
});

app.put('/api/tracks/:id', (req, res) => {
  const index = tracks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Track not found' });

  const existing = tracks[index];
  const updated = {
    ...existing,
    ...req.body,
    durationSeconds: req.body.durationSeconds ? Number(req.body.durationSeconds) : existing.durationSeconds,
    playCount: req.body.playCount !== undefined ? Number(req.body.playCount) : existing.playCount,
    hasKaraoke: req.body.karaokeAudioUrl ? true : req.body.hasKaraoke !== undefined ? Boolean(req.body.hasKaraoke) : existing.hasKaraoke,
    updatedAt: new Date().toISOString(),
  };
  if (req.body.albumIds !== undefined || req.body.albumId !== undefined) {
    updated.albumIds = parseAlbumIdsField(req.body.albumIds, req.body.albumId || existing.albumId);
    updated.albumId = updated.albumIds[0] || existing.albumId;
  }
  tracks[index] = updated;

  res.json(updated);
});

app.delete('/api/tracks/:id', (req, res) => {
  const trk = tracks.find((t) => t.id === req.params.id);
  tracks = tracks.filter((t) => t.id !== req.params.id);
  if (trk) {
    trackAlbumIds(trk).forEach(recountAlbumTracks);
  }
  res.status(204).send();
});

// SINGERS
app.get('/api/singers', (req, res) => {
  res.json(singers);
});

app.get('/api/singers/:id', (req, res) => {
  const singer = singers.find((s) => s.id === req.params.id);
  if (!singer) return res.status(404).json({ error: 'Singer not found' });
  res.json(singer);
});

app.post('/api/singers', (req, res) => {
  const { name, avatarUrl, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = generateMongoId();
  const newSinger = {
    id,
    name,
    avatarUrl: avatarUrl || `singer/${id}.jpg`,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  singers.push(newSinger);
  res.status(201).json(newSinger);
});

app.put('/api/singers/:id', (req, res) => {
  const index = singers.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Singer not found' });

  const existing = singers[index];
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  singers[index] = updated;
  res.json(updated);
});

app.delete('/api/singers/:id', (req, res) => {
  singers = singers.filter((s) => s.id !== req.params.id);
  res.status(204).send();
});

// ORGANIZATIONS
app.get('/api/organizations', (req, res) => {
  res.json(organizations);
});

app.get('/api/organizations/:id', (req, res) => {
  const org = organizations.find((o) => o.id === req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

app.post('/api/organizations', (req, res) => {
  const { name, avatarUrl, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = generateMongoId();
  const newOrg = {
    id,
    name,
    avatarUrl: avatarUrl || `org/${id}.jpg`,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  organizations.push(newOrg);
  res.status(201).json(newOrg);
});

app.put('/api/organizations/:id', (req, res) => {
  const index = organizations.findIndex((o) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Organization not found' });

  const existing = organizations[index];
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  organizations[index] = updated;
  res.json(updated);
});

app.delete('/api/organizations/:id', (req, res) => {
  organizations = organizations.filter((o) => o.id !== req.params.id);
  res.status(204).send();
});

// PLAYLISTS
app.get('/api/playlists', (req, res) => {
  res.json(playlists);
});

app.post('/api/playlists', (req, res) => {
  const { name, description, createdTimestamp, iconName, trackIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Playlist name is required' });

  const id = generateMongoId();
  const newPlaylist = {
    id,
    name,
    description: description || '',
    createdTimestamp: Number(createdTimestamp || Date.now()),
    iconName: iconName || 'music',
    trackIds: Array.isArray(trackIds) ? trackIds : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  playlists.push(newPlaylist);
  res.status(201).json(newPlaylist);
});

app.get('/api/playlists/:id/tracks', (req, res) => {
  const playlist = playlists.find((p) => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

  const populatedTracks = (playlist.trackIds || [])
    .map((tid) => tracks.find((t) => t.id === tid))
    .filter(Boolean);

  res.json(populatedTracks);
});

app.post('/api/playlists/:id/tracks', (req, res) => {
  const playlist = playlists.find((p) => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

  const { trackId } = req.body;
  if (!trackId) return res.status(400).json({ error: 'trackId is required' });

  if (!playlist.trackIds) playlist.trackIds = [];
  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
  }

  playlist.updatedAt = new Date().toISOString();
  res.json(playlist);
});

app.delete('/api/playlists/:id/tracks/:trackId', (req, res) => {
  const playlist = playlists.find((p) => p.id === req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

  const { trackId } = req.params;
  if (playlist.trackIds) {
    playlist.trackIds = playlist.trackIds.filter((tid) => tid !== trackId);
  }
  playlist.updatedAt = new Date().toISOString();
  res.json(playlist);
});

// CHAT MESSAGES
app.get('/api/chat/messages', (req, res) => {
  const sorted = [...chatMessages].sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  res.json(sorted);
});

app.post('/api/chat/messages', (req, res) => {
  const { senderName, message, timestamp, attachedTrackId, attachedTrackTitle, isUser } = req.body;
  if (!senderName) return res.status(400).json({ error: 'senderName is required' });

  const newMsg = {
    id: generateMongoId(),
    senderName,
    message: message || '',
    timestamp: Number(timestamp || Date.now()),
    attachedTrackId: attachedTrackId || undefined,
    attachedTrackTitle: attachedTrackTitle || undefined,
    isUser: Boolean(isUser),
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(newMsg);
  res.status(201).json(newMsg);
});

// USERS - manual subscription management (1000 users, free 4y -> 1m/3m/1y)
app.get('/api/users', (req, res) => {
  const { search } = req.query as any;
  let result = [...users];
  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter((u) => u.phone.includes(term) || u.name.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term));
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/users/:id/subscription', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { plan, amount } = req.body as { plan: string; amount?: number };
  const allowed = ['free', 'one_month', 'three_months', 'one_year'];
  if (!allowed.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  const now = new Date();
  let expires = new Date(user.subscriptionExpiresAt);
  // if expired, start from now, else extend from current expiry
  const base = expires > now ? expires : now;
  if (plan === 'free') expires = new Date(now.getTime() + 4 * 365 * 86400000);
  else if (plan === 'one_month') expires = new Date(base.getTime() + 30 * 86400000);
  else if (plan === 'three_months') expires = new Date(base.getTime() + 90 * 86400000);
  else if (plan === 'one_year') expires = new Date(base.getTime() + 365 * 86400000);
  user.subscriptionPlan = plan;
  user.subscriptionStatus = 'active';
  user.subscriptionExpiresAt = expires.toISOString();
  user.subscriptionStartedAt = now.toISOString();
  user.lastPaymentAt = now.toISOString();
  user.lastPaymentAmount = amount ?? null;
  user.updatedAt = now.toISOString();
  res.json(user);
});

app.post('/api/users/:id/reset-password', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
  user.mustChangePassword = true;
  user.updatedAt = new Date().toISOString();
  res.json({ message: 'Password reset to temp, user must change on next login', tempPassword });
});

app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.status(204).send();
});

// LEGACY UPLOADS
app.post('/api/uploads', (req, res) => {
  res.json({ url: `/uploads/sample_${Date.now()}.mp3` });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rawang Music Admin Portal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
