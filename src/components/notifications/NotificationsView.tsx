import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { PushBroadcastResult, PushNotificationStatus } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  Lock,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Smartphone,
  Users,
} from 'lucide-react';

interface BroadcastHistoryItem extends PushBroadcastResult {
  title: string;
  body: string;
  sentAt: string;
}

const TITLE_LIMIT = 120;
const BODY_LIMIT = 500;

const TEMPLATES = [
  {
    label: 'New release',
    title: 'New music on Rawang Melodies',
    body: 'A new song has just been added. Open the app to listen now.',
  },
  {
    label: 'Karaoke',
    title: 'New karaoke track available',
    body: 'A new karaoke version is ready. Sing along in Rawang Melodies.',
  },
  {
    label: 'Community',
    title: 'Rawang Melodies update',
    body: 'Fresh cultural music is waiting for you. Open the app to explore.',
  },
];

export const NotificationsView: React.FC = () => {
  const { addToast } = useBackend();

  const [status, setStatus] = useState<PushNotificationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setStatusError('');
    try {
      const data = await api.getNotificationStatus();
      setStatus(data);
    } catch (err: any) {
      setStatus(null);
      setStatusError(err.message || 'Failed to read notification status');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isConfigured = Boolean(status?.configured);
  const canSend =
    isConfigured &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.length <= TITLE_LIMIT &&
    body.length <= BODY_LIMIT &&
    !isSending;

  const handleRequestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      addToast('error', 'Push notifications are not configured on the backend.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      addToast('warning', 'A title and message body are required.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    try {
      const result = await api.sendBroadcastNotification({
        title: cleanTitle,
        body: cleanBody,
      });
      setHistory((prev) => [
        {
          ...result,
          title: cleanTitle,
          body: cleanBody,
          sentAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 6));
      setTitle('');
      setBody('');
      setIsConfirmOpen(false);
      addToast('success', 'Push notification sent to all subscribed devices.');
    } catch (err: any) {
      addToast('error', `Notification send error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    setTitle(template.title);
    setBody(template.body);
  };

  return (
    <div className="p-6 space-y-6 text-[#ededed] max-w-6xl mx-auto">
      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white">
              Android push broadcast
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Sends an instant notification through Firebase Cloud Messaging to every device subscribed to the app topic.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingStatus ? (
            <span className="px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Firebase
            </span>
          ) : isConfigured ? (
            <span className="px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Not configured
            </span>
          )}
          <button
            type="button"
            onClick={loadStatus}
            disabled={isLoadingStatus}
            className="p-1.5 rounded bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition-colors disabled:opacity-50"
            title="Refresh notification status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono">
            <strong>Status check failed:</strong> {statusError}
          </span>
        </div>
      )}

      {!isLoadingStatus && !statusError && !isConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-xs text-amber-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono">
            <strong>Firebase is not ready.</strong> Add the service account JSON path to the backend
            environment and restart the API before broadcasting.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <form onSubmit={handleRequestSend} className="bg-[#1c1c1c] border border-[#282828] rounded">
          <div className="p-4 border-b border-[#282828] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#3ecf8e]" /> Compose broadcast
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Keep it short and useful. This cannot be recalled after it is sent.
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="push-title" className="text-xs font-mono font-bold text-[#a1a1a1]">
                  Title
                </label>
                <span className={`text-[10px] font-mono ${title.length > TITLE_LIMIT ? 'text-red-400' : 'text-[#666666]'}`}>
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
              <input
                id="push-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_LIMIT}
                placeholder="New music on Rawang Melodies"
                className="w-full bg-[#121212] border border-[#333333] rounded px-3 py-2 text-sm text-[#ededed] placeholder:text-[#555555] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="push-body" className="text-xs font-mono font-bold text-[#a1a1a1]">
                  Message
                </label>
                <span className={`text-[10px] font-mono ${body.length > BODY_LIMIT ? 'text-red-400' : 'text-[#666666]'}`}>
                  {body.length}/{BODY_LIMIT}
                </span>
              </div>
              <textarea
                id="push-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BODY_LIMIT}
                rows={6}
                placeholder="A new song has just been added. Open the app to listen now."
                className="w-full resize-y bg-[#121212] border border-[#333333] rounded px-3 py-2 text-sm text-[#ededed] placeholder:text-[#555555] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              />
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-[#666666] uppercase tracking-wider mb-2">
                Quick templates
              </p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#222222] border border-[#333333] text-[#a1a1a1] hover:text-[#ededed] hover:border-[#3ecf8e]/40 transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-[11px] text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-mono">
                This delivers immediately to all subscribed Android devices. Make sure the message is ready before sending.
              </span>
            </div>
          </div>

          <div className="p-4 border-t border-[#282828] flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-[#666666] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Topic broadcast
            </span>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold bg-[#3ecf8e] text-black hover:bg-[#35b97f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Send to all users'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-[#1c1c1c] border border-[#282828] rounded p-5">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-[#3ecf8e]" /> Device preview
            </h3>
            <div className="rounded-[26px] border-4 border-[#2a2a2a] bg-black p-2.5 shadow-2xl max-w-[320px] mx-auto">
              <div className="rounded-[18px] bg-gradient-to-b from-[#1d1d1d] to-[#0f0f0f] px-3 py-4 min-h-[260px]">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#777777] mb-4">
                  <span>9:41</span>
                  <span>Rawang</span>
                </div>
                <div className="rounded-xl bg-[#2a2a2a]/95 border border-white/10 p-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#3ecf8e] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">
                          Rawang Melodies
                        </span>
                        <span className="text-[9px] text-white/40 shrink-0">now</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-1">
                        {title.trim() || 'Notification title'}
                      </p>
                      <p className="text-[11px] leading-snug text-white/70 mt-0.5 break-words">
                        {body.trim() || 'Your message will appear here for every subscribed Android device.'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-center text-[#555555] font-mono mt-5">
                  Android notification shade
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-[#3ecf8e]" /> Delivery details
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#888888]">Audience</span>
                <span className="font-mono text-[#ededed] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#666666]" /> All subscribed
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#888888]">Topic</span>
                <span className="font-mono text-[#3ecf8e]">{status?.topic || 'all_users'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#888888]">Channel</span>
                <span className="font-mono text-[#ededed]">rawang_updates</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#888888]">Platform</span>
                <span className="font-mono text-[#ededed]">Android</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c1c] border border-[#282828] rounded p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#3ecf8e]" /> Sent this session
              </h3>
              <span className="text-[10px] font-mono text-[#666666]">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[#666666] font-mono">
                No broadcasts sent from this browser session yet.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={`${item.messageId}-${item.sentAt}`} className="bg-[#171717] border border-[#282828] rounded p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#ededed] truncate">{item.title}</p>
                      <span className="text-[10px] font-mono text-[#666666] shrink-0">
                        {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#888888] line-clamp-2 mt-0.5">{item.body}</p>
                    <p className="text-[9px] font-mono text-[#555555] truncate mt-1.5" title={item.messageId}>
                      {item.messageId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Send push notification?"
        message={`This will immediately notify every Android device subscribed to ${status?.topic || 'all_users'}.`}
        resourceType="broadcast"
        tone="green"
        confirmText="Send broadcast"
        note={null}
        isLoading={isSending}
        onConfirm={handleSend}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
