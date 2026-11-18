import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, Paperclip, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch, apiUpload } from '../../lib/api';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { ConversationRecord, ChatMessageRecord } from '../../types/platform';

export function MessagingFeature() {
  const { user, wsSocket, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const con = await apiFetch<{ conversations: ConversationRecord[] }>('/api/workspace/conversations');
      setConversations(con.conversations);
      if (con.conversations.length > 0 && !selectedConvoId) {
        setSelectedConvoId(con.conversations[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load channels.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConvoId, showToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (convoId: number) => {
      try {
        const res = await apiFetch<{ messages: ChatMessageRecord[] }>(
          `/api/workspace/conversations/${convoId}/messages`
        );
        setMessages(res.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to load chat history.', 'error');
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!selectedConvoId) return;
    loadMessages(selectedConvoId);

    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      wsSocket.send(JSON.stringify({ type: 'room:join', conversationId: selectedConvoId }));
    }

    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          event?: string;
          data?: ChatMessageRecord & { conversationId?: number; id?: number };
        };
        if (payload.event === 'chat:message' && payload.data?.conversation_id === selectedConvoId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.data!.id)) return prev;
            return [...prev, payload.data as ChatMessageRecord];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
        } else if (payload.event === 'chat:deleted' && payload.data?.conversationId === selectedConvoId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.data!.id ? { ...m, is_deleted: 1, body: '[Message removed]' } : m))
          );
        }
      } catch {
        // Ignore malformed payload
      }
    };

    wsSocket?.addEventListener('message', onMessage);
    return () => {
      wsSocket?.removeEventListener('message', onMessage);
    };
  }, [selectedConvoId, wsSocket, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvoId || sendingChat) return;
    if (!chatText.trim() && !chatFile) return;

    setSendingChat(true);
    try {
      const fd = new FormData();
      if (chatText.trim()) fd.append('body', chatText.trim());
      if (chatFile) fd.append('attachment', chatFile);

      const data = await apiUpload<{ message?: ChatMessageRecord }>(
        `/api/workspace/conversations/${selectedConvoId}/messages`,
        fd
      );

      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message!.id)) return prev;
          return [...prev, data.message!];
        });
      }
      setChatText('');
      setChatFile(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send message.', 'error');
    } finally {
      setSendingChat(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    try {
      await apiFetch(`/api/workspace/messages/${msgId}`, { method: 'DELETE' });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, is_deleted: 1, body: '[Message removed]' } : m)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cannot remove message.', 'error');
    }
  };

  if (!user) return null;
  if (loading && conversations.length === 0) return <LoadingSkeleton rows={2} />;

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-[#262B38] space-y-1">
        <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          WEBSOCKET PROJECT COMMUNICATION
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No active chat channels"
          description="Project chat channels become active automatically as soon as a project workspace is created."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 space-y-2">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                type="button"
                onClick={() => setSelectedConvoId(convo.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors space-y-1 ${
                  selectedConvoId === convo.id
                    ? 'bg-[#1A1E28] border-[#00BFFF]'
                    : 'bg-[#13161D] border-[#262B38] hover:border-[#2B3140]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#00BFFF] tabular-nums">{convo.project_code}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      convo.channel_type === 'internal_team'
                        ? 'bg-[#ED1C24]/20 text-[#ED1C24]'
                        : 'bg-[#00CC66]/15 text-[#00CC66]'
                    }`}
                  >
                    {convo.channel_type === 'internal_team' ? 'Internal Team' : 'Client & Team'}
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate">{convo.project_title}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-[#13161D] border border-[#262B38] rounded-lg flex flex-col h-[68dvh] max-h-[560px] min-h-[380px]">
            <div className="p-3.5 border-b border-[#262B38] flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white truncate">
                {conversations.find((c) => c.id === selectedConvoId)?.title || 'Project Channel'}
              </p>
              <span className="font-mono text-[11px] text-[#00CC66] shrink-0">Real-Time</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs text-[#CCCCCC] text-center py-8">No messages yet in this room.</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_user_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg border max-w-[88%] space-y-1.5 ${
                        isMine
                          ? 'ml-auto bg-[#1A1E28] border-[#00BFFF]/40'
                          : 'mr-auto bg-[#0B0D11] border-[#262B38]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] text-[#00BFFF]">{msg.sender_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#C0C0C0] tabular-nums">
                            {msg.created_at.slice(0, 16).replace('T', ' ')}
                          </span>
                          {(isMine || user.roles.includes('admin')) && !msg.is_deleted && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[#CCCCCC] hover:text-[#ED1C24]"
                              title="Remove message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#F4F6F9] leading-relaxed break-words">{msg.body}</p>
                      {msg.attachment_id && !msg.is_deleted && (
                        <a
                          href={`/api/attachments/${msg.attachment_id}`}
                          className="inline-flex items-center gap-1.5 text-[11px] text-[#00BFFF] hover:underline"
                        >
                          <Download className="w-3 h-3" />
                          {msg.attachment_name || 'Download Attachment'}
                        </a>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#262B38] space-y-2">
              {chatFile && (
                <div className="flex items-center justify-between text-xs bg-[#1A1E28] px-3 py-1.5 rounded">
                  <span className="text-[#00BFFF] truncate">{chatFile.name}</span>
                  <button type="button" onClick={() => setChatFile(null)} className="text-[#ED1C24]">
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="min-w-[44px] min-h-[44px] rounded-lg bg-[#1A1E28] border border-[#2B3140] flex items-center justify-center cursor-pointer hover:border-[#00BFFF] shrink-0">
                  <Paperclip className="w-4 h-4 text-[#CCCCCC]" />
                  <input type="file" onChange={(e) => setChatFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 min-w-0 min-h-[44px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingChat}
                  className="min-h-[44px] px-4 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
