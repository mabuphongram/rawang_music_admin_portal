import React, { useEffect, useMemo, useState } from 'react';
import { Track, Singer, Organization } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { Link2, Unlink, Plus, Search, Music, Clock } from 'lucide-react';

interface OwnershipViewProps {
  searchTerm: string;
}

interface OwnerOption {
  model: 'Singer' | 'Organization';
  id: string;
  name: string;
}

function formatDuration(total: number) {
  const m = Math.floor((total || 0) / 60);
  const s = (total || 0) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Manual per-track earnings attribution. One track = exactly one owner
// (or none = platform share). Album membership is untouched — this only
// decides whose earnings a play counts toward, going forward.
export const OwnershipView: React.FC<OwnershipViewProps> = ({ searchTerm }) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [attachSearch, setAttachSearch] = useState('');
  const [unownedOnly, setUnownedOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, sData, oData] = await Promise.all([
        api.getTracks(),
        api.getSingers(),
        api.getOrganizations(),
      ]);
      setTracks(tData || []);
      setSingers(sData || []);
      setOrganizations(oData || []);
    } catch (err: any) {
      addToast('error', `Failed to load ownership data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const ownerOptions: OwnerOption[] = useMemo(
    () => [
      ...singers.map((s) => ({ model: 'Singer' as const, id: s.id, name: s.name })),
      ...organizations.map((o) => ({ model: 'Organization' as const, id: o.id, name: o.name })),
    ],
    [singers, organizations]
  );

  const selected: OwnerOption | null =
    ownerOptions.find((o) => `${o.model}:${o.id}` === selectedKey) || null;

  const ownedTracks = useMemo(() => {
    if (!selected) return [];
    const term = searchTerm.toLowerCase();
    return tracks.filter(
      (t) =>
        t.ownerId === selected.id &&
        (t.title.toLowerCase().includes(term) ||
          t.artistName.toLowerCase().includes(term) ||
          t.albumName.toLowerCase().includes(term))
    );
  }, [tracks, selected, searchTerm]);

  const attachCandidates = useMemo(() => {
    if (!selected) return [];
    const term = attachSearch.toLowerCase();
    return tracks
      .filter((t) => {
        if (t.ownerId === selected.id) return false;
        if (unownedOnly && t.ownerId) return false;
        return (
          t.title.toLowerCase().includes(term) ||
          t.artistName.toLowerCase().includes(term) ||
          t.albumName.toLowerCase().includes(term)
        );
      })
      .slice(0, 50);
  }, [tracks, selected, attachSearch, unownedOnly]);

  const unownedCount = useMemo(() => tracks.filter((t) => !t.ownerId).length, [tracks]);

  const attach = async (track: Track) => {
    if (!selected || isSaving) return;
    setIsSaving(track.id);
    try {
      await api.updateTrack(track.id, { ownerId: selected.id, ownerModel: selected.model });
      addToast('success', `"${track.title}" now earns for ${selected.name}.`);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Attach error: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  const detach = async (track: Track) => {
    if (isSaving) return;
    setIsSaving(track.id);
    try {
      await api.updateTrack(track.id, { ownerId: null, ownerModel: null });
      addToast('success', `"${track.title}" detached — its plays go to platform share.`);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Detach error: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Track Ownership</h3>
          <p className="text-xs text-[#888888]">
            One owner per track for earnings — applies going forward, past months stay frozen.
            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px]">
              {unownedCount} unowned (platform share)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#666666]" />
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e] max-w-[260px]"
          >
            <option value="">-- Choose owner --</option>
            <optgroup label="Singers">
              {singers.map((s) => (
                <option key={`Singer:${s.id}`} value={`Singer:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Organizations">
              {organizations.map((o) => (
                <option key={`Organization:${o.id}`} value={`Organization:${o.id}`}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#141414] rounded" />
          ))}
        </div>
      ) : !selected ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Link2 className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">Select an owner</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Pick a singer or organization to see their earning tracks, attach more, or detach.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Owned tracks */}
          <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden">
            <h3 className="text-xs font-mono font-bold text-white p-4 pb-0">
              Earning for {selected.name} ({ownedTracks.length})
            </h3>
            {ownedTracks.length === 0 ? (
              <p className="p-4 text-xs text-[#666666]">No tracks attributed yet — attach from the right.</p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs text-[#ededed]">
                  <tbody className="divide-y divide-[#282828]">
                    {ownedTracks.map((t) => (
                      <tr key={t.id} className="hover:bg-[#222222] transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-white">{t.title}</div>
                          <div className="text-[11px] text-[#666666] font-mono">
                            {t.artistName} • {t.albumName} • {formatDuration(t.durationSeconds)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => detach(t)}
                            disabled={isSaving === t.id}
                            className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Detach (plays go to platform share)"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attach picker */}
          <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden">
            <div className="p-4 pb-0 space-y-2">
              <h3 className="text-xs font-mono font-bold text-white">Attach tracks</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#666]" />
                <input
                  value={attachSearch}
                  onChange={(e) => setAttachSearch(e.target.value)}
                  placeholder="Search title / artist / album..."
                  className="w-full pl-8 pr-3 py-2 bg-[#141414] border border-[#282828] rounded text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] font-mono text-[#888] cursor-pointer">
                <input
                  type="checkbox"
                  checked={unownedOnly}
                  onChange={(e) => setUnownedOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#3ecf8e]"
                />
                Unowned tracks only
              </label>
            </div>
            {attachCandidates.length === 0 ? (
              <p className="p-4 text-xs text-[#666666] flex items-center gap-2">
                <Music className="w-4 h-4" /> No matching tracks.
              </p>
            ) : (
              <div className="overflow-x-auto mt-2 max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs text-[#ededed]">
                  <tbody className="divide-y divide-[#282828]">
                    {attachCandidates.map((t) => (
                      <tr key={t.id} className="hover:bg-[#222222] transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-white">{t.title}</div>
                          <div className="text-[11px] text-[#666666] font-mono">
                            {t.artistName} • {t.albumName} • {formatDuration(t.durationSeconds)}
                            {t.ownerId && <span className="ml-1.5 text-amber-400">(owned elsewhere)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => attach(t)}
                            disabled={isSaving === t.id}
                            className="p-1.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] hover:bg-[#3ecf8e]/20 transition-colors disabled:opacity-50"
                            title={`Attribute to ${selected.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="p-3 text-[10px] font-mono text-[#666666] border-t border-[#282828]">
              <Clock className="w-3 h-3 inline mr-1" />
              Switching owners re-points future plays only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
