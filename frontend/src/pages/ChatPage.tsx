import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { apiClient } from '../services/api/apiClient.js';
import { realtimeWs } from '../services/realtime/WebSocketClient.js';
import { Avatar } from '../components/ui/Avatar.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  clientMessageId?: string;
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  }>;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await apiClient.chat.getConversations();
      setConversations(res.conversations || []);
    } catch {
      // ignore
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const res = await apiClient.chat.getMessages(id);
      setMessages(res.messages || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Realtime incoming messages listener
  useEffect(() => {
    const unsubscribe = realtimeWs.onMessage((msg: any) => {
      if (msg.type === 'DIRECT_CHAT_RECEIVED') {
        const { conversationId: targetConvId, message: incoming } = msg.payload || {};
        if (targetConvId === conversationId && incoming) {
          setMessages((prev) => {
            const alreadyExists = prev.some(
              (m) =>
                m.id === incoming.id ||
                (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId)
            );
            if (alreadyExists) return prev;
            return [...prev, incoming];
          });
        }
        // Refresh conversations list to update preview
        loadConversations();
      }
    });

    return unsubscribe;
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const otherParticipant = activeConversation?.participants.find((p) => p.id !== user?.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    const clientMessageId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
      // Single source of truth: send via WebSocket with clientMessageId
      if (otherParticipant) {
        realtimeWs.send({
          type: 'DIRECT_CHAT_SEND' as any,
          payload: {
            conversationId,
            content,
            senderId: user?.id,
            targetUserId: otherParticipant.id,
            clientMessageId,
          } as any,
        });
      } else {
        // Fallback to REST API if no otherParticipant loaded yet
        const res = await apiClient.chat.sendMessage(conversationId, content, clientMessageId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id || m.clientMessageId === clientMessageId)) return prev;
          return [...prev, res.message];
        });
      }
      loadConversations();
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-[78vh] flex rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] overflow-hidden animate-pop-in">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`
          w-full md:w-80 border-r border-[var(--color-border)]/60 flex flex-col justify-between bg-[var(--color-card-inner)]
          ${conversationId ? 'hidden md:flex' : 'flex'}
        `}
      >
        <div className="p-4 border-b border-[var(--color-border)]/60 flex items-center justify-between text-left">
          <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
            DIRECT MESSAGES
          </span>
          <button
            onClick={() => navigate('/friends')}
            className="text-[10px] font-black uppercase text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            + NEW CHAT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {conversations.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-[var(--color-text-muted)]">
              No conversations yet. Start chatting from your Friends list!
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id);
              const isSelected = conv.id === conversationId;

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'bg-amber-400/15 border-amber-400 shadow-sm'
                      : 'bg-[var(--color-card)] border-[var(--color-border)]/50 hover:bg-[var(--color-card)]/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={other?.displayName || 'Player'}
                      src={other?.avatarUrl}
                      size="md"
                      status={other?.status || 'OFFLINE'}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--color-text)] truncate max-w-[120px]">
                        {other?.displayName}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)] truncate max-w-[120px]">
                        {conv.lastMessage?.content || 'Started chat'}
                      </span>
                    </div>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat or Empty Placeholder */}
      <div
        className={`
          flex-1 flex flex-col justify-between bg-[var(--color-card)]
          ${!conversationId ? 'hidden md:flex' : 'flex'}
        `}
      >
        {activeConversation && otherParticipant ? (
          <>
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-[var(--color-border)]/60 flex items-center justify-between bg-[var(--color-card-inner)]/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/chat')}
                  className="md:hidden text-xs font-black text-amber-400 pr-1 cursor-pointer"
                >
                  &larr; BACK
                </button>
                <Avatar
                  name={otherParticipant.displayName}
                  src={otherParticipant.avatarUrl}
                  size="sm"
                  status={otherParticipant.status}
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-black text-[var(--color-text)]">
                    {otherParticipant.displayName}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                    @{otherParticipant.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ArcadeButton
                  variant="amber"
                  size="sm"
                  onClick={() => navigate('/rooms')}
                >
                  INVITE TO ROOM
                </ArcadeButton>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-sm ${
                        isMine
                          ? 'bg-[#f8a427] text-slate-950 shadow-[0_2px_0_#c97808] rounded-br-xs'
                          : 'bg-[var(--color-card-inner)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[var(--color-border)]/60 bg-[var(--color-card-inner)]/40 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${otherParticipant.displayName}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <ArcadeButton variant="amber" size="sm" type="submit" disabled={isSending}>
                SEND
              </ArcadeButton>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <span className="text-4xl">💬</span>
            <h3 className="text-sm font-black uppercase text-[var(--color-text)]">
              SELECT A CONVERSATION
            </h3>
            <p className="text-xs font-medium text-[var(--color-text-muted)] max-w-sm">
              Pick a friend from the left sidebar or head over to your Friends tab to start a new chat.
            </p>
            <button
              onClick={() => navigate('/friends')}
              className="px-4 py-2 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs uppercase shadow-[0_2px_0_#b27406] cursor-pointer"
            >
              BROWSE FRIENDS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
