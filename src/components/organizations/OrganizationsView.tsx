import React, { useEffect, useState } from 'react';
import { Organization } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Building2, Plus, Edit2, Trash2, X, CheckCircle2, Music, Phone, ChevronRight } from 'lucide-react';

interface OrganizationsViewProps {
  searchTerm: string;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  searchTerm,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
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
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenCreate();
    }
  }, [isCreateOpen]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOrganizations();
      setOrganizations(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load organizations: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [refreshKey]);

  const handleOpenCreate = () => {
    setEditingOrg(null);
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

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setDescription(org.description || '');
    setAvatarUrlString(org.avatarUrl || '');
    setAvatarFile(null);
    setPhone(org.phone || '');
    setYoutube(org.socialLinks?.youtube || '');
    setFacebook(org.socialLinks?.facebook || '');
    setTiktok(org.socialLinks?.tiktok || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Organization name is required.');
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

      if (editingOrg) {
        await api.updateOrganization(editingOrg.id, bodyData);
        addToast('success', `Organization "${name}" updated.`);
      } else {
        await api.createOrganization(bodyData);
        addToast('success', `Organization "${name}" added.`);
      }

      setIsModalOpen(false);
      if (onCloseCreate) onCloseCreate();
      triggerRefresh();
      fetchOrganizations();
    } catch (err: any) {
      addToast('error', `Organization save error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrg) return;
    setIsDeleting(true);
    try {
      await api.deleteOrganization(deletingOrg.id);
      addToast('success', `Organization "${deletingOrg.name}" deleted.`);
      setDeletingOrg(null);
      triggerRefresh();
      fetchOrganizations();
    } catch (err: any) {
      addToast('error', `Delete organization error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrgs = organizations.filter((o) => {
    const term = searchTerm.toLowerCase();
    return o.name.toLowerCase().includes(term) || (o.description || '').toLowerCase().includes(term) || (o.phone || '').toLowerCase().includes(term);
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex items-center justify-between bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Organizations Directory</h3>
          <p className="text-xs text-[#888888]">Cultural heritage associations & publishing bodies — {organizations.length} total</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Organization</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1c1c1c] border border-[#282828] rounded-xl p-4 animate-pulse h-[92px]" />
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Organizations Found</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Add Rawang cultural heritage associations or record labels.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Organization
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#333333] rounded-xl p-3.5 flex items-center gap-4 group transition-all shadow-sm"
            >
              <div className="shrink-0 rounded-xl" style={{ boxShadow: '0 0 14px rgba(255,193,7,0.35)' }}>
                <MediaImage
                  src={org.avatarUrl}
                  alt={org.name}
                  type="organization"
                  className="w-[62px] h-[62px] rounded-xl object-cover ring-1 ring-white/10"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-white truncate">{org.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 text-[#FFC107]" />
                  <span className="text-[11px] text-white/60">Organization</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px]">
                    <Music className="w-3 h-3 text-[#FFC107]" />
                    <span className="font-bold text-white">{org.albumCount ?? 0}</span>
                    <span className="text-white/50">Albums</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px]">
                    <Music className="w-3 h-3 text-[#FFC107]" />
                    <span className="font-bold text-white">{org.trackCount ?? 0}</span>
                    <span className="text-white/50">Tracks</span>
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  {org.socialLinks?.youtube ? (
                    <a href={org.socialLinks.youtube} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-md bg-[#FF0000] flex items-center justify-center"><span className="text-white text-[10px] font-black">▶</span></a>
                  ) : null}
                  {org.socialLinks?.facebook ? (
                    <a href={org.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-md bg-[#1877F2] flex items-center justify-center text-white font-black text-xs">f</a>
                  ) : null}
                  {org.socialLinks?.tiktok ? (
                    <a href={org.socialLinks.tiktok} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-md bg-black border border-white/10 flex items-center justify-center"><Music className="w-3 h-3 text-white" /></a>
                  ) : null}
                  {!org.socialLinks?.youtube && !org.socialLinks?.facebook && !org.socialLinks?.tiktok ? (
                    <div className="flex gap-1.5 opacity-30">
                      <div className="w-7 h-7 rounded-md bg-[#2a2a2a] flex items-center justify-center"><span className="text-white text-[8px]">▶</span></div>
                      <div className="w-7 h-7 rounded-md bg-[#2a2a2a] flex items-center justify-center text-white text-[10px]">f</div>
                      <div className="w-7 h-7 rounded-md bg-[#2a2a2a] flex items-center justify-center"><Music className="w-3 h-3" /></div>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                  <Phone className="w-3 h-3 text-white/40" />
                  <span>{org.phone || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(org)}
                    className="p-2 rounded-lg bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] transition-colors"
                    title="Edit Organization"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingOrg(org)}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete Organization"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ChevronRight className="w-5 h-5 text-white/25 hidden sm:block" />
                <div className="flex md:hidden gap-1">
                  <button onClick={() => handleOpenEdit(org)} className="p-1.5 rounded bg-[#222] border border-[#333]"><Edit2 className="w-3 h-3" /></button>
                </div>
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
              <Building2 className="w-4 h-4 text-amber-400" />
              {editingOrg ? 'Edit Organization' : 'Add New Organization'}
            </h3>
            <p className="text-[11px] text-[#888888] mb-6 font-mono">Required: name • Phone & socials for mobile Owners list</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rawang Cultural Heritage Association"
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
                    placeholder="+95 9 --- --- ---"
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
                  placeholder="e.g. org/avatar.jpg"
                  value={avatarUrlString}
                  onChange={(e) => setAvatarUrlString(e.target.value)}
                  className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-[#FF0000] text-white grid place-items-center text-[9px]">▶</span> YouTube URL</label>
                  <input type="url" placeholder="https://youtube.com/@..." value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]" />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-[#1877F2] text-white grid place-items-center font-black text-[11px]">f</span> Facebook URL</label>
                  <input type="url" placeholder="https://facebook.com/..." value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]" />
                </div>
                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-black border border-white/10 grid place-items-center"><Music className="w-3 h-3 text-white" /></span> TikTok URL</label>
                  <input type="url" placeholder="https://tiktok.com/@..." value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]" />
                </div>
              </div>

              <div>
                <label className="block text-[#ededed] font-medium mb-1 font-mono">Description</label>
                <textarea
                  rows={3}
                  placeholder="Organization mission & details..."
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletingOrg)}
        title="Delete Organization"
        message={`Are you sure you want to delete organization "${deletingOrg?.name}"?`}
        resourceType="organization"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingOrg(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
