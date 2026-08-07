import React, { useEffect, useState } from 'react';
import { Track, Album } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Music,
  Plus,
  Filter,
  Play,
  Mic2,
  Edit2,
  Trash2,
  X,
  FileText,
  Clock,
  Disc,
  CheckCircle2,
} from 'lucide-react';

interface TracksViewProps {
  searchTerm: string;
  selectedAlbumId?: string | null;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const TracksView: React.FC<TracksViewProps> = ({
  searchTerm,
  selectedAlbumId,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { addToast, playTrack, refreshKey, triggerRefresh } = useBackend();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filterAlbumId, setFilterAlbumId] = useState<string>(selectedAlbumId || '');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [albumId, setAlbumId] = useState('');
  const [title, setTitle] = useState('');
  const [rawangTitle, setRawangTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [ownerType, setOwnerType] = useState<'singer' | 'organization' | 'anonymous'>('singer');
  const [durationSeconds, setDurationSeconds] = useState<number>(180);
  const [audioUrlString, setAudioUrlString] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [karaokeFile, setKaraokeFile] = useState<File | null>(null);
  const [karaokeAudioUrlString, setKaraokeAudioUrlString] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [genre, setGenre] = useState('Folk');
  const [playCount, setPlayCount] = useState<number>(0);
  const [hasKaraoke, setHasKaraoke] = useState(false);

  // Lyrics viewer modal
  const [viewingLyricsTrack, setViewingLyricsTrack] = useState<Track | null>(null);

  // Delete modal
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedAlbumId) {
      setFilterAlbumId(selectedAlbumId);
    }
  }, [selectedAlbumId]);

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchTracksAndAlbums = async () => {
    setIsLoading(true);
    try {
      const [tData, aData] = await Promise.all([
        api.getTracks(filterAlbumId || undefined),
        api.getAlbums(),
      ]);
      setTracks(tData || []);
      setAlbums(aData || []);
    } catch (err: any) {
      addToast('error', `Failed to load tracks: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracksAndAlbums();
  }, [filterAlbumId, refreshKey]);

  const handleOpenCreate = () => {
    setEditingTrack(null);
    const initialAlbum = albums.find((a) => a.id === filterAlbumId) || albums[0];
    setAlbumId(initialAlbum?.id || '');
    setAlbumName(initialAlbum?.title || '');
    setArtistName(initialAlbum?.ownerName || '');
    setOwnerType(initialAlbum?.ownerType || 'singer');
    setTitle('');
    setRawangTitle('');
    setDurationSeconds(210);
    setAudioUrlString('');
    setAudioFile(null);
    setKaraokeFile(null);
    setKaraokeAudioUrlString('');
    setLyrics('');
    setGenre('Folk');
    setPlayCount(0);
    setHasKaraoke(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (track: Track) => {
    setEditingTrack(track);
    setAlbumId(track.albumId);
    setAlbumName(track.albumName);
    setArtistName(track.artistName);
    setOwnerType(track.ownerType);
    setTitle(track.title);
    setRawangTitle(track.rawangTitle || '');
    setDurationSeconds(track.durationSeconds || 180);
    setAudioUrlString(track.audioUrl);
    setAudioFile(null);
    setKaraokeFile(null);
    setKaraokeAudioUrlString(track.karaokeAudioUrl || '');
    setLyrics(track.lyrics || '');
    setGenre(track.genre || 'Folk');
    setPlayCount(track.playCount || 0);
    setHasKaraoke(track.hasKaraoke || false);
    setIsModalOpen(true);
  };

  const handleAlbumSelectionChange = (selectedId: string) => {
    setAlbumId(selectedId);
    const alb = albums.find((a) => a.id === selectedId);
    if (alb) {
      setAlbumName(alb.title);
      setArtistName(alb.ownerName);
      setOwnerType(alb.ownerType);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumId || !title.trim() || !artistName.trim() || !albumName.trim()) {
      addToast('warning', 'Please fill out all required track fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bodyData: FormData | Record<string, unknown>;

      if (audioFile || karaokeFile) {
        const fd = new FormData();
        fd.append('albumId', albumId);
        fd.append('title', title.trim());
        if (rawangTitle) fd.append('rawangTitle', rawangTitle.trim());
        fd.append('artistName', artistName.trim());
        fd.append('albumName', albumName.trim());
        fd.append('ownerType', ownerType);
        fd.append('durationSeconds', String(durationSeconds));
        fd.append('genre', genre);
        fd.append('playCount', String(playCount));
        if (lyrics) fd.append('lyrics', lyrics.trim());
        fd.append('hasKaraoke', String(Boolean(hasKaraoke || karaokeFile)));

        if (audioFile) {
          fd.append('audioUrl', audioFile);
        } else if (audioUrlString) {
          fd.append('audioUrl', audioUrlString);
        }

        if (karaokeFile) {
          fd.append('karaokeAudioUrl', karaokeFile);
        } else if (karaokeAudioUrlString) {
          fd.append('karaokeAudioUrl', karaokeAudioUrlString);
        }

        bodyData = fd;
      } else {
        bodyData = {
          albumId,
          title: title.trim(),
          rawangTitle: rawangTitle.trim(),
          artistName: artistName.trim(),
          albumName: albumName.trim(),
          ownerType,
          durationSeconds: Number(durationSeconds),
          audioUrl: audioUrlString || `albums/${albumId}/tracks/track.mp3`,
          lyrics: lyrics.trim(),
          genre,
          playCount: Number(playCount),
          hasKaraoke: Boolean(hasKaraoke || karaokeAudioUrlString),
          karaokeAudioUrl: karaokeAudioUrlString || null,
        };
      }

      if (editingTrack) {
        await api.updateTrack(editingTrack.id, bodyData);
        addToast('success', `Track "${title}" updated successfully.`);
      } else {
        await api.createTrack(bodyData);
        addToast('success', `Track "${title}" added to catalogue.`);
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchTracksAndAlbums();
    } catch (err: any) {
      addToast('error', `Track save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTrack) return;
    setIsDeleting(true);
    try {
      await api.deleteTrack(deletingTrack.id);
      addToast('success', `Track "${deletingTrack.title}" deleted.`);
      setDeletingTrack(null);
      triggerRefresh();
      fetchTracksAndAlbums();
    } catch (err: any) {
      addToast('error', `Delete track error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(term) ||
      (t.rawangTitle || '').toLowerCase().includes(term) ||
      t.artistName.toLowerCase().includes(term) ||
      t.albumName.toLowerCase().includes(term) ||
      (t.genre || '').toLowerCase().includes(term);

    const matchesGenre = filterGenre === 'all' || (t.genre || 'Folk') === filterGenre;

    return matchesSearch && matchesGenre;
  });

  const availableGenres = Array.from(new Set(tracks.map((t) => t.genre || 'Folk'))).filter(Boolean);

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div className="flex flex-wrap items-center gap-3">
          {/* Album selector filter */}
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-[#666666]" />
            <select
              value={filterAlbumId}
              onChange={(e) => setFilterAlbumId(e.target.value)}
              className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
            >
              <option value="">All Albums</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.ownerName})
                </option>
              ))}
            </select>
          </div>

          {/* Genre selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#666666]" />
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
            >
              <option value="all">All Genres</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Track</span>
        </button>
      </div>

      {/* Tracks Table */}
      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-[#141414] rounded" />
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Music className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Audio Tracks Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {searchTerm || filterAlbumId
              ? 'No tracks match your current album or keyword search filters.'
              : 'Add your first Rawang song track to start building the audio catalogue.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Track
          </button>
        </div>
      ) : (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#ededed]">
              <thead className="bg-[#171717] border-b border-[#282828] text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Play</th>
                  <th className="px-4 py-3">Track Title</th>
                  <th className="px-4 py-3">Artist & Album</th>
                  <th className="px-4 py-3">Genre</th>
                  <th className="px-4 py-3">Karaoke</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Plays</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {filteredTracks.map((track) => (
                  <tr key={track.id} className="hover:bg-[#222222] transition-colors group">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => playTrack(track)}
                        className="w-7 h-7 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black flex items-center justify-center transition-colors shadow-sm"
                        title="Listen to Track"
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-black" />
                      </button>
                    </td>

                    <td className="px-4 py-2.5 min-w-[180px]">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{track.title}</span>
                      </div>
                      {track.rawangTitle && (
                        <div className="text-[10px] text-[#3ecf8e] font-mono">
                          {track.rawangTitle}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="text-[#ededed] font-medium">{track.artistName}</div>
                      <div className="text-[10px] text-[#666666] font-mono">{track.albumName}</div>
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#888888] font-mono text-[10px]">
                        {track.genre || 'Folk'}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      {track.hasKaraoke || track.karaokeAudioUrl ? (
                        <button
                          onClick={() => playTrack(track, true)}
                          className="px-2 py-0.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] text-[10px] font-mono font-bold flex items-center gap-1 hover:bg-[#3ecf8e]/20 transition-colors"
                          title="Listen to Karaoke Track"
                        >
                          <Mic2 className="w-3 h-3" />
                          <span>Karaoke</span>
                        </button>
                      ) : (
                        <span className="text-[#444444] text-[10px] font-mono">No</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 font-mono text-[#888888]">
                      {Math.floor(track.durationSeconds / 60)}:
                      {(track.durationSeconds % 60).toString().padStart(2, '0')}
                    </td>

                    <td className="px-4 py-2.5 font-mono text-[#ededed]">
                      {(track.playCount || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {track.lyrics && (
                          <button
                            onClick={() => setViewingLyricsTrack(track)}
                            className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                            title="View Lyrics"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(track)}
                          className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                          title="Edit Track"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTrack(track)}
                          className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete Track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TRACK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-lg w-full p-6 shadow-2xl relative text-[#ededed] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                if (onCloseCreate) onCloseCreate();
              }}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <Music className="w-4 h-4 text-[#3ecf8e]" />
              {editingTrack ? 'Edit Track' : 'Add New Track'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">
              Schema: albumId, title, artistName, albumName, ownerType, durationSeconds, audioUrl
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Album Selection */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Album <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={albumId}
                  onChange={(e) => handleAlbumSelectionChange(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                >
                  <option value="">-- Choose Target Album --</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Rawang Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Track Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mountain Echoes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Rawang Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Azi Mung La"
                    value={rawangTitle}
                    onChange={(e) => setRawangTitle(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              {/* Artist Name & Album Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Artist Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Album Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              {/* Duration & Genre */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Duration (Sec) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Genre</label>
                  <input
                    type="text"
                    placeholder="Folk / Acoustic"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Initial Plays</label>
                  <input
                    type="number"
                    min={0}
                    value={playCount}
                    onChange={(e) => setPlayCount(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              {/* Audio File Upload */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Audio File Upload (Multer / MinIO) <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#ededed] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#3ecf8e] file:text-black hover:file:bg-[#34b27b]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Or Audio URL / MinIO Object Key String
                </label>
                <input
                  type="text"
                  placeholder="e.g. albums/albumId/tracks/song.mp3 or https://..."
                  value={audioUrlString}
                  onChange={(e) => setAudioUrlString(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              {/* Karaoke Track File Upload */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Optional Karaoke Audio Track File
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setKaraokeFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#ededed] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#222222] file:text-[#3ecf8e] file:border file:border-[#333333]"
                />
              </div>

              {/* Lyrics */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Lyrics</label>
                <textarea
                  rows={3}
                  placeholder="Song lyrics..."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e] font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#282828] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseCreate) onCloseCreate();
                  }}
                  className="px-4 py-2 rounded text-[#ededed] bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Save Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LYRICS MODAL */}
      {viewingLyricsTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-md w-full p-6 shadow-2xl relative text-[#ededed]">
            <button
              onClick={() => setViewingLyricsTrack(null)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3ecf8e]" />
              {viewingLyricsTrack.title}
            </h3>
            <p className="text-xs text-[#888888] mb-4 font-mono">{viewingLyricsTrack.artistName}</p>

            <div className="bg-[#141414] border border-[#282828] rounded p-4 text-xs font-mono text-[#ededed] whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {viewingLyricsTrack.lyrics}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingTrack)}
        title="Delete Track"
        message={`Are you sure you want to delete "${deletingTrack?.title}"?`}
        resourceType="track"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTrack(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
