import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Album, AlbumSaleRecord, AlbumSalesResult, OwnerModel } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Disc,
  Inbox,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Wallet,
} from 'lucide-react';

interface AlbumSalesViewProps {
  searchTerm: string;
}

interface OwnerOption {
  key: string;
  ownerModel: OwnerModel;
  ownerId: string;
  name: string;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

function ownersFromAlbums(albums: Album[]): OwnerOption[] {
  const map = new Map<string, OwnerOption>();
  for (const album of albums) {
    if (!album.ownerModel || !album.ownerId) continue;
    const key = `${album.ownerModel}:${album.ownerId}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        ownerModel: album.ownerModel,
        ownerId: album.ownerId,
        name: album.ownerName || `${album.ownerModel} profile`,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const AlbumSalesView: React.FC<AlbumSalesViewProps> = ({ searchTerm }) => {
  const { addToast, refreshKey, triggerRefresh } = useBackend();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [ownerKey, setOwnerKey] = useState('');
  const [data, setData] = useState<AlbumSalesResult | null>(null);
  const [albumId, setAlbumId] = useState('');
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AlbumSaleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const requestRef = useRef(0);

  const owners = useMemo(() => ownersFromAlbums(albums), [albums]);
  const currentOwner = owners.find((owner) => owner.key === ownerKey) || null;

  useEffect(() => {
    let cancelled = false;
    api
      .getAlbums()
      .then((list) => {
        if (!cancelled) setAlbums(list || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load albums');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOwners(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (isLoadingOwners) return;
    if (owners.length === 0) {
      setOwnerKey('');
      setData(null);
      setIsLoading(false);
      return;
    }
    if (!owners.some((owner) => owner.key === ownerKey)) {
      setOwnerKey(owners[0].key);
    }
  }, [owners, ownerKey, isLoadingOwners]);

  const loadSales = async (owner: OwnerOption, requestedAlbumId?: string) => {
    const seq = ++requestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getAlbumSales(
        owner.ownerModel,
        owner.ownerId,
        requestedAlbumId
      );
      if (seq !== requestRef.current) return;
      setData(result);
      setAlbumId(result.selected?.id || '');
    } catch (err: any) {
      if (seq !== requestRef.current) return;
      setError(err.message || 'Failed to load album sales');
    } finally {
      if (seq === requestRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentOwner) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setData(null);
    setAlbumId('');
    loadSales(currentOwner);
    return () => {
      requestRef.current += 1;
    };
  }, [ownerKey]);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const result = await api.deleteAlbumPurchase(deleting.id);
      addToast('success', 'Approved sale deleted permanently.');
      if (!result.screenshotRemoved) {
        addToast('warning', 'The record was deleted, but its screenshot could not be removed.');
      }
      setDeleting(null);
      triggerRefresh();
      if (currentOwner) {
        loadSales(currentOwner, albumId || undefined);
      }
    } catch (err: any) {
      addToast('error', `Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const selected = data?.selected || null;
  const term = searchTerm.trim().toLowerCase();
  const records = (selected?.records || []).filter(
    (record) =>
      !term ||
      record.buyerName.toLowerCase().includes(term) ||
      record.buyerPhone.toLowerCase().includes(term) ||
      record.buyerEmail.toLowerCase().includes(term) ||
      formatDate(record.purchasedAt).toLowerCase().includes(term)
  );

  return (
    <div className="p-6 space-y-5 text-[#ededed]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#3ecf8e]" />
            Album Sales
          </h3>
          <p className="text-xs text-[#888888] mt-1">
            Approved album purchases by owner and album, with automatically calculated totals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ownerKey}
            onChange={(e) => setOwnerKey(e.target.value)}
            disabled={owners.length === 0}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e] max-w-[220px] disabled:opacity-50"
          >
            {owners.length === 0 ? (
              <option value="">No owners</option>
            ) : (
              owners.map((owner) => (
                <option key={owner.key} value={owner.key}>
                  {owner.name} ({owner.ownerModel})
                </option>
              ))
            )}
          </select>
          <select
            value={albumId}
            onChange={(e) => {
              const nextId = e.target.value;
              setAlbumId(nextId);
              if (currentOwner) loadSales(currentOwner, nextId || undefined);
            }}
            disabled={!data?.albums.length}
            className="bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-xs text-[#ededed] focus:outline-none focus:border-[#3ecf8e] max-w-[260px] disabled:opacity-50"
          >
            {(data?.albums || []).length === 0 ? (
              <option value="">No albums</option>
            ) : (
              data!.albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title} - {album.totalAmount.toLocaleString()} MMK
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={() => currentOwner && loadSales(currentOwner, albumId || undefined)}
            disabled={!currentOwner || isLoading}
            className="p-1.5 rounded bg-[#171717] hover:bg-[#222222] border border-[#282828] transition-colors disabled:opacity-50"
            title="Refresh album sales"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#888] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {isLoadingOwners ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse h-44" />
      ) : owners.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-12 text-center">
          <Inbox className="w-12 h-12 mx-auto text-[#444444]" />
          <h3 className="text-sm font-mono font-bold text-white mt-3">
            No owner-linked albums
          </h3>
          <p className="text-xs text-[#666666] mt-1">
            Assign albums to a singer or organization to see their sales.
          </p>
        </div>
      ) : isLoading && !data ? (
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 animate-pulse h-44" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SaleStat
              icon={<Wallet className="w-4 h-4" />}
              label="Owner total earned"
              value={`${(data?.totalEarned || 0).toLocaleString()} MMK`}
              highlight
            />
            <SaleStat
              icon={<Disc className="w-4 h-4" />}
              label="Selected album earned"
              value={`${(selected?.totalAmount || 0).toLocaleString()} MMK`}
            />
            <SaleStat
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Approved purchases"
              value={(selected?.purchaseCount || 0).toLocaleString()}
            />
          </div>

          <div className="bg-[#1c1c1c] border border-[#282828] rounded overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-xs font-mono font-bold text-white">
                  {selected?.title || currentOwner?.name || 'Album sales'}
                </h3>
                <p className="text-[11px] text-[#666666] font-mono mt-0.5">
                  {currentOwner?.name || '-'} - {selected?.purchaseCount || 0} approved
                </p>
              </div>
              {term && (
                <span className="text-[10px] font-mono text-[#888888]">
                  Showing {records.length} matching record(s)
                </span>
              )}
            </div>

            {records.length === 0 ? (
              <p className="px-4 pb-5 text-xs text-[#666666]">
                {term
                  ? 'No sales match the current search.'
                  : 'No approved purchases for this album yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#ededed]">
                  <thead className="bg-[#171717] border-y border-[#282828] text-[10px] font-mono text-[#888888] uppercase">
                    <tr>
                      <th className="px-4 py-2">Buyer</th>
                      <th className="px-4 py-2">Approved</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282828]">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-[#222222]">
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{record.buyerName}</div>
                          <div className="text-[11px] text-[#888888]">
                            {record.buyerPhone || 'No phone'}
                          </div>
                          <div className="text-[11px] text-[#888888]">
                            {record.buyerEmail || 'No email'}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#888888]">
                          {formatDate(record.purchasedAt)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#3ecf8e] font-bold">
                          {record.amount.toLocaleString()} MMK
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            <button
                              onClick={() => setDeleting(record)}
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                              title="Permanently delete this sale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 text-[11px] text-[#888888]">
            Totals are calculated from approved records only. Deleting an approved sale removes
            the record and its screenshot, keeps the buyer's album access, and recalculates these
            totals.
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete Approved Sale"
        message={`Permanently delete the approved sale of "${selected?.title || ''}" for ${deleting?.buyerName || 'this buyer'}?`}
        resourceType="album sale"
        confirmText="Delete Permanently"
        note="The record and its MinIO screenshot are permanently deleted. The buyer keeps album access, and the owner totals are recalculated without this sale."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) setDeleting(null);
        }}
      />
    </div>
  );
};

function SaleStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded p-4 border ${
        highlight
          ? 'bg-[#3ecf8e]/5 border-[#3ecf8e]/20'
          : 'bg-[#1c1c1c] border-[#282828]'
      }`}
    >
      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888888] uppercase">
        <span className={highlight ? 'text-[#3ecf8e]' : undefined}>{icon}</span>
        {label}
      </div>
      <div
        className={`text-xl font-mono font-bold mt-1 ${
          highlight ? 'text-[#3ecf8e]' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
