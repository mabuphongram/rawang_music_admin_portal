import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Track } from '../types';
import { api, getApiBaseUrl, getMinioPrefix } from '../services/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface BackendContextType {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  minioPrefix: string;
  setMinioPrefix: (prefix: string) => void;
  healthStatus: 'checking' | 'ok' | 'error';
  checkBackendHealth: () => Promise<void>;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  // Audio Player State
  activeTrack: Track | null;
  isPlaying: boolean;
  isKaraokeMode: boolean;
  playTrack: (track: Track, karaoke?: boolean) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  toggleKaraoke: () => void;
  // Global refresh triggers
  refreshKey: number;
  triggerRefresh: () => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiUrl, setApiUrlState] = useState<string>(getApiBaseUrl());
  const [minioPrefix, setMinioPrefixState] = useState<string>(getMinioPrefix());
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Audio player
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isKaraokeMode, setIsKaraokeMode] = useState<boolean>(false);

  // Refresh key
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkBackendHealth = useCallback(async () => {
    setHealthStatus('checking');
    try {
      await api.checkHealth();
      setHealthStatus('ok');
    } catch {
      setHealthStatus('error');
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [apiUrl, checkBackendHealth]);

  const setApiUrl = (url: string) => {
    localStorage.setItem('RAWANG_API_URL', url);
    setApiUrlState(url);
    addToast('info', `Backend API URL updated to ${url}`);
  };

  const setMinioPrefix = (prefix: string) => {
    localStorage.setItem('RAWANG_MINIO_PREFIX', prefix);
    setMinioPrefixState(prefix);
    addToast('info', 'MinIO object URL prefix updated');
  };

  const playTrack = (track: Track, karaoke = false) => {
    setActiveTrack(track);
    setIsKaraokeMode(karaoke);
    setIsPlaying(true);
    addToast('info', `Playing: ${track.title} ${karaoke ? '(Karaoke Instrument)' : ''}`);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const toggleKaraoke = () => {
    if (!activeTrack) return;
    if (!activeTrack.hasKaraoke && !activeTrack.karaokeAudioUrl) {
      addToast('warning', 'This track does not have a karaoke audio version');
      return;
    }
    setIsKaraokeMode((prev) => !prev);
    addToast('info', isKaraokeMode ? 'Switched to Original Vocal Track' : 'Switched to Karaoke Track');
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <BackendContext.Provider
      value={{
        apiUrl,
        setApiUrl,
        minioPrefix,
        setMinioPrefix,
        healthStatus,
        checkBackendHealth,
        toasts,
        addToast,
        removeToast,
        activeTrack,
        isPlaying,
        isKaraokeMode,
        playTrack,
        pauseTrack,
        togglePlay,
        toggleKaraoke,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const ctx = useContext(BackendContext);
  if (!ctx) {
    throw new Error('useBackend must be used within BackendProvider');
  }
  return ctx;
};
