import React, { useEffect, useState } from 'react';
import { Video } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MonitorPlay, Plus, Edit2, Trash2, X, CheckCircle2, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface VideosViewProps {
  searchTerm: string;
}

// Mirrors the backend extractor so the ID preview matches what will be stored.
export function extractYoutubeId(input: string): string {
  const s = (input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

export const youtubeThumb = (id: string) =>
  id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function parseDurationInput(v: string): number {
  const s = (v || '').trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d+):([0-5]?\d)$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return 0;
}

export const VideosView: React.FC<VideosViewProps> = ({ searchTerm }) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  // Delete modal
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVideos();
      setVideos(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load videos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [refreshKey]);

  const resetForm = (video?: Video | null) => {
    setTitle(video?.title || '');
    setDescription(video?.description || '');
    setYoutubeLink(video?.youtubeVideoId || '');
    setDurationInput(video?.durationSeconds ? formatDuration(video.durationSeconds) : '');
    setOrder(video?.order ?? 0);
    setIsPublished(video?.isPublished ?? true);
  };

  const handleOpenCreate = () => {
    setEditingVideo(null);
    resetForm(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (video: Video) => {
    setEditingVideo(video);
    resetForm(video);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('warning', 'Video title is required.');
      return;
    }
    const videoId = extractYoutubeId(youtubeLink);
    if (!videoId) {
      addToast('warning', 'Paste a valid YouTube link or 11-character video ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        youtubeVideoId: videoId,
        durationSeconds: parseDurationInput(durationInput),
        order: Number(order) || 0,
        isPublished: Boolean(isPublished),
      };

      if (editingVideo) {
        await api.updateVideo(editingVideo.id, payload);
        addToast('success', `Video "${title}" updated.`);
      } else {
        await api.createVideo(payload);
        addToast('success', `Video "${title}" added.`);
      }

      setIsModalOpen(false);
      triggerRefresh();
      fetchVideos();
    } catch (err: any) {
      addToast('error', `Video save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublished = async (video: Video) => {
    try {
      await api.updateVideo(video.id, { isPublished: !video.isPublished });
      triggerRefresh();
      fetchVideos();
    } catch (err: any) {
      addToast('error', `Toggle visibility error: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideo) return;
    setIsDeleting(true);
    try {
      await api.deleteVideo(deletingVideo.id);
      addToast('success', `Video "${deletingVideo.title}" deleted.`);
      setDeletingVideo(null);
      triggerRefresh();
      fetchVideos();
    } catch (err: any) {
      addToast('error', `Delete video error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.title.toLowerCase().includes(term) ||
      (v.description || '').toLowerCase().includes(term) ||
      v.youtubeVideoId.toLowerCase().includes(term)
    );
  });

  const liveId = extractYoutubeId(youtubeLink);

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex items-center justify-between bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Videos Management</h3>
          <p className="text-xs text-[#888888]">YouTube MTV embeds — paste link, publish to the home row</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Video</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 animate-pulse h-56" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <MonitorPlay className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Videos Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Paste a YouTube link to power the MTV row on the home screen. Hosting and bandwidth stay on YouTube.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-[#1c1c1c] border border-[#282828] hover:border-[#3e3e3e] rounded overflow-hidden shadow-sm group transition-all"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={youtubeThumb(video.youtubeVideoId)}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6">
                  <h4 className="text-sm font-bold text-white leading-tight">{video.title}</h4>
                </div>
                {!video.isPublished && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-400 border border-amber-400/30">
                    HIDDEN
                  </span>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#ededed]">
                  {video.durationSeconds > 0 ? formatDuration(video.durationSeconds) : '--:--'} • #{video.order}
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 p-1.5 rounded bg-black/70 text-[#ededed] hover:text-white transition-colors"
                  title="Open on YouTube"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 border-t border-[#282828] w-full flex items-center justify-end gap-2">
                <button
                  onClick={() => handleTogglePublished(video)}
                  className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                  title={video.isPublished ? 'Hide video' : 'Show video'}
                >
                  {video.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(video)}
                  className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                  title="Edit Video"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingVideo(video)}
                  className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete Video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-lg w-full p-6 shadow-2xl relative text-[#ededed] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-[#3ecf8e]" />
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">Required: title + YouTube link • Duration as m:ss (optional)</p>

            {/* Live thumbnail preview from the pasted link */}
            <div className="relative aspect-video rounded overflow-hidden bg-black border border-[#282828] mb-4">
              {liveId ? (
                <img src={youtubeThumb(liveId)} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-[#555555]">
                  <MonitorPlay className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6">
                <p className="text-sm font-bold text-white">{title || 'Title preview'}</p>
                {liveId && <p className="text-[10px] font-mono text-[#3ecf8e]">{liveId}</p>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christmas MTV 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  YouTube Link or Video ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste watch / youtu.be / shorts link, or 11-char ID"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
                {youtubeLink.trim() !== '' && !liveId && (
                  <p className="text-[11px] text-red-400 mt-1 font-mono">No valid video ID found in this link.</p>
                )}
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Shown under the player in the app."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Duration (m:ss)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4:32"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 0)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-[#ededed] font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 accent-[#3ecf8e]"
                    />
                    Published
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#282828] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingVideo)}
        title="Delete Video"
        message={`Are you sure you want to delete video "${deletingVideo?.title}"?`}
        resourceType="video"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingVideo(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
