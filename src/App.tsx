import React, { useState } from 'react';
import { BackendProvider } from './context/BackendContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { AlbumsView } from './components/albums/AlbumsView';
import { TracksView } from './components/tracks/TracksView';
import { SingersView } from './components/singers/SingersView';
import { OrganizationsView } from './components/organizations/OrganizationsView';
import { PlaylistsView } from './components/playlists/PlaylistsView';
import { ChatView } from './components/chat/ChatView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalAudioBar } from './components/common/GlobalAudioBar';
import { ToastContainer } from './components/common/ToastContainer';

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected album filter passed from AlbumsView to TracksView
  const [selectedAlbumForTracks, setSelectedAlbumForTracks] = useState<string | null>(null);

  // Trigger create modals from header or dashboard
  const [createModalTrigger, setCreateModalTrigger] = useState<{
    open: boolean;
    type?: 'album' | 'track' | 'singer' | 'organization' | 'playlist';
  }>({ open: false });

  const handleOpenCreateModal = (type?: 'album' | 'track' | 'singer' | 'organization' | 'playlist') => {
    if (type) {
      if (type === 'album') setActiveTab('albums');
      else if (type === 'track') setActiveTab('tracks');
      else if (type === 'singer') setActiveTab('singers');
      else if (type === 'organization') setActiveTab('organizations');
      else if (type === 'playlist') setActiveTab('playlists');
    }
    setCreateModalTrigger({ open: true, type });
  };

  const handleSelectAlbumForTracks = (albumId: string) => {
    setSelectedAlbumForTracks(albumId);
    setActiveTab('tracks');
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-[#ededed] font-sans antialiased selection:bg-[#3ecf8e] selection:text-black">
      {/* KodeKloud Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenCreateModal={
            ['albums', 'tracks', 'singers', 'organizations', 'playlists'].includes(activeTab)
              ? () => handleOpenCreateModal(activeTab as any)
              : undefined
          }
        />

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenCreateModal={handleOpenCreateModal}
            />
          )}

          {activeTab === 'albums' && (
            <AlbumsView
              searchTerm={searchTerm}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'album'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
              onSelectAlbumForTracks={handleSelectAlbumForTracks}
            />
          )}

          {activeTab === 'tracks' && (
            <TracksView
              searchTerm={searchTerm}
              selectedAlbumId={selectedAlbumForTracks}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'track'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
            />
          )}

          {activeTab === 'singers' && (
            <SingersView
              searchTerm={searchTerm}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'singer'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
            />
          )}

          {activeTab === 'organizations' && (
            <OrganizationsView
              searchTerm={searchTerm}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'organization'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsView
              searchTerm={searchTerm}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'playlist'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
            />
          )}

          {activeTab === 'chat' && <ChatView searchTerm={searchTerm} />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Embedded Audio Bar for Audio & Karaoke Playback */}
      <GlobalAudioBar />

      {/* Toast Notifications Container */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BackendProvider>
      <AdminApp />
    </BackendProvider>
  );
}
