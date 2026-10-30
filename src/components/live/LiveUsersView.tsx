import React, { useMemo } from 'react';
import {
  Mail,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  Users,
  WifiOff,
} from 'lucide-react';
import { usePresence } from '../../context/PresenceContext';
import { PresenceUser } from '../../types';

interface LiveUsersViewProps {
  searchTerm: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const UserCard: React.FC<{ user: PresenceUser }> = ({ user }) => {
  const initial = (user.name || '?').trim().charAt(0).toUpperCase();

  return (
    <article className="presence-card relative overflow-hidden rounded border border-[#282828] bg-[#1c1c1c] p-4 transition-colors hover:border-[#3e3e3e]">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a3d33] to-[#1a1f1d] border border-[#3ecf8e]/25 flex items-center justify-center text-sm font-bold text-[#3ecf8e] font-mono">
            {initial || <UserRound className="w-4 h-4" />}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1c1c1c] bg-[#3ecf8e] shadow-[0_0_6px_#3ecf8e]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white truncate">
            {user.name || 'Guest'}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#888888] font-mono min-w-0">
            <Mail className="w-3 h-3 shrink-0 text-[#666666]" />
            <span className="truncate">{user.email || 'No email'}</span>
          </p>
        </div>
      </div>
    </article>
  );
};

export const LiveUsersView: React.FC<LiveUsersViewProps> = ({ searchTerm }) => {
  const { users, count, status, generatedAt, simulated, legacy, refresh } =
    usePresence();

  // The old backend exposes only a socket count. Keep that real number, but do
  // not invent identities for it — accounts are shown only when the presence
  // stream provides real usernames and emails.
  const displayUsers = users;
  const displayCount = count;

  const query = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return displayUsers;
    return displayUsers.filter((user) =>
      [user.name, user.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [displayUsers, query]);

  const statusBadge = () => {
    if (legacy) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/25 text-[10px] font-mono font-bold text-purple-300 uppercase">
          <Sparkles className="w-3 h-3" />
          Count only · backend update
        </span>
      );
    }
    if (status === 'demo') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-300 uppercase">
          <Sparkles className="w-3 h-3" />
          Demo stream
        </span>
      );
    }
    if (status === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 text-[10px] font-mono font-bold text-[#3ecf8e] uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3ecf8e]" />
          </span>
          Live · Socket.IO
        </span>
      );
    }
    if (status === 'polling') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-mono font-bold text-cyan-300 uppercase">
          <RefreshCw className="w-3 h-3" />
          Polling · 15s
        </span>
      );
    }
    if (status === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-300 uppercase">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Connecting
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/25 text-[10px] font-mono font-bold text-red-300 uppercase">
        <WifiOff className="w-3 h-3" />
        Offline
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Presence hero */}
      <div className="relative overflow-hidden rounded border border-[#282828] bg-gradient-to-br from-[#14251d] via-[#171a18] to-[#121212]">
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[#3ecf8e]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="relative p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3ecf8e]" />
              </span>
              <span className="text-[10px] font-mono font-bold text-[#3ecf8e] uppercase tracking-widest">
                Live listeners
              </span>
              {statusBadge()}
            </div>

            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold font-mono text-white leading-none tracking-tight">
                {displayCount}
              </span>
              <div className="pb-1">
                <p className="text-sm font-semibold text-[#ededed] leading-tight">
                  {legacy
                    ? displayCount === 1
                      ? 'connection online'
                      : 'connections online'
                    : displayCount === 1
                      ? 'user online'
                      : 'users online'}
                </p>
                <p className="text-[11px] font-mono text-[#888888]">
                  {legacy ? 'real count · identities pending' : 'username & email'}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#888888] max-w-lg">
              {legacy
                ? 'This production backend reports the real number of connected sockets, but does not publish usernames or emails yet.'
                : 'Signed-in listeners currently active in the Flutter app or iOS web player.'}
            </p>
          </div>

          <button
            onClick={() => refresh()}
            className="self-start sm:self-auto px-3 py-1.5 rounded border border-[#333333] bg-[#1c1c1c] hover:bg-[#222222] text-xs font-medium text-[#a1a1a1] hover:text-[#ededed] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {legacy && (
          <div className="relative border-t border-purple-500/20 bg-purple-500/[0.06] px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-purple-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              This backend reports only the real online count. Usernames and
              emails will appear after the updated presence module and clients
              are deployed.
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-[9px] font-bold uppercase">
              Count only
            </span>
          </div>
        )}

        {(simulated || generatedAt) && (
          <div className="relative border-t border-[#282828] px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#666666]">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#3ecf8e]" />
              {simulated
                ? 'Local mock server stream — connect a player to the real backend for genuine presence.'
                : 'Only username and email are shared with admins — never phone numbers, tokens, or IP addresses.'}
            </span>
            {generatedAt && <span>Updated {formatTime(generatedAt)}</span>}
          </div>
        )}
      </div>

      {/* List header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1c1c1c] border border-[#282828] rounded p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#ededed]">
          <Users className="w-3.5 h-3.5 text-[#3ecf8e]" />
          All live users
          <span className="font-mono text-[10px] text-[#888888]">
            {displayCount}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#666666]">
          {legacy ? (
            <span>Identity details unavailable</span>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              {query ? (
                <span>
                  {filtered.length} match{filtered.length === 1 ? '' : 'es'} for
                  “{searchTerm}”
                </span>
              ) : (
                <span>
                  Showing {filtered.length} of {displayCount} live user
                  {displayCount === 1 ? '' : 's'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Live list */}
      {filtered.length === 0 ? (
        <div className="rounded border border-dashed border-[#333333] bg-[#171717] px-6 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-center mb-3">
            {legacy ? (
              <Radio className="w-5 h-5 text-[#666666]" />
            ) : (
              <WifiOff className="w-5 h-5 text-[#666666]" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-[#ededed]">
            {legacy
              ? 'Identity stream not deployed'
              : displayCount === 0
                ? 'No users online yet'
                : 'No users found'}
          </h3>
          <p className="mt-1 text-xs text-[#888888] max-w-sm">
            {legacy
              ? `The real online count is ${displayCount}. Deploy the updated backend and clients to show usernames and emails here.`
              : displayCount === 0
                ? 'Open the Flutter app or iOS web player and the live user will appear here instantly.'
                : 'Try a different name or email address.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filtered.map((user) => (
            <UserCard key={user.connectionId} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};
