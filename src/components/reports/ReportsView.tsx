import React, { useEffect, useState } from 'react';
import { Album, Track, Singer, Organization, Playlist, User } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Headphones,
  Disc,
  Music,
  Clock,
  PieChart as PieChartIcon,
  TrendingUp,
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
  AreaChart,
  Area,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { addToast, refreshKey } = useBackend();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
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
        setAlbums(a || []);
        setTracks(t || []);
        setSingers(s || []);
        setOrganizations(o || []);
        setPlaylists(p || []);
        setUsers((u as User[]) || []);
      } catch (err: any) {
        addToast('error', `Reports data fetch error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, [refreshKey]);

  // Aggregate Metrics
  const totalDurationMinutes = Math.round(
    tracks.reduce((acc, t) => acc + (t.durationSeconds || 0), 0) / 60
  );
  const totalPlayCount = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const karaokeTrackCount = tracks.filter((t) => t.hasKaraoke || t.karaokeAudioUrl).length;

  // Release year distribution data
  const yearCounts: Record<number, number> = {};
  albums.forEach((a) => {
    const yr = a.releaseYear || 2026;
    yearCounts[yr] = (yearCounts[yr] || 0) + 1;
  });
  const yearData = Object.keys(yearCounts)
    .sort()
    .map((y) => ({
      year: y,
      albums: yearCounts[Number(y)],
    }));

  // Export Summary to JSON/CSV
  const exportReportCSV = () => {
    const headers = ['Type', 'Title/Name', 'Owner/Artist', 'Secondary Info', 'Plays/Count'];
    const rows: string[][] = [
      ...albums.map((a) => ['Album', a.title, a.ownerName, `Year ${a.releaseYear}`, `${a.trackCount} tracks`]),
      ...tracks.map((t) => ['Track', t.title, t.artistName, t.genre || 'Folk', `${t.playCount} plays`]),
      ...singers.map((s) => ['Singer', s.name, 'Solo Singer', s.description || '', '-']),
      ...organizations.map((o) => ['Organization', o.name, 'Org Archive', o.description || '', '-']),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rawang_music_catalogue_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Rawang catalogue report exported to CSV!');
  };

  const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="p-6 space-y-6 text-[#ededed]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1c1c1c] border border-[#282828] p-4 rounded">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3ecf8e]" /> Catalogue Audit & Analytical Reports
          </h3>
          <p className="text-xs text-[#888888] mt-0.5">
            Statistical distribution, duration breakdown & catalogue export tools
          </p>
        </div>

        <button
          onClick={exportReportCSV}
          className="px-3.5 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-2">
            <span>Total Audio Duration</span>
            <Clock className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalDurationMinutes} Mins</div>
          <p className="text-[10px] text-[#666666] font-mono mt-1">Across {tracks.length} master tracks</p>
        </div>

        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-2">
            <span>Cumulative Plays</span>
            <Headphones className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">{totalPlayCount.toLocaleString()}</div>
          <p className="text-[10px] text-[#3ecf8e] font-mono font-semibold mt-1">Active listener hits</p>
        </div>

        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-2">
            <span>Karaoke Availability</span>
            <PieChartIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {tracks.length ? Math.round((karaokeTrackCount / tracks.length) * 100) : 0}%
          </div>
          <p className="text-[10px] text-amber-400 font-mono font-semibold mt-1">
            {karaokeTrackCount} tracks with karaoke audio
          </p>
        </div>

        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#888888] font-mono mb-2">
            <span>Artist & Org Entities</span>
            <Disc className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {singers.length + organizations.length}
          </div>
          <p className="text-[10px] text-[#666666] font-mono mt-1">
            {singers.length} Singers, {organizations.length} Organizations
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Album Release Timeline */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 shadow-sm">
          <h4 className="text-sm font-mono font-bold text-white mb-1">Albums Released by Year</h4>
          <p className="text-xs text-[#888888] mb-4">Historical distribution of catalogue publications</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAlbums" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" opacity={0.7} />
                <XAxis dataKey="year" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1c1c',
                    borderColor: '#282828',
                    borderRadius: '4px',
                    color: '#ededed',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="albums"
                  stroke="#3ecf8e"
                  fillOpacity={1}
                  fill="url(#colorAlbums)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Stream Ranking */}
        <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5 shadow-sm">
          <h4 className="text-sm font-mono font-bold text-white mb-1">Catalogue Performance Ranking</h4>
          <p className="text-xs text-[#888888] mb-4">Top play counts across all songs</p>

          <div className="space-y-3">
            {[...tracks]
              .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
              .slice(0, 5)
              .map((trk, rank) => (
                <div
                  key={trk.id}
                  className="flex items-center justify-between p-3 rounded bg-[#141414] border border-[#282828] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded font-mono font-bold flex items-center justify-center shrink-0 text-xs ${
                        rank === 0
                          ? 'bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/30'
                          : 'bg-[#222222] text-[#888888]'
                      }`}
                    >
                      #{rank + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{trk.title}</div>
                      <div className="text-[10px] text-[#888888] font-mono">{trk.artistName}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-[#3ecf8e] font-bold">
                      {(trk.playCount || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#666666]">plays</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
