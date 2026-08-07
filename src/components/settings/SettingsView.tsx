import React, { useState } from 'react';
import { useBackend } from '../../context/BackendContext';
import { api } from '../../services/api';
import {
  Settings,
  Server,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Database,
  Info,
  Layers,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    apiUrl,
    setApiUrl,
    minioPrefix,
    setMinioPrefix,
    healthStatus,
    checkBackendHealth,
    addToast,
  } = useBackend();

  const [inputApiUrl, setInputApiUrl] = useState(apiUrl);
  const [inputMinioPrefix, setInputMinioPrefix] = useState(minioPrefix);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setApiUrl(inputApiUrl.trim());
    setMinioPrefix(inputMinioPrefix.trim());
    addToast('success', 'Backend settings updated.');
    checkBackendHealth();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.checkHealth(inputApiUrl.trim());
      setTestResult({
        success: true,
        message: `Connected successfully! Health status: "${res.status}"`,
      });
      addToast('success', 'Health check succeeded');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message}`,
      });
      addToast('error', 'Health check failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToDefault = () => {
    const defaultUrl = '/api';
    const defaultMinio = '';
    setInputApiUrl(defaultUrl);
    setInputMinioPrefix(defaultMinio);
    setApiUrl(defaultUrl);
    setMinioPrefix(defaultMinio);
    addToast('info', 'Reset settings to default embedded server configuration.');
    checkBackendHealth();
  };

  return (
    <div className="p-6 space-y-6 text-[#ededed] max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#1c1c1c] border border-[#282828] p-4 rounded flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#3ecf8e]" /> Backend API & MinIO Storage Configuration
          </h3>
          <p className="text-xs text-[#888888] mt-0.5 font-mono">
            Configure target base URL (`VITE_API_URL`) and MinIO media URL prefix (`VITE_MINIO_PREFIX`)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
              healthStatus === 'ok'
                ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {healthStatus === 'ok' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            {healthStatus === 'ok' ? 'HEALTH OK' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-[#1c1c1c] border border-[#282828] rounded p-6 shadow-sm space-y-6"
      >
        <div className="space-y-4">
          {/* API Base URL */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#ededed] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#3ecf8e]" /> API Base URL (VITE_API_URL)
              </span>
              <span className="text-[10px] font-mono text-[#666666]">
                Default: http://localhost:5000/api
              </span>
            </label>
            <input
              type="text"
              required
              value={inputApiUrl}
              onChange={(e) => setInputApiUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000/api or /api"
              className="w-full bg-[#141414] border border-[#282828] rounded p-3 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e] font-mono"
            />
            <p className="text-[11px] text-[#888888] font-mono mt-1">
              Point to your local Express backend server (`http://localhost:5000/api`) or keep `/api` to use the embedded mock server.
            </p>
          </div>

          {/* MinIO Object Prefix */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#ededed] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#3ecf8e]" /> MinIO Public URL Prefix (VITE_MINIO_PREFIX)
              </span>
              <span className="text-[10px] font-mono text-[#666666]">
                Default: http://localhost:9000/rawang-bucket
              </span>
            </label>
            <input
              type="text"
              value={inputMinioPrefix}
              onChange={(e) => setInputMinioPrefix(e.target.value)}
              placeholder="e.g. http://localhost:9000/rawang-bucket"
              className="w-full bg-[#141414] border border-[#282828] rounded p-3 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e] font-mono"
            />
            <p className="text-[11px] text-[#888888] font-mono mt-1">
              Used to resolve object keys (e.g. `albums/albumId/cover.jpg`) into publicly accessible image/audio URLs.
            </p>
          </div>
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div
            className={`p-3.5 rounded border text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#3ecf8e]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-mono">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#282828] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#ededed] text-xs font-mono transition-colors"
          >
            Reset to Embedded Mode
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-1.5 rounded bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-[#3ecf8e] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Test GET /health</span>
            </button>

            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      </form>

      {/* Backend Contract Architectural Summary Card */}
      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 space-y-4">
        <h4 className="text-sm font-mono font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" /> Backend Specification Checklist
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#ededed]">
          <div className="p-3 bg-[#141414] rounded border border-[#282828] space-y-1">
            <div className="font-mono font-bold text-[#3ecf8e]">Albums & Tracks</div>
            <p className="text-[#888888] text-[11px]">
              Supports multipart form uploads with coverImage, audioUrl, and optional karaokeAudioUrl.
            </p>
          </div>

          <div className="p-3 bg-[#141414] rounded border border-[#282828] space-y-1">
            <div className="font-mono font-bold text-[#3ecf8e]">Singers & Organizations</div>
            <p className="text-[#888888] text-[11px]">
              Full CRUD endpoints with avatar uploads and name descriptions.
            </p>
          </div>

          <div className="p-3 bg-[#141414] rounded border border-[#282828] space-y-1">
            <div className="font-mono font-bold text-purple-400">Playlists & Chat</div>
            <p className="text-[#888888] text-[11px]">
              Populated tracks inspector (`/playlists/:id/tracks`) and read-only chat feed stream.
            </p>
          </div>

          <div className="p-3 bg-[#141414] rounded border border-[#282828] space-y-1">
            <div className="font-mono font-bold text-amber-400">Delete Restrictions</div>
            <p className="text-[#888888] text-[11px]">
              Backend does not cascade delete related items or MinIO objects. Confirm dialogs include explicit notices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
