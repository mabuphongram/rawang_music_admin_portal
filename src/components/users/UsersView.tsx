import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { Users, Search, Phone, Mail, ShoppingBag, RefreshCw, Trash2, KeyRound, X, CheckCircle2, Edit2 } from 'lucide-react';

interface UsersViewProps { searchTerm: string; }

export const UsersView: React.FC<UsersViewProps> = ({ searchTerm }) => {
  const { addToast, triggerRefresh, refreshKey } = useBackend();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');

  // Edit user modal
  const [editing, setEditing] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'artist' | 'admin'>('user');
  const [isEditSaving, setIsEditSaving] = useState(false);

  const combinedSearch = (searchTerm || localSearch).toLowerCase();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers(combinedSearch || undefined);
      setUsers(data || []);
    } catch (e: any) {
      addToast('error', `Load users failed: ${e.message}`);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [refreshKey]);
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [combinedSearch]);

  const handleReset = async (u: User) => {
    try {
      const res = await api.resetUserPassword(u.id);
      addToast('success', `Temp password for ${u.phone}: ${res.tempPassword} - tell via Viber/phone`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.name} (${u.phone})?`)) return;
    try { await api.deleteUser(u.id); addToast('success', 'User deleted'); fetchUsers(); triggerRefresh(); } catch (e: any) { addToast('error', e.message); }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setEditName(u.name);
    setEditPhone(u.phone);
    setEditEmail(u.email || '');
    setEditRole(u.role);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    if (!editName.trim() || !editPhone.trim()) {
      addToast('warning', 'Name and phone are required.');
      return;
    }
    setIsEditSaving(true);
    try {
      await api.updateUser(editing.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() ? editEmail.trim() : null,
        role: editRole,
      });
      addToast('success', `${editName.trim()} updated.`);
      setEditing(null);
      triggerRefresh();
      fetchUsers();
    } catch (e: any) { addToast('error', e.message); } finally { setIsEditSaving(false); }
  };

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="bg-[#1c1c1c] border border-[#282828] p-4 rounded flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-[#3ecf8e]" /> Users & Album Access <span className="px-2 py-0.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[10px]">one-time purchases</span></h3>
          <p className="text-xs text-[#888888] mt-1">Permanent premium album ownership is granted through the Album Payments review queue.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#666]" />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search phone / name" className="pl-8 pr-3 py-2 bg-[#141414] border border-[#282828] rounded text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#3ecf8e] w-52" />
          </div>
          <button onClick={() => fetchUsers()} className="p-2 rounded bg-[#222] border border-[#333] text-[#3ecf8e] hover:bg-[#2a2a2a]"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3"><div className="text-[11px] font-mono text-[#888] uppercase">Total Users</div><div className="text-xl font-mono font-bold text-white">{users.length}</div><div className="text-[10px] text-[#3ecf8e]">Registered accounts</div></div>
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3"><div className="text-[11px] font-mono text-[#888] uppercase">Album Buyers</div><div className="text-xl font-mono font-bold text-white">{users.filter((u) => (u.purchasedAlbumIds?.length || 0) > 0).length}</div><div className="text-[10px] text-[#666]">At least one purchase</div></div>
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3"><div className="text-[11px] font-mono text-[#888] uppercase">Albums Owned</div><div className="text-xl font-mono font-bold text-white">{users.reduce((sum, u) => sum + (u.purchasedAlbumIds?.length || 0), 0)}</div><div className="text-[10px] text-[#888]">Permanent entitlements</div></div>
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3"><div className="text-[11px] font-mono text-[#888] uppercase">Artists</div><div className="text-xl font-mono font-bold text-white">{users.filter((u) => u.role === 'artist').length}</div><div className="text-[10px] text-purple-400">Revenue share</div></div>
      </div>

      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-8 text-center text-xs text-[#666] animate-pulse">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center space-y-3"><Users className="w-12 h-12 mx-auto text-[#444]" /><h3 className="text-sm font-mono font-bold text-white">No users yet</h3><p className="text-xs text-[#666]">Flutter registrations will appear here via POST /api/auth/register</p></div>
      ) : (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#141414] text-[#888] font-mono text-[11px] uppercase border-b border-[#282828]">
                <tr><th className="px-3 py-2 text-left">User</th><th className="px-3 py-2 text-left">Phone</th><th className="px-3 py-2 text-left">Owned Albums</th><th className="px-3 py-2 text-left">Last Pay</th><th className="px-3 py-2 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center text-[#3ecf8e] font-bold text-[11px]">{u.name.charAt(0).toUpperCase()}</div><div><div className="font-bold text-white text-xs">{u.name} {u.role === 'artist' && <span className="px-1 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px]">ARTIST</span>}{u.mustChangePassword && <span className="ml-1 px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px]">TEMP PW</span>}</div><div className="text-[11px] text-[#666] flex items-center gap-1"><Mail className="w-3 h-3" />{u.email || '-'}</div></div></div></td>
                    <td className="px-3 py-2 font-mono text-white flex items-center gap-1 mt-2"><Phone className="w-3 h-3 text-[#3ecf8e]" />{u.phone}</td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded border text-[11px] font-mono font-bold bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20"><ShoppingBag className="w-3 h-3 inline mr-1" />{u.purchasedAlbumIds?.length || 0}</span></td>
                    <td className="px-3 py-2 font-mono text-[#888]">{u.lastPaymentAt ? `${new Date(u.lastPaymentAt).toLocaleDateString()}  -  ${u.lastPaymentAmount || 0} MMK` : '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} title="Edit user" className="p-1.5 rounded bg-[#222] border border-[#333] text-[#ededed] hover:bg-[#2a2a2a]"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleReset(u)} title="Reset password" className="p-1.5 rounded bg-[#222] border border-[#333] text-[#888] hover:text-white"><KeyRound className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(u)} title="Delete" className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-[#888] hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-[#3ecf8e]" /> Edit User</h3>
            <p className="text-xs text-[#888] mt-1">{editing.phone}  -  ID ...{editing.id.slice(-6)}</p>
            <div className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-mono font-bold text-white mb-1">Name *</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-white focus:outline-none focus:border-[#3ecf8e]" />
              </div>
              <div>
                <label className="block font-mono font-bold text-white mb-1">Phone *</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#3ecf8e]" />
              </div>
              <div>
                <label className="block font-mono font-bold text-white mb-1">Email (optional)</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="-" className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#3ecf8e]" />
              </div>
              <div>
                <label className="block font-mono font-bold text-white mb-1">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as any)} className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-white focus:outline-none focus:border-[#3ecf8e]">
                  <option value="user">user (listener)</option>
                  <option value="artist">artist (merchant)</option>
                  <option value="admin">admin (full access)</option>
                </select>
              </div>
              <div className="pt-3 border-t border-[#282828] flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded bg-[#222] border border-[#333] text-white">Cancel</button>
                <button onClick={handleEditSave} disabled={isEditSaving} className="px-4 py-2 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold flex items-center gap-2 disabled:opacity-50">{isEditSaving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



