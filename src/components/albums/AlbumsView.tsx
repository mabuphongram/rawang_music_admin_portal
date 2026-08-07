import React, { useEffect, useState } from 'react';
import { Album, OwnerType, OwnerModel, Singer, Organization } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Disc,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  Upload,
  Calendar,
  User,
  Building2,
  FileText,
  Music,
  CheckCircle2,
} from 'lucide-react';

interface AlbumsViewProps {
  searchTerm: string;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  onSelectAlbumForTracks?: (albumId: string) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  searchTerm,
  isCreateOpen = false,
  onCloseCreate,
  onSelectAlbumForTracks,
}) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [ownerType, setOwnerType] = useState<OwnerType>('singer');
  const [ownerName, setOwnerName] = useState('');
  const [ownerModel, setOwnerModel] = useState<OwnerModel>('Singer');
  const [ownerId, setOwnerId] = useState('');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [coverResName, setCoverResName] = useState('');
  const [coverImageString, setCoverImageString] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Delete modal
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle opening create externally
  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const typeParam = ownerFilter === 'all' ? undefined : ownerFilter;
      const data = await api.getAlbums(typeParam);
      setAlbums(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load albums: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const [s, o] = await Promise.all([api.getSingers(), api.getOrganizations()]);
      setSingers(s || []);
      setOrganizations(o || []);
    } catch {
      // Ignore background owner fetch error
    }
  };

  useEffect(() => {
    fetchAlbums();
    fetchOwners();
  }, [ownerFilter, refreshKey]);

  const handleOpenCreate = () => {
    setEditingAlbum(null);
    setTitle('');
    setOwnerType('singer');
    setOwnerName('');
    setOwnerModel('Singer');
    setOwnerId('');
    setReleaseYear(new Date().getFullYear());
    setDescription('');
    setCoverResName('');
    setCoverImageString('');
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (album: Album) => {
    setEditingAlbum(album);
    setTitle(album.title);
    setOwnerType(album.ownerType);
    setOwnerName(album.ownerName);
    setOwnerModel(album.ownerModel || (album.ownerType === 'singer' ? 'Singer' : 'Organization'));
    setOwnerId(album.ownerId || '');
    setReleaseYear(album.releaseYear || new Date().getFullYear());
    setDescription(album.description || '');
    setCoverResName(album.coverResName || '');
    setCoverImageString(album.coverImage || '');
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleOwnerSelection = (id: string, type: 'singer' | 'organization') => {
    setOwnerId(id);
    if (type === 'singer') {
      const s = singers.find((item) => item.id === id);
      if (s) {
        setOwnerName(s.name);
        setOwnerModel('Singer');
      }
    } else {
      const o = organizations.find((item) => item.id === id);
      if (o) {
        setOwnerName(o.name);
        setOwnerModel('Organization');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ownerName.trim()) {
      addToast('warning', 'Please complete title and owner name fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bodyData: FormData | Record<string, unknown>;

      if (coverFile) {
        const fd = new FormData();
        fd.append('title', title.trim());
        fd.append('ownerType', ownerType);
        fd.append('ownerName', ownerName.trim());
        fd.append('releaseYear', String(releaseYear));
        if (ownerModel) fd.append('ownerModel', ownerModel);
        if (ownerId) fd.append('ownerId', ownerId);
        if (coverResName) fd.append('coverResName', coverResName);
        if (description) fd.append('description', description.trim());
        fd.append('coverImage', coverFile);
        bodyData = fd;
      } else {
        bodyData = {
          title: title.trim(),
          ownerType,
          ownerName: ownerName.trim(),
          ownerModel,
          ownerId,
          releaseYear: Number(releaseYear),
          coverResName,
          coverImage: coverImageString,
          description: description.trim(),
        };
      }

      if (editingAlbum) {
        await api.updateAlbum(editingAlbum.id, bodyData);
        addToast('success', `Album "${title}" updated successfully.`);
      } else {
        await api.createAlbum(bodyData);
        addToast('success', `New album "${title}" created.`);
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchAlbums();
    } catch (err: any) {
      addToast('error', `Album save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAlbum) return;
    setIsDeleting(true);
    try {
      await api.deleteAlbum(deletingAlbum.id);
      addToast('success', `Album "${deletingAlbum.title}" deleted.`);
      setDeletingAlbum(null);
      triggerRefresh();
      fetchAlbums();
    } catch (err: any) {
      addToast('error', `Delete album failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter by search
  const filteredAlbums = albums.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(term) ||
      a.ownerName.toLowerCase().includes(term) ||
      (a.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Top Filter & Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#666666]" />
          <span className="text-xs font-mono font-bold text-[#888888] uppercase">Owner Type:</span>
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded border border-[#282828] text-xs">
            {['all', 'singer', 'organization', 'anonymous'].map((type) => (
              <button
                key={type}
                onClick={() => setOwnerFilter(type)}
                className={`px-3 py-1 rounded font-mono text-xs capitalize transition-colors ${
                  ownerFilter === type
                    ? 'bg-[#3ecf8e] text-black font-bold shadow-sm'
                    : 'text-[#888888] hover:text-[#ededed]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Album</span>
        </button>
      </div>

      {/* Albums Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Disc className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Albums Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {searchTerm || ownerFilter !== 'all'
              ? 'No albums match your current filter or search criteria.'
              : 'Start building the catalogue by adding your first Rawang music album.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="bg-[#1c1c1c] border border-[#282828] hover:border-[#3e3e3e] rounded p-4 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="relative aspect-square rounded overflow-hidden mb-3 bg-[#141414] border border-[#282828]">
                  <MediaImage
                    src={album.coverImage}
                    alt={album.title}
                    type="album"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-[#121212]/90 backdrop-blur-md px-2 py-0.5 rounded border border-[#282828] text-[10px] font-mono text-[#3ecf8e]">
                    {album.releaseYear}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white truncate mb-1" title={album.title}>
                  {album.title}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-[#888888] mb-2 font-mono">
                  {album.ownerType === 'singer' ? (
                    <User className="w-3 h-3 text-[#3ecf8e]" />
                  ) : album.ownerType === 'organization' ? (
                    <Building2 className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Disc className="w-3 h-3 text-[#666666]" />
                  )}
                  <span className="truncate">{album.ownerName}</span>
                </div>

                <p className="text-xs text-[#666666] line-clamp-2 min-h-[32px]">
                  {album.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#282828] flex items-center justify-between">
                <button
                  onClick={() => onSelectAlbumForTracks && onSelectAlbumForTracks(album.id)}
                  className="text-xs text-[#3ecf8e] hover:underline font-mono flex items-center gap-1"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{album.trackCount || 0} Tracks</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(album)}
                    className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                    title="Edit Album"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingAlbum(album)}
                    className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete Album"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ALBUM MODAL */}
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
              <Disc className="w-4 h-4 text-[#3ecf8e]" />
              {editingAlbum ? 'Edit Album' : 'Create New Album'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">
              Schema contract: title, ownerType, ownerName, releaseYear, coverImage, description
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Album Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Voice of Rawang Valleys"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              {/* Owner Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Owner Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={ownerType}
                    onChange={(e) => {
                      const type = e.target.value as OwnerType;
                      setOwnerType(type);
                      setOwnerModel(type === 'singer' ? 'Singer' : 'Organization');
                      setOwnerId('');
                      if (type === 'anonymous') setOwnerName('Anonymous');
                    }}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  >
                    <option value="singer">Singer</option>
                    <option value="organization">Organization</option>
                    <option value="anonymous">Anonymous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Release Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              {/* Owner Selection Dropdown */}
              {ownerType === 'singer' && singers.length > 0 ? (
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Select Singer
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => handleOwnerSelection(e.target.value, 'singer')}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e] mb-2"
                  >
                    <option value="">-- Choose Existing Singer --</option>
                    {singers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : ownerType === 'organization' && organizations.length > 0 ? (
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Select Organization
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => handleOwnerSelection(e.target.value, 'organization')}
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e] mb-2"
                  >
                    <option value="">-- Choose Existing Organization --</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Owner Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khar Lu"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Album Cover File Upload (Multer / MinIO)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#ededed] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#3ecf8e] file:text-black hover:file:bg-[#34b27b]"
                />
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Or Cover MinIO Object Key / URL String
                </label>
                <input
                  type="text"
                  placeholder="e.g. albums/albumId/cover.jpg"
                  value={coverImageString}
                  onChange={(e) => setCoverImageString(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Description</label>
                <textarea
                  rows={3}
                  placeholder="Album background and musical details..."
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
                  Save Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingAlbum)}
        title="Delete Album"
        message={`Are you sure you want to delete the album "${deletingAlbum?.title}"?`}
        resourceType="album"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAlbum(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
