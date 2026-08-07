import React from 'react';
import { useBackend } from '../../context/BackendContext';
import { Search, RefreshCw, Plus, ChevronRight, Terminal, Sparkles } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenCreateModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  onOpenCreateModal,
}) => {
  const { checkBackendHealth, triggerRefresh } = useBackend();

  const titlesMap: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Overview',
      subtitle: 'Real-time catalogue statistics, owner distribution & music metrics',
    },
    albums: {
      title: 'Albums',
      subtitle: 'Catalogue albums by singers, organizations & anonymous owners',
    },
    tracks: {
      title: 'Audio Tracks',
      subtitle: 'Audio files, karaoke versions, lyrics, duration & play counts',
    },
    singers: {
      title: 'Singers',
      subtitle: 'Vocal artists, avatars, bios and published albums',
    },
    organizations: {
      title: 'Organizations',
      subtitle: 'Cultural heritage associations and music publishing bodies',
    },
    playlists: {
      title: 'Playlists',
      subtitle: 'Curated track collections and track associations',
    },
    chat: {
      title: 'Broadcast Log',
      subtitle: 'System broadcasts and user interaction feed',
    },
    reports: {
      title: 'Analytics & Reports',
      subtitle: 'In-depth catalogue audits, genre metrics and exportable reports',
    },
    settings: {
      title: 'Project Settings',
      subtitle: 'API Base URL, MinIO object key prefixes and health diagnostics',
    },
  };

  const currentInfo = titlesMap[activeTab] || { title: 'Portal', subtitle: '' };

  return (
    <header className="bg-[#121212] border-b border-[#282828] sticky top-0 z-30 px-6 h-14 flex items-center justify-between gap-4">
      {/* Supabase Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono text-[#666666] font-medium flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#3ecf8e]" />
          rawang-music-db
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#444444]" />
        <h2 className="font-semibold text-[#ededed]">
          {currentInfo.title}
        </h2>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search input with Supabase kbd badge */}
        {['albums', 'tracks', 'singers', 'organizations', 'playlists', 'chat'].includes(activeTab) && (
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder={`Filter ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#171717] border border-[#282828] rounded pl-8 pr-12 py-1 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e] transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.2 bg-[#222222] border border-[#333333] text-[9px] font-mono text-[#888888] rounded">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Global Refresh Button */}
        <button
          onClick={() => {
            checkBackendHealth();
            triggerRefresh();
          }}
          className="p-1.5 rounded bg-[#171717] hover:bg-[#222222] text-[#ededed] border border-[#282828] transition-colors shrink-0"
          title="Refresh Data & Check API Health"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#888888] hover:text-[#3ecf8e]" />
        </button>

        {/* Dynamic Contextual Create Button - Supabase Emerald style */}
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="px-3 py-1 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New {activeTab.slice(0, -1)}</span>
          </button>
        )}

        {/* Project Environment Pill */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#282828] text-xs">
          <div className="px-2 py-0.5 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-[10px] font-mono font-bold rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
            <span>eu-west-1</span>
          </div>
        </div>
      </div>
    </header>
  );
};
