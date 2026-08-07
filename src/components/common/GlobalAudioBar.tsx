import React, { useRef, useState, useEffect } from 'react';
import { useBackend } from '../../context/BackendContext';
import { resolveMediaUrl } from '../../services/api';
import {
  Play,
  Pause,
  Mic2,
  Volume2,
  VolumeX,
  X,
  Disc,
  Music2,
  Sparkles,
} from 'lucide-react';

export const GlobalAudioBar: React.FC = () => {
  const {
    activeTrack,
    isPlaying,
    isKaraokeMode,
    pauseTrack,
    togglePlay,
    toggleKaraoke,
  } = useBackend();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Determine active audio URL
  const audioSource = isKaraokeMode && activeTrack?.karaokeAudioUrl
    ? resolveMediaUrl(activeTrack.karaokeAudioUrl)
    : resolveMediaUrl(activeTrack?.audioUrl);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        pauseTrack();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioSource, pauseTrack]);

  if (!activeTrack) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || activeTrack.durationSeconds || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#171717] border-t border-[#282828] px-6 py-2.5 shadow-2xl transition-all">
      <audio
        ref={audioRef}
        src={audioSource}
        onTimeUpdate={handleTimeUpdate}
        onEnded={pauseTrack}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="w-8 h-8 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center shrink-0">
            <Disc className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#ededed] truncate">
                {activeTrack.title}
              </span>
              {isKaraokeMode && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] font-mono">
                  KARAOKE
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#888888] truncate font-mono">
              {activeTrack.artistName} • {activeTrack.albumName}
            </p>
          </div>
        </div>

        {/* Player Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1 w-full md:w-2/4 max-w-xl">
          <div className="flex items-center gap-3">
            {/* Karaoke Toggle */}
            <button
              onClick={toggleKaraoke}
              disabled={!activeTrack.hasKaraoke && !activeTrack.karaokeAudioUrl}
              className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                isKaraokeMode
                  ? 'bg-[#3ecf8e] text-black font-bold shadow-sm'
                  : 'bg-[#222222] text-[#888888] border border-[#333333] hover:text-[#ededed] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              title={
                activeTrack.hasKaraoke || activeTrack.karaokeAudioUrl
                  ? 'Toggle Karaoke Audio Track'
                  : 'No Karaoke Version Available'
              }
            >
              <Mic2 className="w-3 h-3" />
              <span>Karaoke</span>
            </button>

            {/* Play/Pause Button - Supabase Emerald */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-[#3ecf8e] hover:bg-[#34b27b] text-black flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black text-black" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-black text-black" />}
            </button>

            <div className="text-[11px] font-mono text-[#888888]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="w-full flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#3ecf8e]"
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          <div className="flex items-center gap-2 text-[#888888] hover:text-[#ededed]">
            <button onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#3ecf8e]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
