import React, { useEffect, useState } from 'react';
import { AlbumPurchase, User } from '../../types';
import { api, resolveMediaUrl } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Inbox,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

interface PaymentsViewProps {
  searchTerm: string;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | '';

function purchaseUser(item: AlbumPurchase): User | null {
  return item.userId && typeof item.userId === 'object' ? item.userId : null;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function startOfDayIso(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function endOfDayIso(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ searchTerm }) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();
  const [items, setItems] = useState<AlbumPurchase[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reviewing, setReviewing] = useState<AlbumPurchase | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);
  const [deleting, setDeleting] = useState<AlbumPurchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlbumPurchases(
        statusFilter || undefined,
        startOfDayIso(dateFrom),
        endOfDayIso(dateTo)
      );
      setItems(data || []);
    } catch (err: any) {
      addToast('error', `Failed to load album payments: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invalidRange) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [statusFilter, dateFrom, dateTo, refreshKey]);

  const filtered = items.filter((item) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const user = purchaseUser(item);
    return (
      item.albumTitle.toLowerCase().includes(term) ||
      (user?.name || '').toLowerCase().includes(term) ||
      (user?.phone || '').toLowerCase().includes(term) ||
      (user?.email || '').toLowerCase().includes(term)
    );
  });

  const openReview = (item: AlbumPurchase) => {
    setReviewing(item);
    setReviewNote(item.reviewNote || '');
    setIsConfirmingRevert(false);
  };

  const closeReview = () => {
    if (isSubmitting) return;
    setReviewing(null);
    setReviewNote('');
    setIsConfirmingRevert(false);
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setIsSubmitting(true);
    try {
      await api.approveAlbumPurchase(reviewing.id, reviewNote.trim());
      addToast(
        'success',
        `Approved "${reviewing.albumTitle}" for ${purchaseUser(reviewing)?.name || 'the user'}.`
      );
      setReviewing(null);
      setReviewNote('');
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Approval failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewing) return;
    if (!reviewNote.trim()) {
      addToast('warning', 'Add a reason so the user knows why the payment was rejected.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.rejectAlbumPurchase(reviewing.id, reviewNote.trim());
      addToast('success', `Rejected payment for "${reviewing.albumTitle}".`);
      setReviewing(null);
      setReviewNote('');
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Rejection failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async () => {
    if (!reviewing) return;
    setIsSubmitting(true);
    try {
      await api.revertAlbumPurchase(reviewing.id);
      addToast(
        'success',
        `Reverted "${reviewing.albumTitle}" to pending. The album is locked again for ${
          purchaseUser(reviewing)?.name || 'the user'
        }.`
      );
      setIsConfirmingRevert(false);
      setReviewing(null);
      setReviewNote('');
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Revert failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOne = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const result = await api.deleteAlbumPurchase(deleting.id);
      addToast(
        'success',
        `Permanently deleted the ${deleting.status} record for "${deleting.albumTitle}".`
      );
      if (!result.screenshotRemoved) {
        addToast('warning', 'The record was deleted, but its screenshot could not be removed.');
      }
      if (reviewing?.id === deleting.id) {
        setReviewing(null);
        setReviewNote('');
      }
      setDeleting(null);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteShown = async () => {
    if (!filtered.length) return;
    setIsDeleting(true);
    try {
      const result = await api.deleteAlbumPurchaseHistory(
        filtered.map((item) => item.id)
      );
      addToast('success', `Permanently deleted ${result.deletedCount} payment records.`);
      if (result.skippedCount > 0) {
        addToast(
          'warning',
          `${result.skippedCount} record(s) were skipped because they are not approved or rejected history.`
        );
      }
      if (result.screenshotCleanupFailures > 0) {
        addToast(
          'warning',
          `${result.screenshotCleanupFailures} screenshot(s) could not be removed from storage.`
        );
      }
      setIsConfirmingBulkDelete(false);
      triggerRefresh();
      fetchData();
    } catch (err: any) {
      addToast('error', `Bulk delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteHistory =
    (statusFilter === 'approved' || statusFilter === 'rejected') &&
    filtered.length > 0 &&
    !invalidRange;

  const dateRangeLabel =
    dateFrom || dateTo
      ? ` (${dateFrom || 'start'} to ${dateTo || 'today'}, by submission date)`
      : ' (all submission dates)';

  const pendingCount = items.filter((item) => item.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#3ecf8e]" />
            Premium Album Payments
          </h3>
          <p className="text-xs text-[#888888] mt-1">
            Verify payment screenshots and grant permanent access to the requested album.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter === 'pending' && (
            <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pendingCount} waiting
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#282828] rounded px-2 py-1">
            <CalendarRange className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Submitted from date"
              title="Submitted from"
              style={{ colorScheme: 'dark' }}
              className="bg-transparent text-[11px] text-[#ededed] focus:outline-none"
            />
            <span className="text-[10px] text-[#666666]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Submitted to date"
              title="Submitted to"
              style={{ colorScheme: 'dark' }}
              className="bg-transparent text-[11px] text-[#ededed] focus:outline-none"
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="p-0.5 text-[#888888] hover:text-white"
                title="Clear date range"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved history</option>
            <option value="rejected">Rejected</option>
            <option value="">All payments</option>
          </select>
          {canDeleteHistory && (
            <button
              type="button"
              onClick={() => setIsConfirmingBulkDelete(true)}
              className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-mono font-bold flex items-center gap-1.5"
              title={`Delete shown ${statusFilter} records`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete shown ({filtered.length})
            </button>
          )}
        </div>
      </div>

      {invalidRange && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300 font-mono">
          The From date must be before the To date.
        </div>
      )}

      {isLoading ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-[#141414] rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center text-[#888888] space-y-3">
          <Inbox className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white">No Payments</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {searchTerm
              ? 'No album payments match your search.'
              : `No ${statusFilter || ''} album payment requests yet.`}
          </p>
        </div>
      ) : (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#ededed]">
              <thead className="bg-[#171717] border-b border-[#282828] text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Proof</th>
                  <th className="px-4 py-3">Album</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {filtered.map((item) => {
                  const user = purchaseUser(item);
                  const proofUrl = resolveMediaUrl(item.screenshotUrl);
                  return (
                    <tr key={item.id} className="hover:bg-[#222222] transition-colors">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => proofUrl && window.open(proofUrl, '_blank')}
                          className="w-14 h-14 rounded bg-[#141414] border border-[#282828] overflow-hidden flex items-center justify-center hover:border-[#3ecf8e]/60 transition-colors"
                          title="Open payment screenshot"
                        >
                          {proofUrl ? (
                            <img
                              src={proofUrl}
                              alt={`Payment proof for ${item.albumTitle}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CreditCard className="w-5 h-5 text-[#555555]" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-white">{item.albumTitle}</div>
                        <div className="text-[10px] font-mono text-[#666666]">
                          {item.albumId}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{user?.name || 'Unknown user'}</div>
                        <div className="text-[10px] font-mono text-[#888888]">
                          {user?.phone || user?.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-amber-300">
                        {Number(item.amount || 0).toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#888888]">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-1 rounded border text-[10px] font-mono font-bold uppercase ${
                            item.status === 'approved'
                              ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#3ecf8e]'
                              : item.status === 'rejected'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          {proofUrl && (
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed]"
                              title="Open screenshot"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openReview(item)}
                            className="px-2.5 py-1.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] hover:bg-[#3ecf8e]/20 font-mono font-bold text-[10px]"
                          >
                            {item.status === 'pending' ? 'Review' : 'Details'}
                          </button>
                          {item.status !== 'pending' && (
                            <button
                              onClick={() => setDeleting(item)}
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                              title="Permanently delete this record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded max-w-3xl w-full p-6 shadow-2xl relative text-[#ededed] max-h-[92vh] overflow-y-auto">
            <button
              onClick={closeReview}
              className="absolute top-4 right-4 text-[#888888] hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3ecf8e]" />
              Payment Review
            </h3>
            <p className="text-[11px] text-[#888888] mb-5 font-mono">
              Verify the screenshot before granting permanent album access.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="rounded bg-[#141414] border border-[#282828] p-3">
                  <div className="text-[10px] font-mono uppercase text-[#666666]">Album</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {reviewing.albumTitle}
                  </div>
                  <div className="text-xs font-mono text-amber-300 mt-1">
                    {Number(reviewing.amount || 0).toLocaleString()} MMK one-time
                  </div>
                </div>

                <div className="rounded bg-[#141414] border border-[#282828] p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#666666]">User</div>
                  <div className="text-sm font-bold text-white">
                    {purchaseUser(reviewing)?.name || 'Unknown user'}
                  </div>
                  <div className="text-xs font-mono text-[#888888]">
                    {purchaseUser(reviewing)?.phone || '-'}
                  </div>
                  <div className="text-xs text-[#888888]">
                    {purchaseUser(reviewing)?.email || 'No email'}
                  </div>
                </div>

                <div className="rounded bg-[#141414] border border-[#282828] p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#666666]">Submission</div>
                  <div className="text-xs text-[#ededed]">
                    {formatDate(reviewing.createdAt)}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[#666666] pt-1">
                    Status
                  </div>
                  <div className="text-xs uppercase font-bold">{reviewing.status}</div>
                  {reviewing.reviewedAt && (
                    <div className="text-[10px] text-[#888888]">
                      Reviewed {formatDate(reviewing.reviewedAt)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#ededed] font-medium mb-1 font-mono">
                    Admin note
                  </label>
                  <textarea
                    rows={4}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Reason for rejection or verification note..."
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-[#666666] mb-2">
                  Payment screenshot
                </div>
                <div className="rounded bg-[#141414] border border-[#282828] p-2 min-h-[320px] flex items-center justify-center">
                  {reviewing.screenshotUrl ? (
                    <img
                      src={resolveMediaUrl(reviewing.screenshotUrl)}
                      alt={`Payment proof for ${reviewing.albumTitle}`}
                      className="max-h-[60vh] w-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-xs text-[#666666]">No screenshot attached</div>
                  )}
                </div>
                {reviewing.screenshotUrl && (
                  <a
                    href={resolveMediaUrl(reviewing.screenshotUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-[#3ecf8e] hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    Open full screenshot
                  </a>
                )}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-[#282828] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeReview}
                disabled={isSubmitting}
                className="px-4 py-2 rounded text-[#ededed] bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] transition-colors disabled:opacity-50"
              >
                Close
              </button>
              {reviewing.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve & Unlock Album
                  </button>
                </>
              )}
              {reviewing.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingRevert(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revert to Pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(isConfirmingRevert && reviewing)}
        title="Revert Approval"
        message={`Return the payment for "${reviewing?.albumTitle || ''}" to pending? This removes the user's access to the album until it is reviewed and approved again.`}
        tone="amber"
        confirmText="Revert to Pending"
        note="Only do this if the approval was accidental. The payment screenshot and submission are kept."
        isLoading={isSubmitting}
        onConfirm={handleRevert}
        onCancel={() => {
          if (!isSubmitting) setIsConfirmingRevert(false);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={`Delete ${deleting?.status === 'approved' ? 'Approved' : 'Rejected'} Record`}
        message={`Permanently delete the ${deleting?.status || ''} payment record for "${deleting?.albumTitle || ''}" by ${(deleting ? purchaseUser(deleting)?.name : '') || 'this user'}?`}
        resourceType="payment history"
        confirmText="Delete Permanently"
        note={
          deleting?.status === 'approved'
            ? 'The record and its MinIO screenshot are permanently deleted. The user keeps the album access already granted, and the album owner\'s sales total is recalculated without this record.'
            : 'The record and its MinIO screenshot are permanently deleted. This cannot be undone.'
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteOne}
        onCancel={() => {
          if (!isDeleting) setDeleting(null);
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmingBulkDelete}
        title={`Delete ${statusFilter === 'approved' ? 'Approved' : 'Rejected'} History`}
        message={`Permanently delete ${filtered.length} ${statusFilter} payment record(s)${dateRangeLabel}${searchTerm.trim() ? ', matching the current search' : ''}?`}
        resourceType="payment history"
        confirmText={`Delete ${filtered.length} Records`}
        note={
          statusFilter === 'approved'
            ? 'The records and their MinIO screenshots are permanently deleted. Users keep the album access already granted, and album owner sales totals are recalculated without these records.'
            : 'The records and their MinIO screenshots are permanently deleted. This cannot be undone.'
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteShown}
        onCancel={() => {
          if (!isDeleting) setIsConfirmingBulkDelete(false);
        }}
      />
    </div>
  );
};


