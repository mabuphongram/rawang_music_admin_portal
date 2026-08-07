import React, { useEffect, useState } from 'react';
import { ChatMessage, Track } from '../../types';
import { api } from '../../services/api';
import { useBackend } from '../../context/BackendContext';
import { MessageSquare, Send, Play, Info, User, Bot, Paperclip } from 'lucide-react';

interface ChatViewProps {
  searchTerm: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ searchTerm }) => {
  const { addToast, playTrack, refreshKey, triggerRefresh } = useBackend();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [senderName, setSenderName] = useState('Admin Operator');
  const [messageText, setMessageText] = useState('');
  const [attachedTrackId, setAttachedTrackId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchChatData = async () => {
    setIsLoading(true);
    try {
      const [m, t] = await Promise.all([api.getChatMessages(), api.getTracks()]);
      setMessages(m || []);
      setTracks(t || []);
    } catch (err: any) {
      addToast('error', `Failed to load chat feed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [refreshKey]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      addToast('warning', 'Sender name is required.');
      return;
    }

    const selectedTrack = tracks.find((t) => t.id === attachedTrackId);

    setIsSending(true);
    try {
      await api.sendChatMessage({
        senderName: senderName.trim(),
        message: messageText.trim(),
        timestamp: Date.now(),
        attachedTrackId: selectedTrack?.id,
        attachedTrackTitle: selectedTrack?.title,
        isUser: true,
      });

      setMessageText('');
      setAttachedTrackId('');
      addToast('success', 'Chat message posted.');
      triggerRefresh();
      fetchChatData();
    } catch (err: any) {
      addToast('error', `Post message error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.senderName.toLowerCase().includes(term) ||
      (m.message || '').toLowerCase().includes(term) ||
      (m.attachedTrackTitle || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6 text-[#ededed] max-w-5xl mx-auto">
      {/* Header Info Banner */}
      <div className="bg-[#1c1c1c] border border-[#282828] p-4 rounded flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#3ecf8e]" /> Admin Chat & System Broadcasts
          </h3>
          <p className="text-xs text-[#888888] mt-0.5">
            Read-only live message feed sorted by numeric timestamp ascending
          </p>
        </div>
      </div>

      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-3.5 text-xs text-[#888888] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3ecf8e] shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-bold text-white">Backend API Notice:</span> The chat backend endpoint (`GET & POST /chat/messages`) records broadcasts and feedback messages.
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="bg-[#1c1c1c] border border-[#282828] rounded p-6 shadow-sm space-y-4 min-h-[350px]">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#888888] animate-pulse font-mono">
            Fetching chat message stream...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#666666] font-mono">
            No chat messages recorded yet. Send a broadcast message below.
          </div>
        ) : (
          filteredMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex items-start gap-3.5 p-4 rounded border ${
                msg.isUser
                  ? 'bg-[#141414] border-[#282828]'
                  : 'bg-[#222222] border-[#282828]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold ${
                  msg.isUser
                    ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">{msg.senderName}</span>
                  <span className="text-[10px] font-mono text-[#666666]">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                  </span>
                </div>

                <p className="text-xs text-[#ededed] leading-relaxed font-sans">{msg.message}</p>

                {/* Attached Track Pill */}
                {msg.attachedTrackId && (
                  <div className="mt-3 pt-2 border-t border-[#282828] flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#888888]">Attached Track:</span>
                    <button
                      onClick={() => {
                        const trk = tracks.find((t) => t.id === msg.attachedTrackId);
                        if (trk) playTrack(trk);
                      }}
                      className="px-2.5 py-1 rounded bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 border border-[#3ecf8e]/30 text-[#3ecf8e] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-[#3ecf8e]" />
                      <span>{msg.attachedTrackTitle || 'Listen Track'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="bg-[#1c1c1c] border border-[#282828] rounded p-4 shadow-sm space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[#ededed] font-medium mb-1 font-mono">Sender Name</label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
            />
          </div>

          <div>
            <label className="block text-[#ededed] font-medium mb-1 font-mono">Attach Track</label>
            <select
              value={attachedTrackId}
              onChange={(e) => setAttachedTrackId(e.target.value)}
              className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#3ecf8e]"
            >
              <option value="">-- No Track Attachment --</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} - {t.artistName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <textarea
            rows={2}
            placeholder="Type your system announcement or internal message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full bg-[#141414] border border-[#282828] rounded p-3 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending}
            className="px-4 py-1.5 rounded bg-[#3ecf8e] hover:bg-[#34b27b] text-black text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Post Message
          </button>
        </div>
      </form>
    </div>
  );
};
