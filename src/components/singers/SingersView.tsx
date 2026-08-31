import React, { useEffect, useState } from 'react';
import { Singer } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserCheck, Plus, Edit2, Trash2, X, CheckCircle2, User, Music } from 'lucide-react';

interface SingersViewProps {
  searchTerm: string;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const SingersView: React.FC<SingersViewProps> = ({
  searchTerm,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [singers, setSingers] = useState<Singer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSinger, setEditingSinger] = useState<Singer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrlString, setAvatarUrlString] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Delete modal
  const [deletingSinger, setDeletingSinger] = useState<Singer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchSingers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSingers();
      setSingers(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load singers: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSingers();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setEditingSinger(null);
    setName('');
    setDescription('');
    setAvatarUrlString('');
    setAvatarFile(null);
    setPhone('');
    setYoutube('');
    setFacebook('');
    setTiktok('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (singer: Singer) => {
    setEditingSinger(singer);
    setName(singer.name);
    setDescription(singer.description || '');
    setAvatarUrlString(singer.avatarUrl || '');
    setAvatarFile(null);
    setPhone(singer.phone || '');
    setYoutube(singer.socialLinks?.youtube || '');
    setFacebook(singer.socialLinks?.facebook || '');
    setTiktok(singer.socialLinks?.tiktok || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Singer name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bodyData: FormData | Record<string, unknown>;

      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', name.trim());
        if (description) fd.append('description', description.trim());
        if (phone) fd.append('phone', phone.trim());
        if (youtube) fd.append('socialLinks[youtube]', youtube.trim());
        if (facebook) fd.append('socialLinks[facebook]', facebook.trim());
        if (tiktok) fd.append('socialLinks[tiktok]', tiktok.trim());
        fd.append('avatar', avatarFile);
        bodyData = fd;
      } else {
        bodyData = {
          name: name.trim(),
          description: description.trim(),
          avatarUrl: avatarUrlString,
          phone: phone.trim(),
          socialLinks: {
            youtube: youtube.trim(),
            facebook: facebook.trim(),
            tiktok: tiktok.trim(),
          },
        };
      }

      if (editingSinger) {
        await api.updateSinger(editingSinger.id, bodyData);
        addToast('success', `Singer "${name}" updated.`);
      } else {
        await api.createSinger(bodyData);
        addToast('success', `Singer "${name}" added.`);
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchSingers();
    } catch (err: any) {
      addToast('error', `Singer save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSinger) return;
    setIsDeleting(true);
    try {
      await api.deleteSinger(deletingSinger.id);
      addToast('success', `Singer "${deletingSinger.name}" deleted.`);
      setDeletingSinger(null);
      triggerRefresh();
      fetchSingers();
    } catch (err: any) {
      addToast('error', `Delete singer error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSingers = singers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex items-center justify-between bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Singers Management</h3>
          <p className="text-xs text-[#888888]">Solo Rawang vocalists & recording artists</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Singer</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredSingers.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <User className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Singers Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Add solo Rawang singers to associate them with albums and track catalogues.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Singer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSingers.map((singer) => (
            <div
              key={singer.id}
              className="bg-[#1c1c1c] border border-[#282828] hover:border-[#3e3e3e] rounded p-5 shadow-sm flex flex-col items-center text-center justify-between group transition-all"
            >
              <div className="w-full flex flex-col items-center">
                <MediaImage
                  src={singer.avatarUrl}
                  alt={singer.name}
                  type="singer"
                  className="w-20 h-20 rounded-full object-cover mb-3 ring-1 ring-[#282828]"
                />
                <h4 className="text-xs font-bold text-white">{singer.name}</h4>
                <p className="text-xs text-[#888888] mt-1 line-clamp-3">
                  {singer.description || 'No biography provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#282828] w-full flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(singer)}
                  className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                  title="Edit Singer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingSinger(singer)}
                  className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete Singer"
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
              <UserCheck className="w-4 h-4 text-[#3ecf8e]" />
              {editingSinger ? 'Edit Singer' : 'Add New Singer'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">Required: name • Phone & socials power the mobile Owners list</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Singer Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C Dushvr"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Phone</label>
                  <input
                    type="tel"
                    placeholder="+95 9 123 456 789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">Avatar File Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#ededed] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#3ecf8e] file:text-black hover:file:bg-[#34b27b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Or Avatar Object Key String</label>
                <input
                  type="text"
                  placeholder="e.g. singer/avatar.jpg"
                  value={avatarUrlString}
                  onChange={(e) => setAvatarUrlString(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-[#FF0000] text-white grid place-items-center text-[9px]">▶</span> YouTube URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@..."
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-[#1877F2] text-white grid place-items-center font-black text-[11px]">f</span> Facebook URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-black border border-white/10 grid place-items-center"><Music className="w-3 h-3 text-white" /></span> TikTok URL</label>
                  <input
                    type="url"
                    placeholder="https://tiktok.com/@..."
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Description / Bio</label>
                <textarea
                  rows={3}
                  placeholder="Artist biography..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
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
                  Save Singer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingSinger)}
        title="Delete Singer"
        message={`Are you sure you want to delete singer "${deletingSinger?.name}"?`}
        resourceType="singer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSinger(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
