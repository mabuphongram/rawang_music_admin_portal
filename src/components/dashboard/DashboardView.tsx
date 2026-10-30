import React, { useEffect, useState } from 'react';
import { Album, Track, Singer, Organization, Playlist, User } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MediaImage } from '../common/MediaImage';
import { NavTab } from '../layout/Sidebar';
import {
  Disc,
  Music,
  UserCheck,
  Building2,
  ListMusic,
  Play,
  TrendingUp,
  Radio,
  ArrowUpRight,
  Headphones,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenCreateModal: (type: 'album' | 'track' | 'singer' | 'organization' | 'playlist') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenCreateModal,
}) => {
  const { playTrack, refreshKey } = useBackend();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [a, t, s, o, p, u] = await Promise.all([
          api.getAlbums(),
          api.getTracks(),
          api.getSingers(),
          api.getOrganizations(),
          api.getPlaylists().catch(() => []),
          api.getUsers().catch(() => []),
        ]);
        if (isMounted) {
          setAlbums(a || []);
          setTracks(t || []);
          setSingers(s || []);
          setOrganizations(o || []);
          setPlaylists(p || []);
          setUsers((u as User[]) || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Derived stats
  const totalPlays = tracks.reduce((acc, trk) => acc + (trk.playCount || 0), 0);

  // Genre chart data
  const genreCounts: Record<string, number> = {};
  tracks.forEach((t) => {
    const g = t.genre || 'Folk';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genreData = Object.keys(genreCounts).map((g) => ({
    name: g,
    value: genreCounts[g],
  }));

  // Top tracks by play count
  const topTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);

  // Owner type distribution
  const ownerCounts = {
    singer: albums.filter((a) => a.ownerType === 'singer').length,
    organization: albums.filter((a) => a.ownerType === 'organization').length,
    anonymous: albums.filter((a) => a.ownerType === 'anonymous').length,
  };
  const ownerData = [
    { name: 'Singers', count: ownerCounts.singer, color: '#3ecf8e' },
    { name: 'Organizations', count: ownerCounts.organization, color: '#06b6d4' },
    { name: 'Anonymous', count: ownerCounts.anonymous, color: '#f59e0b' },
  ];

  const CHART_COLORS = ['#3ecf8e', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Stat Cards Grid - Supabase Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Albums */}
        <div
          onClick={() => setActiveTab('albums')}
          className="bg-[#1c1c1c] p-4 rounded border border-[#282828] hover:border-[#3e3e3e] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Albums</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center group-hover:bg-[#3ecf8e]/20 transition-colors">
              <Disc className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{albums.length}</div>
          <p className="text-[10px] text-[#3ecf8e] mt-2 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12 active
          </p>
        </div>

        {/* Tracks */}
        <div
          onClick={() => setActiveTab('tracks')}
          className="bg-[#1c1c1c] p-4 rounded border border-[#282828] hover:border-[#3e3e3e] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Tracks</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center group-hover:bg-[#3ecf8e]/20 transition-colors">
              <Music className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{tracks.length}</div>
          <p className="text-[10px] text-[#3ecf8e] mt-2 font-mono">
            {tracks.filter((t) => t.hasKaraoke || t.karaokeAudioUrl).length} Karaoke
          </p>
        </div>

        {/* Singers */}
        <div
          onClick={() => setActiveTab('singers')}
          className="bg-[#1c1c1c] p-4 rounded border border-[#282828] hover:border-[#3e3e3e] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Singers</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center group-hover:bg-[#3ecf8e]/20 transition-colors">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{singers.length}</div>
          <p className="text-[10px] text-[#888888] mt-2 font-mono">Artists Roster</p>
        </div>

        {/* Organizations */}
        <div
          onClick={() => setActiveTab('organizations')}
          className="bg-[#1c1c1c] p-4 rounded border border-[#282828] hover:border-[#3e3e3e] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Orgs</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center group-hover:bg-[#3ecf8e]/20 transition-colors">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{organizations.length}</div>
          <p className="text-[10px] text-[#888888] mt-2 font-mono">Entities</p>
        </div>

        {/* Users - replaces Playlists (discarded in Flutter) */}
        <div
          onClick={() => setActiveTab('users')}
          className="bg-[#1c1c1c] p-4 rounded border border-[#282828] hover:border-[#3e3e3e] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Users</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center group-hover:bg-[#3ecf8e]/20 transition-colors">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{users.length}</div>
          <p className="text-[10px] text-[#3ecf8e] mt-2 font-mono">{users.filter((u) => u.subscriptionPlan !== 'free').length} Paid • {users.filter((u) => u.subscriptionPlan === 'free').length} Free 2y</p>
        </div>

        {/* Total Plays */}
        <div className="bg-[#1c1c1c] p-4 rounded border border-[#282828]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#888888] uppercase">Total Plays</span>
            <div className="w-6 h-6 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalPlays.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#3ecf8e] font-mono mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Listener Hits
          </p>
        </div>
      </div>

      {/* Quick Action Bar - Supabase Style */}
      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Rawang Music Quick Actions</h3>
            <p className="text-[11px] text-[#888888]">
              Manage records, upload media, or configure project settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenCreateModal('album')}
            className="px-3 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Album</span>
          </button>
          <button
            onClick={() => onOpenCreateModal('track')}
            className="px-3 py-1.5 rounded bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-[#ededed] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Add Track</span>
          </button>
          <button
            onClick={() => onOpenCreateModal('singer')}
            className="px-3 py-1.5 rounded bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-[#ededed] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Singer</span>
          </button>
          <button
            onClick={() => onOpenCreateModal('organization')}
            className="px-3 py-1.5 rounded bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-[#ededed] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Org</span>
          </button>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: Top Tracks Play Count */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Top Played Tracks</h2>
              <p className="text-[11px] text-[#888888]">Play count analytics</p>
            </div>
            <button
              onClick={() => setActiveTab('tracks')}
              className="text-xs text-[#3ecf8e] hover:underline font-mono flex items-center gap-1"
            >
              View Table <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTracks} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" opacity={0.6} />
                <XAxis
                  dataKey="title"
                  stroke="#666666"
                  fontSize={10}
                  tick={{ fill: '#888888' }}
                  interval={0}
                  tickFormatter={(val) => (val.length > 12 ? `${val.substring(0, 10)}...` : val)}
                />
                <YAxis stroke="#666666" fontSize={10} tick={{ fill: '#888888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#282828',
                    borderRadius: '6px',
                    color: '#ededed',
                  }}
                />
                <Bar dataKey="playCount" fill="#3ecf8e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Genre Distribution Donut */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Genre Breakdown</h2>
            <p className="text-[11px] text-[#888888] mb-4">Track distribution by genre</p>

            <div className="h-44 w-full flex items-center justify-center">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        borderColor: '#282828',
                        borderRadius: '6px',
                        color: '#ededed',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-[#666666] font-mono">No tracks available</div>
              )}
            </div>
          </div>

          {/* Genre legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-[#282828]">
            {genreData.map((g, idx) => (
              <div key={g.name} className="flex items-center gap-1.5 text-xs text-[#a1a1a1]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="font-mono text-[11px]">
                  {g.name}: <strong className="text-white">{g.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tracks Feed & Owner Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Stream Feed */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Audio Stream Inspection</h2>
              <p className="text-[11px] text-[#888888]">Direct player preview</p>
            </div>
            <button
              onClick={() => setActiveTab('tracks')}
              className="text-xs text-[#3ecf8e] hover:underline font-mono"
            >
              Browse All
            </button>
          </div>

          <div className="space-y-1.5">
            {tracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2.5 rounded bg-[#141414] border border-[#282828] hover:bg-[#1a1a1a] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <MediaImage
                      src={track.audioUrl}
                      alt={track.title}
                      type="track"
                      className="w-8 h-8 rounded object-cover"
                    />
                    <button
                      onClick={() => playTrack(track)}
                      className="absolute inset-0 bg-[#3ecf8e]/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                    >
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-white truncate">
                        {track.title}
                      </h5>
                      {track.rawangTitle && (
                        <span className="text-[10px] text-[#3ecf8e] font-mono truncate">
                          ({track.rawangTitle})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#888888] truncate font-mono">
                      {track.artistName} • {track.albumName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {track.hasKaraoke && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] font-mono">
                      Karaoke
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#666666]">
                    {Math.floor(track.durationSeconds / 60)}:
                    {(track.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => playTrack(track)}
                    className="p-1.5 rounded bg-[#222222] border border-[#333333] text-[#3ecf8e] hover:bg-[#3ecf8e] hover:text-black transition-colors"
                    title="Play Track"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Type Ratio */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">Albums by Owner Type</h2>
            <p className="text-[11px] text-[#888888] mb-4">
              Singer, Organization, or Anonymous ownership
            </p>

            <div className="space-y-4">
              {ownerData.map((owner) => (
                <div key={owner.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#a1a1a1]">{owner.name}</span>
                    <span className="text-[#888888]">{owner.count} Albums</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${albums.length ? (owner.count / albums.length) * 100 : 0}%`,
                        backgroundColor: owner.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#282828] text-xs text-[#888888] flex items-center justify-between">
            <span className="font-mono text-[10px]">Backend Schema</span>
            <span className="px-2 py-0.2 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 text-[9px] font-mono font-bold">
              100% VALIDATED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
