import React, { useEffect, useState } from 'react';
import { Contribution, Album, Track } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Inbox, Play, Mic2, CheckCircle2, Trash2, X, Clock, User } from 'lucide-react';

interface ContributionsViewProps {
  searchTerm: string;
}

type StatusFilter = 'pending' | 'approved' | '';

function formatDuration(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export const ContributionsView: React.FC<ContributionsViewProps> = ({ searchTerm }) => {
  const { addToast, playTrack, refreshKey, triggerRefresh } = useBackend();

  const [items, setItems] = useState<Contribution[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Approve modal
  const [approving, setApproving] = useState<Contribution | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [albumIds, setAlbumIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [composerName, setComposerName] = useState('');
  const [genre, setGenre] = useState('Cultural');

  // Discard modal
  const [discarding, setDiscarding] = useState<Contribution | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cData, aData] = await Promise.all([
        api.getContributions(statusFilter || undefined),
        api.getAlbums(),
      ]);
      setItems(cData || []);
      setAlbums(aData || []);
    } catch (err: any) {
      addToast('error', `Failed to load contributions: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, refreshKey]);

  const previewTrack = (c: Contribution, karaoke = false) => {
    playTrack(
      {
        id: c.id,
        albumIds: [],
        title: c.title,
        artistName: c.artistName,
        albumName: 'Pending review',
        ownerType: 'singer',
        durationSeconds: c.durationSeconds,
        audioUrl: karaoke ? c.karaokeAudioUrl || c.audioUrl : c.audioUrl,
        genre: '',
        playCount: 0,
        hasKaraoke: Boolean(c.karaokeAudioUrl),
        karaokeAudioUrl: c.karaokeAudioUrl,
      } as Track,
      karaoke
    );
  };

  const openApprove = (c: Contribution) => {
    setApproving(c);
    setTitle(c.title);
    setArtistName(c.artistName);
    setComposerName(c.composerName || '');
    setGenre('Cultural');
    setAlbumIds([]);
  };

  const toggleAlbum = (id: string) => {
    setAlbumIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approving) return;
    if (albumIds.length === 0) {
      addToast('warning', 'Select at least one album to publish this song into.');
      return;
    }
    if (!title.trim() || !artistName.trim()) {
      addToast('warning', 'Title and artist name are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.approveContribution(approving.id, {
        albumIds,
        title: title.trim(),
        artistName: artistName.trim(),
        composerName: composerName.trim(),
        genre,
      });
      addToast('success', `Published "${title}" to ${albumIds.length} album(s).`);
      setApproving(null);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Approve error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (!discarding) return;
    setIsDeleting(true);
    try {
      await api.deleteContribution(discarding.id);
      addToast('success', `Discarded "${discarding.title}" — files and record deleted.`);
      setDiscarding(null);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Discard error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = items.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.artistName.toLowerCase().includes(term) ||
      (c.composerName || '').toLowerCase().includes(term) ||
      c.contributorName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Pending Contributions</h3>
          <p className="text-xs text-[#888888]">Preview community uploads, publish into albums, or discard with full cleanup</p>
        </div>
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#666666]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved history</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#141414] rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Inbox className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">Queue Empty</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            No {statusFilter || ''} contributions. New uploads from the app appear here for review.
          </p>
        </div>
      ) : (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#ededed]">
              <thead className="bg-[#171717] border-b border-[#282828] text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Song</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Contributor</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#222222] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => previewTrack(c)}
                          className="w-7 h-7 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black flex items-center justify-center transition-colors shadow-sm"
                          title="Preview song"
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-black" />
                        </button>
                        {c.karaokeAudioUrl && (
                          <button
                            onClick={() => previewTrack(c, true)}
                            className="px-2 py-1 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] text-[10px] font-mono font-bold flex items-center gap-1 hover:bg-[#3ecf8e]/20 transition-colors"
                            title="Preview karaoke"
                          >
                            <Mic2 className="w-3 h-3" />
                            <span>Karaoke</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 min-w-[180px]">
                      <div className="font-bold text-white">{c.title}</div>
                      <div className="text-[11px] text-[#ededed]">{c.artistName}</div>
                      {c.composerName && (
                        <div className="text-[10px] text-[#666666] font-mono">Composer: {c.composerName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#888888]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(c.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-[#ededed]">
                        <User className="w-3.5 h-3.5 text-[#666666]" />
                        {c.contributorName}
                      </div>
                      <div className="text-[10px] text-[#666666] font-mono">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openApprove(c)}
                              className="px-2.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Approve into albums"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setDiscarding(c)}
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Discard (deletes files + record)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] text-[10px] font-mono font-bold">
                            PUBLISHED
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-lg w-full p-6 shadow-2xl relative text-[#ededed] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setApproving(null)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
              Publish "{approving.title}"
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">
              From {approving.contributorName} • {formatDuration(approving.durationSeconds)} • audio moves pending/ → albums/
            </p>

            <form onSubmit={handleApprove} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Albums <span className="text-red-400">*</span>
                  <span className="ml-2 text-[10px] text-[#666666] font-normal">{albumIds.length} selected</span>
                </label>
                <div className="max-h-40 overflow-y-auto bg-[#141414] border border-[#282828] rounded px-3 py-2 space-y-1.5">
                  {albums.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer text-[#ededed]">
                      <input
                        type="checkbox"
                        checked={albumIds.includes(a.id)}
                        onChange={() => toggleAlbum(a.id)}
                        className="w-4 h-4 accent-[#3ecf8e] shrink-0"
                      />
                      <span className="truncate">
                        {a.title} <span className="text-[#666666] font-mono">({a.ownerName})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Artist <span className="text-red-400">*</span>
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
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Composer</label>
                  <input
                    type="text"
                    value={composerName}
                    onChange={(e) => setComposerName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="pt-3 border-t border-[#282828] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApproving(null)}
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
                  Publish Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCARD CONFIRM */}
      <ConfirmDialog
        isOpen={Boolean(discarding)}
        title="Discard Contribution"
        message={`Permanently discard "${discarding?.title}" by ${discarding?.contributorName}? The MP3 files and the record are deleted and cannot be recovered.`}
        resourceType="contribution"
        onConfirm={handleDiscard}
        onCancel={() => setDiscarding(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
