import React, { useEffect, useState } from 'react';
import { BackendProvider } from './context/BackendContext';
import { PresenceProvider } from './context/PresenceContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { LiveUsersView } from './components/live/LiveUsersView';
import { AlbumsView } from './components/albums/AlbumsView';
import { TracksView } from './components/tracks/TracksView';
import { SingersView } from './components/singers/SingersView';
import { OrganizationsView } from './components/organizations/OrganizationsView';
import { HeroSlidesView } from './components/heroslides/HeroSlidesView';
import { VideosView } from './components/videos/VideosView';
import { ContributionsView } from './components/contributions/ContributionsView';
import { OwnerRequestsView } from './components/requests/OwnerRequestsView';
import { OwnershipView } from './components/ownership/OwnershipView';
import { UsersView } from './components/users/UsersView';
import { ChatView } from './components/chat/ChatView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalAudioBar } from './components/common/GlobalAudioBar';
import { ToastContainer } from './components/common/ToastContainer';

const NAV_TABS: NavTab[] = [
  'dashboard',
  'live',
  'albums',
  'tracks',
  'singers',
  'organizations',
  'heroslides',
  'videos',
  'contributions',
  'requests',
  'ownership',
  'users',
  'chat',
  'reports',
  'settings',
];

function tabFromHash(): NavTab {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return NAV_TABS.includes(hash as NavTab) ? (hash as NavTab) : 'dashboard';
}

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => tabFromHash());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (window.location.hash !== `#${activeTab}`) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // Selected album filter passed from AlbumsView to TracksView
  const [selectedAlbumForTracks, setSelectedAlbumForTracks] = useState<string | null>(null);

  // Trigger create modals from header or dashboard
  const [createModalTrigger, setCreateModalTrigger] = useState<{
    open: boolean;
    type?: 'album' | 'track' | 'singer' | 'organization' | 'heroslide';
  }>({ open: false });

  const handleOpenCreateModal = (type?: 'album' | 'track' | 'singer' | 'organization' | 'heroslide' | 'users') => {
    if (type) {
      if (type === 'album') setActiveTab('albums');
      else if (type === 'track') setActiveTab('tracks');
      else if (type === 'singer') setActiveTab('singers');
      else if (type === 'organization') setActiveTab('organizations');
      else if (type === 'heroslide') setActiveTab('heroslides');
      else if (type === 'users') setActiveTab('users');
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
            ['albums', 'tracks', 'singers', 'organizations', 'heroslides'].includes(activeTab)
              ? () => handleOpenCreateModal(activeTab === 'heroslides' ? 'heroslide' : (activeTab as any))
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

          {activeTab === 'live' && <LiveUsersView searchTerm={searchTerm} />}

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

          {activeTab === 'heroslides' && (
            <HeroSlidesView
              searchTerm={searchTerm}
              isCreateOpen={createModalTrigger.open && createModalTrigger.type === 'heroslide'}
              onCloseCreate={() => setCreateModalTrigger({ open: false })}
            />
          )}

          {activeTab === 'videos' && <VideosView searchTerm={searchTerm} />}

          {activeTab === 'contributions' && <ContributionsView searchTerm={searchTerm} />}

          {activeTab === 'requests' && <OwnerRequestsView searchTerm={searchTerm} />}

          {activeTab === 'ownership' && <OwnershipView searchTerm={searchTerm} />}

          {activeTab === 'users' && <UsersView searchTerm={searchTerm} />}

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
      <PresenceProvider>
        <AdminApp />
      </PresenceProvider>
    </BackendProvider>
  );
}
