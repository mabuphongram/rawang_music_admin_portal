import React from 'react';
import { useBackend } from '../../context/BackendContext';
import { usePresence } from '../../context/PresenceContext';
import {
  LayoutDashboard,
  Disc,
  Music,
  UserCheck,
  Building2,
  ListMusic,
  MessageSquare,
  Images,
  MonitorPlay,
  Inbox,
  UserPlus,
  Link2,
  BarChart3,
  Settings,
  Sparkles,
  Database,
  Terminal,
  Users,
  Radio,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'live'
  | 'albums'
  | 'tracks'
  | 'singers'
  | 'organizations'
  | 'heroslides'
  | 'videos'
  | 'contributions'
  | 'requests'
  | 'ownership'
  | 'users'
  | 'chat'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  stats?: {
    totalAlbums: number;
    totalTracks: number;
    totalSingers: number;
    totalOrganizations: number;
    totalPlaylists: number;
    totalChatMessages: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, stats }) => {
  const { healthStatus, apiUrl } = useBackend();
  const { count: liveCount } = usePresence();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'live' as NavTab, label: 'Live Users', icon: Radio, count: liveCount },
    { id: 'albums' as NavTab, label: 'Albums', icon: Disc, count: stats?.totalAlbums },
    { id: 'tracks' as NavTab, label: 'Tracks', icon: Music, count: stats?.totalTracks },
    { id: 'singers' as NavTab, label: 'Singers', icon: UserCheck, count: stats?.totalSingers },
    { id: 'organizations' as NavTab, label: 'Organizations', icon: Building2, count: stats?.totalOrganizations },
    { id: 'heroslides' as NavTab, label: 'Hero Slides', icon: Images },
    { id: 'videos' as NavTab, label: 'Videos', icon: MonitorPlay },
    { id: 'contributions' as NavTab, label: 'Contributions', icon: Inbox },
    { id: 'requests' as NavTab, label: 'Owner Requests', icon: UserPlus },
    { id: 'ownership' as NavTab, label: 'Ownership', icon: Link2 },
    { id: 'users' as NavTab, label: 'Users', icon: Users },
    { id: 'chat' as NavTab, label: 'Broadcast Log', icon: MessageSquare, count: stats?.totalChatMessages },
    { id: 'reports' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Project Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#121212] border-r border-[#282828] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-[#888888] select-none">
      <div>
        {/* Supabase Brand Header */}
        <div className="p-4 border-b border-[#282828]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#3ecf8e] rounded flex items-center justify-center text-black font-extrabold shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 fill-black text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-[#ededed] truncate">Rawang Studio</h1>
                <span className="px-1 py-0.2 bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 text-[9px] font-mono font-bold rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#666666] truncate">
                rawang-music-db
              </p>
            </div>
          </div>
        </div>

        {/* Database Connection Status Indicator */}
        <div className="px-3 py-2 mx-3 my-3 rounded bg-[#171717] border border-[#282828] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                healthStatus === 'ok'
                  ? 'bg-[#3ecf8e] shadow-[0_0_8px_#3ecf8e]'
                  : healthStatus === 'error'
                  ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-mono text-[11px] text-[#ededed] truncate">
              {healthStatus === 'ok' ? 'Database Healthy' : healthStatus === 'error' ? 'Connection Error' : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-[10px] text-[#3ecf8e] hover:underline font-mono uppercase font-bold shrink-0 ml-1"
          >
            API
          </button>
        </div>

        {/* Section Header */}
        <div className="px-4 py-1.5 text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider">
          Catalogue & Services
        </div>

        {/* Navigation Section */}
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-[#1c1c1c] text-white border-l-2 border-[#3ecf8e] font-semibold'
                    : 'text-[#888888] hover:bg-[#1a1a1a] hover:text-[#ededed]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-[#3ecf8e]' : 'text-[#666666] group-hover:text-[#a1a1a1]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono flex items-center gap-1 ${
                      item.id === 'live'
                        ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/25 font-bold'
                        : isActive
                        ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 font-bold'
                        : 'bg-[#171717] text-[#666666] group-hover:text-[#a1a1a1] border border-[#282828]'
                    }`}
                  >
                    {item.id === 'live' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3ecf8e]" />
                      </span>
                    )}
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#282828] bg-[#121212] text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] text-[#666666] flex items-center gap-1">
            <Database className="w-3 h-3 text-[#3ecf8e]" /> Target API
          </span>
          <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] text-[9px] font-mono text-[#3ecf8e] border border-[#282828]">
            {apiUrl.includes('localhost') ? 'LOCAL' : 'REMOTE'}
          </span>
        </div>
        <div className="truncate font-mono text-[10px] text-[#888888]" title={apiUrl}>
          {apiUrl}
        </div>
      </div>
    </aside>
  );
};
