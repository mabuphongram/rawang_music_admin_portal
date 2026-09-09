import React, { useEffect, useState } from 'react';
import { HeroSlide } from '../../types';
import { api, resolveMediaUrl } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Images, Plus, Edit2, Trash2, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface HeroSlidesViewProps {
  searchTerm: string;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const HeroSlidesView: React.FC<HeroSlidesViewProps> = ({
  searchTerm,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [eyebrow, setEyebrow] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrlString, setImageUrlString] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Delete modal
  const [deletingSlide, setDeletingSlide] = useState<HeroSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHeroSlides();
      setSlides(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load hero slides: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [refreshKey]);

  const resetForm = (slide?: HeroSlide | null) => {
    setEyebrow(slide?.eyebrow || '');
    setTitle(slide?.title || '');
    setSubtitle(slide?.subtitle || '');
    setImageUrlString(slide?.imageUrl || '');
    setImageFile(null);
    setDurationSeconds(slide?.durationSeconds ?? 6);
    setOrder(slide?.order ?? 0);
    setIsActive(slide?.isActive ?? true);
  };

  const handleOpenCreate = () => {
    setEditingSlide(null);
    resetForm(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    resetForm(slide);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('warning', 'Slide title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bodyData: FormData | Record<string, unknown>;

      if (imageFile) {
        const fd = new FormData();
        fd.append('title', title.trim());
        if (eyebrow) fd.append('eyebrow', eyebrow.trim());
        if (subtitle) fd.append('subtitle', subtitle.trim());
        fd.append('durationSeconds', String(durationSeconds));
        fd.append('order', String(order));
        fd.append('isActive', String(isActive));
        fd.append('image', imageFile);
        bodyData = fd;
      } else {
        bodyData = {
          title: title.trim(),
          eyebrow: eyebrow.trim(),
          subtitle: subtitle.trim(),
          imageUrl: imageUrlString,
          durationSeconds: Number(durationSeconds),
          order: Number(order),
          isActive: Boolean(isActive),
        };
      }

      if (editingSlide) {
        await api.updateHeroSlide(editingSlide.id, bodyData);
        addToast('success', `Hero slide "${title}" updated.`);
      } else {
        await api.createHeroSlide(bodyData);
        addToast('success', `Hero slide "${title}" added.`);
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchSlides();
    } catch (err: any) {
      addToast('error', `Hero slide save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await api.updateHeroSlide(slide.id, { isActive: !slide.isActive });
      triggerRefresh();
      fetchSlides();
    } catch (err: any) {
      addToast('error', `Toggle visibility error: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSlide) return;
    setIsDeleting(true);
    try {
      await api.deleteHeroSlide(deletingSlide.id);
      addToast('success', `Hero slide "${deletingSlide.title}" deleted.`);
      setDeletingSlide(null);
      triggerRefresh();
      fetchSlides();
    } catch (err: any) {
      addToast('error', `Delete hero slide error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSlides = slides.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      (s.eyebrow || '').toLowerCase().includes(term) ||
      (s.subtitle || '').toLowerCase().includes(term)
    );
  });

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : resolveMediaUrl(imageUrlString);

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex items-center justify-between bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Hero Slides Management</h3>
          <p className="text-xs text-[#888888]">Home 16:9 carousel — photo, 3 texts, display seconds & order</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Slide</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : filteredSlides.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Images className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Hero Slides Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Add 16:9 banners to power the home screen carousel. The app falls back to its bundled image when empty.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSlides.map((slide) => (
            <div
              key={slide.id}
              className="bg-[#1c1c1c] border border-[#282828] hover:border-[#3e3e3e] rounded overflow-hidden shadow-sm group transition-all"
            >
              <div className="relative aspect-video bg-black">
                {slide.imageUrl ? (
                  <MediaImage
                    src={slide.imageUrl}
                    alt={slide.title}
                    type="hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[#555555]">
                    <Images className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-8">
                  {slide.eyebrow && (
                    <p className="text-[10px] font-bold tracking-widest text-[#3ecf8e]">{slide.eyebrow}</p>
                  )}
                  <h4 className="text-sm font-bold text-white">{slide.title}</h4>
                  {slide.subtitle && <p className="text-xs text-[#cccccc]">{slide.subtitle}</p>}
                </div>
                {!slide.isActive && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-400 border border-amber-400/30">
                    HIDDEN
                  </span>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#ededed]">
                  {slide.durationSeconds}s • #{slide.order}
                </span>
              </div>

              <div className="p-3 border-t border-[#282828] w-full flex items-center justify-end gap-2">
                <button
                  onClick={() => handleToggleActive(slide)}
                  className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                  title={slide.isActive ? 'Hide slide' : 'Show slide'}
                >
                  {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(slide)}
                  className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                  title="Edit Slide"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingSlide(slide)}
                  className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete Slide"
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
              onClick={() => {
                setIsModalOpen(false);
                if (onCloseCreate) onCloseCreate();
              }}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <Images className="w-4 h-4 text-[#3ecf8e]" />
              {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">Required: title + 16:9 photo • Texts 1-3 optional • Seconds = autoplay hold</p>

            {/* 16:9 live preview */}
            <div className="relative aspect-video rounded overflow-hidden bg-black border border-[#282828] mb-4">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-[#555555]">
                  <Images className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6">
                {eyebrow && <p className="text-[10px] font-bold tracking-widest text-[#3ecf8e]">{eyebrow}</p>}
                <p className="text-sm font-bold text-white">{title || 'Title preview'}</p>
                {subtitle && <p className="text-xs text-[#cccccc]">{subtitle}</p>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Title (text 2, main) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preserving Our Ancestral Echoes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Eyebrow (text 1, small — optional)</label>
                <input
                  type="text"
                  placeholder="e.g. RAWANG HERITAGE MUSIC"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Subtitle (text 3 — optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stream, download offline, and discover traditional songs."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Photo Upload (16:9 recommended)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#ededed] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#3ecf8e] file:text-black hover:file:bg-[#34b27b]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Or Image Object Key String</label>
                <input
                  type="text"
                  placeholder="e.g. hero-slides/abc/cover.jpg"
                  value={imageUrlString}
                  onChange={(e) => setImageUrlString(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Seconds</label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value) || 6)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
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
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#3ecf8e]"
                    />
                    Active
                  </label>
                </div>
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
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingSlide)}
        title="Delete Hero Slide"
        message={`Are you sure you want to delete hero slide "${deletingSlide?.title}"?`}
        resourceType="hero slide"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSlide(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
