import React, { useEffect, useState } from 'react';
import { Playlist, Track } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import {
  ListMusic,
  Plus,
  Play,
  Music,
  Trash2,
  X,
  Info,
  CheckCircle2,
  PlusCircle,
  Search,
} from 'lucide-react';

interface PlaylistsViewProps {
  searchTerm: string;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  searchTerm,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { addToast, playTrack, refreshKey, triggerRefresh } = useBackend();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('music');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inspect Playlist Tracks Modal
  const [inspectingPlaylist, setInspectingPlaylist] = useState<Playlist | null>(null);
  const [populatedTracks, setPopulatedTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState('');
  const [isAddingTrack, setIsAddingTrack] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchPlaylistsAndTracks = async () => {
    setIsLoading(true);
    try {
      const [pData, tData] = await Promise.all([api.getPlaylists(), api.getTracks()]);
      setPlaylists(pData || []);
      setAllTracks(tData || []);
    } catch (err: any) {
      addToast('error', `Failed to load playlists: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistsAndTracks();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setIconName('music');
    setIsCreateModalOpen(true);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Playlist name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPlaylist({
        name: name.trim(),
        description: description.trim(),
        iconName,
        createdTimestamp: Date.now(),
        trackIds: [],
      });
      addToast('success', `Playlist "${name}" created.`);
      setIsCreateModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchPlaylistsAndTracks();
    } catch (err: any) {
      addToast('error', `Create playlist failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInspectPlaylist = async (playlist: Playlist) => {
    setInspectingPlaylist(playlist);
    setIsLoadingTracks(true);
    try {
      const tracksData = await api.getPlaylistTracks(playlist.id);
      setPopulatedTracks(tracksData || []);
    } catch (err: any) {
      addToast('error', `Failed to load playlist tracks: ${err.message}`);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleAddTrackToPlaylist = async () => {
    if (!inspectingPlaylist || !selectedTrackToAdd) return;
    setIsAddingTrack(true);
    try {
      await api.addTrackToPlaylist(inspectingPlaylist.id, selectedTrackToAdd);
      addToast('success', 'Track added to playlist.');
      setSelectedTrackToAdd('');
      // Reload tracks
      const updatedTracks = await api.getPlaylistTracks(inspectingPlaylist.id);
      setPopulatedTracks(updatedTracks || []);
      triggerRefresh();
      fetchPlaylistsAndTracks();
    } catch (err: any) {
      addToast('error', `Add track error: ${err.message}`);
    } finally {
      setIsAddingTrack(false);
    }
  };

  const handleRemoveTrackFromPlaylist = async (trackId: string) => {
    if (!inspectingPlaylist) return;
    try {
      await api.removeTrackFromPlaylist(inspectingPlaylist.id, trackId);
      addToast('success', 'Track removed from playlist.');
      setPopulatedTracks((prev) => prev.filter((t) => t.id !== trackId));
      triggerRefresh();
      fetchPlaylistsAndTracks();
    } catch (err: any) {
      addToast('error', `Remove track error: ${err.message}`);
    }
  };

  const filteredPlaylists = playlists.filter((p) => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Top Banner */}
      <div className="bg-[#1c1c1c] border border-[#282828] p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#3ecf8e]" /> Curated Playlists
          </h3>
          <p className="text-xs text-[#888888] mt-0.5">
            Add playlists, populate track associations, and play custom streams
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Backend Contract Constraint Info Box */}
      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3.5 text-xs text-[#888888] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3ecf8e] shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-bold text-white">Backend API Notice:</span> The Rawang backend supports listing, creating, fetching playlist tracks (`GET /playlists/:id/tracks`), and adding/removing tracks (`POST & DELETE /playlists/:id/tracks`).
        </div>
      </div>

      {/* Playlists Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <ListMusic className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Playlists Created</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Create curated playlists and populate them with songs from the Rawang music catalogue.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-[#1c1c1c] border border-[#282828] hover:border-[#3e3e3e] rounded p-5 shadow-sm flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center font-bold">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#141414] border border-[#282828] text-[10px] font-mono text-[#3ecf8e]">
                    {(playlist.trackIds || []).length} Tracks
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-1">{playlist.name}</h4>
                <p className="text-xs text-[#888888] line-clamp-2 min-h-[32px]">
                  {playlist.description || 'No description.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#282828] flex items-center justify-between">
                <button
                  onClick={() => handleInspectPlaylist(playlist)}
                  className="px-3 py-1 rounded bg-[#222222] hover:bg-[#2a2a2a] text-[#3ecf8e] border border-[#333333] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Music className="w-3.5 h-3.5" /> Inspect Tracks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PLAYLIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-md w-full p-6 shadow-2xl relative text-[#ededed]">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                if (onCloseCreate) onCloseCreate();
              }}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#3ecf8e]" /> Create Playlist
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">Required field: name; Optional: description</p>

            <form onSubmit={handleCreatePlaylist} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Playlist Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Folk Favorites"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Description</label>
                <textarea
                  rows={3}
                  placeholder="Playlist details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="pt-3 border-t border-[#282828] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
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
                  Save Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT PLAYLIST TRACKS MODAL */}
      {inspectingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-xl w-full p-6 shadow-2xl relative text-[#ededed] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectingPlaylist(null)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#3ecf8e]" /> {inspectingPlaylist.name}
            </h3>
            <p className="text-xs text-[#888888] mb-4 font-mono">{inspectingPlaylist.description || 'Playlist tracks'}</p>

            {/* Add Track Control */}
            <div className="bg-[#141414] border border-[#282828] rounded p-3 mb-4 flex flex-col sm:flex-row items-center gap-2 text-xs">
              <select
                value={selectedTrackToAdd}
                onChange={(e) => setSelectedTrackToAdd(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
              >
                <option value="">-- Select Catalogue Track to Add --</option>
                {allTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} - {t.artistName} ({t.albumName})
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddTrackToPlaylist}
                disabled={!selectedTrackToAdd || isAddingTrack}
                className="w-full sm:w-auto px-4 py-2 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Populated Tracks List */}
            {isLoadingTracks ? (
              <div className="p-8 text-center text-xs text-[#888888] animate-pulse font-mono">
                Loading playlist track objects...
              </div>
            ) : populatedTracks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#282828] rounded font-mono">
                No tracks currently in this playlist. Select a track above to add it.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {populatedTracks.map((trk) => (
                  <div
                    key={trk.id}
                    className="flex items-center justify-between p-3 rounded bg-[#141414] border border-[#282828] text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <button
                        onClick={() => playTrack(trk)}
                        className="w-7 h-7 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black flex items-center justify-center transition-colors shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-black" />
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{trk.title}</div>
                        <div className="text-[10px] text-[#888888] font-mono truncate">
                          {trk.artistName} • {trk.albumName}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveTrackFromPlaylist(trk.id)}
                      className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                      title="Remove Track from Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
