import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { PresenceSnapshot, PresenceUser } from '../types';
import {
  api,
  getPresenceKey,
  getSocketBaseUrl,
} from '../services/api';
import { useBackend } from './BackendContext';

export type PresenceStatus =
  | 'connecting'
  | 'live'
  | 'polling'
  | 'demo'
  | 'offline';

interface PresenceContextType {
  users: PresenceUser[];
  count: number;
  status: PresenceStatus;
  generatedAt: string | null;
  simulated: boolean;
  /** Count exists but the backend does not publish identity details yet. */
  legacy: boolean;
  refresh: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

const POLL_MS = 15000;

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { apiUrl } = useBackend();
  const [snapshot, setSnapshot] = useState<PresenceSnapshot>({
    count: 0,
    users: [],
    generatedAt: '',
  });
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [simulated, setSimulated] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const applySnapshot = useCallback((next: PresenceSnapshot | null) => {
    if (!next || !Array.isArray(next.users)) return;
    setSnapshot(next);
    setSimulated(Boolean(next.simulated));
    setHasData(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await api.getPresence();
      applySnapshot(next);
    } catch {
      // Socket stream may still be healthy; polling is only a fallback.
    }
  }, [applySnapshot]);

  // REST fallback: keeps the list alive when WebSockets are blocked by a
  // proxy, and also provides the simulated stream in local mock mode.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await api.getPresence();
        if (!cancelled) applySnapshot(next);
      } catch {
        if (!cancelled) {
          setSnapshot((prev) => (prev.users.length ? prev : { ...prev, count: 0 }));
        }
      }
    };

    poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [apiUrl, applySnapshot]);

  // Live socket feed (admin-only room).
  useEffect(() => {
    const socket = io(getSocketBaseUrl(), {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      auth: {
        adminKey: getPresenceKey(),
      },
    });
    socketRef.current = socket;

    const handleUpdate = (payload: PresenceSnapshot) => {
      setIsSocketLive(true);
      applySnapshot(payload);
    };

    const handleCount = (count: number) => {
      if (typeof count !== 'number') return;
      setSnapshot((prev) =>
        prev.users.length
          ? { ...prev, count }
          : { count, users: [], generatedAt: new Date().toISOString() }
      );
    };

    const handleConnect = () => {
      setIsSocketLive(true);
      socket.emit('presence:watch');
    };

    const handleDisconnect = () => setIsSocketLive(false);
    const handleError = () => setIsSocketLive(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);
    socket.on('presence:update', handleUpdate);
    socket.on('presence:snapshot', handleUpdate);
    socket.on('online_count', handleCount);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.off('presence:update', handleUpdate);
      socket.off('presence:snapshot', handleUpdate);
      socket.off('online_count', handleCount);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiUrl, applySnapshot]);

  let status: PresenceStatus = 'connecting';
  if (simulated) status = 'demo';
  else if (isSocketLive) status = 'live';
  else if (hasData) status = 'polling';
  else status = 'offline';

  const legacy =
    !simulated && (snapshot.users?.length || 0) === 0 && (snapshot.count || 0) > 0;

  return (
    <PresenceContext.Provider
      value={{
        users: snapshot.users || [],
        count: snapshot.count || 0,
        status,
        generatedAt: snapshot.generatedAt || null,
        simulated,
        legacy,
        refresh,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return ctx;
};
