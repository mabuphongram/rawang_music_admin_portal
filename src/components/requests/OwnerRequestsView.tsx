import React, { useEffect, useState } from 'react';
import { OwnerRequest, ApprovedOwnerRequest } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MediaImage } from '../common/MediaImage';
import { ClipboardList, CheckCircle2, Trash2, X, ExternalLink, Copy, Check, UserPlus } from 'lucide-react';

interface OwnerRequestsViewProps {
  searchTerm: string;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | '';

export const OwnerRequestsView: React.FC<OwnerRequestsViewProps> = ({ searchTerm }) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();

  const [items, setItems] = useState<OwnerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);

  const [approving, setApproving] = useState<OwnerRequest | null>(null);
  const [rejecting, setRejecting] = useState<OwnerRequest | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Credentials returned by approve — copy + hand over via social app.
  const [credentials, setCredentials] = useState<ApprovedOwnerRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      setItems((await api.getOwnerRequests(statusFilter || undefined)) || []);
    } catch (err: any) {
      addToast('error', `Failed to load requests: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, refreshKey]);

  const handleApprove = async () => {
    if (!approving) return;
    setIsSaving(true);
    try {
      const result = await api.approveOwnerRequest(approving.id);
      setCredentials(result);
      setApproving(null);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Approve error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setIsSaving(true);
    try {
      await api.rejectOwnerRequest(rejecting.id);
      addToast('success', 'Request rejected.');
      setRejecting(null);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Reject error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = credentials.linkedExisting || !credentials.credentials
      ? `Rawang Music: profile "${credentials.profile.name}" linked to existing login ${credentials.request.requesterPhone}. No new password — they sign in as usual.`
      : `Rawang Music login\nPhone: ${credentials.credentials.phone}\nTemp password: ${credentials.credentials.tempPassword}\n(Please change it after first login)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('warning', 'Copy failed — select the text manually.');
    }
  };

  const filtered = items.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.requesterName.toLowerCase().includes(term) ||
      r.requesterPhone.includes(term) ||
      r.ownerModel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white">Owner Requests</h3>
          <p className="text-xs text-[#888888]">Artist onboarding — review proof videos, create account + profile, hand over login via social app</p>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#666666]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#141414] rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <UserPlus className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Requests</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            New artist registrations from the app appear here with their proof videos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-[#1c1c1c] border border-[#282828] rounded p-5 space-y-3">
              <div className="flex items-start gap-3">
                <MediaImage
                  src={r.avatarUrl}
                  alt={r.name}
                  type={r.ownerModel === 'Singer' ? 'singer' : 'organization'}
                  className="w-14 h-14 rounded-full object-cover shrink-0 ring-1 ring-[#282828]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{r.name}</h4>
                  <p className="text-[11px] font-mono text-[#3ecf8e]">{r.ownerModel}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                    r.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : r.status === 'approved'
                      ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/20 text-[#3ecf8e]'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {r.status.toUpperCase()}
                </span>
              </div>

              {r.description && <p className="text-xs text-[#888888]">{r.description}</p>}

              <div className="text-xs text-[#ededed] space-y-1">
                <div>
                  Contact: <span className="font-mono">{r.requesterName} • {r.requesterPhone}</span>
                </div>
                {r.phone && <div className="text-[#888888]">Profile phone: <span className="font-mono">{r.phone}</span></div>}
              </div>

              <div>
                <p className="text-[11px] font-mono text-[#888888] mb-1.5">
                  Proof videos ({r.videoLinks.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {r.videoLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-mono text-[#3ecf8e] hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#666666]">
                {new Date(r.createdAt).toLocaleString()}
              </div>

              {r.status === 'pending' && (
                <div className="pt-3 border-t border-[#282828] flex items-center justify-end gap-2">
                  <button
                    onClick={() => setApproving(r)}
                    className="px-3 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Review & Approve</span>
                  </button>
                  <button
                    onClick={() => setRejecting(r)}
                    className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Reject request"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* APPROVE CONFIRM */}
      <ConfirmDialog
        isOpen={Boolean(approving)}
        title="Approve Request"
        message={`Create artist login + ${approving?.ownerModel} profile for "${approving?.name}"? The account signs in with phone ${approving?.requesterPhone} and a generated temp password (shown next — deliver it via social app).`}
        resourceType="owner request"
        tone="green"
        note="Creates the user (artist role), the profile with proof videos, and the earnings linkage in one step."
        onConfirm={handleApprove}
        onCancel={() => setApproving(null)}
        isLoading={isSaving}
      />

      {/* REJECT CONFIRM */}
      <ConfirmDialog
        isOpen={Boolean(rejecting)}
        title="Reject Request"
        message={`Reject the request from "${rejecting?.requesterName}" (${rejecting?.name})?`}
        resourceType="owner request"
        confirmText="Confirm Reject"
        note="The request stays in history as rejected. Nothing is deleted."
        onConfirm={handleReject}
        onCancel={() => setRejecting(null)}
        isLoading={isSaving}
      />

      {/* CREDENTIALS — copy + deliver via social app */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1c] border border-[#3ecf8e]/30 rounded max-w-md w-full p-6 shadow-2xl relative text-[#ededed]">
            <button
              onClick={() => setCredentials(null)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
              {credentials.linkedExisting ? 'Existing login linked' : 'Account created'}
            </h3>
            <p className="text-[11px] text-[#888888] mt-1 mb-4">
              {credentials.linkedExisting
                ? 'Phone was already registered — profile linked to that login, password unchanged. Just notify them.'
                : 'Send these credentials to the owner via social app. They must change the password on first login.'}
            </p>
            <div className="bg-[#141414] border border-[#282828] rounded p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#888888]">Phone</span>
                <span className="text-white font-bold">{credentials.request.requesterPhone}</span>
              </div>
              {!credentials.linkedExisting && credentials.credentials && (
                <div className="flex justify-between">
                  <span className="text-[#888888]">Temp password</span>
                  <span className="text-[#3ecf8e] font-bold">{credentials.credentials.tempPassword}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#888888]">Profile</span>
                <span className="text-white">{credentials.profile.name}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setCredentials(null)}
                className="px-4 py-2 rounded text-[#ededed] bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] transition-colors text-xs"
              >
                Close
              </button>
              <button
                onClick={copyCredentials}
                className="px-4 py-2 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold flex items-center gap-2 text-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
