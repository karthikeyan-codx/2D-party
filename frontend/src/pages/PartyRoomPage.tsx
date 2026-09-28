import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { apiClient } from '../services/api/apiClient.js';
import { realtimeWs } from '../services/realtime/WebSocketClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';

export const PartyRoomPage: React.FC = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadRoom = async () => {
    if (!roomId) return;
    try {
      // Authoritative join on navigation
      const res = await apiClient.rooms.joinRoom(roomId);
      setRoom(res.room);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('full')) {
        setErrorMessage('Room is full.');
      } else {
        setErrorMessage(msg || 'Failed to enter room');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
    const interval = setInterval(async () => {
      if (!roomId || errorMessage) return;
      try {
        const res = await apiClient.rooms.getRoom(roomId);
        if (res.room) {
          setRoom((prev: any) => {
            if (!prev) return res.room;
            // Merge messages avoiding duplicates by id
            const existingIds = new Set((prev.messages || []).map((m: any) => m.id));
            const merged = [...(prev.messages || [])];
            for (const m of res.room.messages || []) {
              if (!existingIds.has(m.id)) {
                merged.push(m);
                existingIds.add(m.id);
              }
            }
            return {
              ...res.room,
              messages: merged,
            };
          });
        }
      } catch {
        // ignore
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [roomId, errorMessage]);

  // Subscribe to realtime room updates over WebSocket
  useEffect(() => {
    if (!roomId) return;

    realtimeWs.send({
      type: 'PARTY_ROOM_SUBSCRIBE' as any,
      payload: { roomId } as any,
    });

    const unsubscribe = realtimeWs.onMessage((msg: any) => {
      if (msg.type === 'PARTY_ROOM_STATE_UPDATED') {
        if (msg.payload?.room?.id === roomId) {
          setRoom((prev: any) => ({
            ...msg.payload.room,
            messages: prev?.messages || msg.payload.room.messages,
          }));
        }
      } else if (msg.type === 'PARTY_ROOM_CHAT_MESSAGE') {
        if (msg.payload?.roomId === roomId && msg.payload?.message) {
          const incoming = msg.payload.message;
          setRoom((prev: any) => {
            if (!prev) return prev;
            // Reconcile incoming message by ID or clientMessageId
            const alreadyExists = prev.messages?.some(
              (m: any) =>
                m.id === incoming.id ||
                (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId)
            );
            if (alreadyExists) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), incoming],
            };
          });
        }
      } else if (msg.type === 'GAME_START_REJECTED') {
        if (msg.payload?.roomId === roomId) {
          setErrorMessage(msg.payload.error || 'Game could not be started');
        }
      } else if (msg.type === 'PARTY_ROOM_GAME_LAUNCH') {
        if (msg.payload?.roomId === roomId) {
          navigate(
            msg.payload.route ||
              `/tic-tac-toe?source=party-room&partyRoomId=${roomId}&gameSessionId=${msg.payload.gameSessionId}`
          );
        }
      }
    });

    return () => {
      realtimeWs.send({
        type: 'PARTY_ROOM_UNSUBSCRIBE' as any,
        payload: { roomId } as any,
      });
      unsubscribe();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = room?.hostId === user?.id;
  const currentMember = room?.members?.find((m: any) => m.userId === user?.id);

  const handleToggleReady = async () => {
    if (!room || !user) return;
    const nextReady = !currentMember?.isReady;
    try {
      const res = await apiClient.rooms.setReady(room.id, nextReady);
      setRoom((prev: any) => (prev ? { ...prev, members: res.room.members } : res.room));

      realtimeWs.send({
        type: 'PARTY_ROOM_READY_TOGGLE' as any,
        payload: { roomId: room.id, userId: user.id, isReady: nextReady } as any,
      });
    } catch {
      // ignore
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    setErrorMessage(null);
    try {
      const res = await apiClient.rooms.startGame(room.id);
      setRoom(res.room);

      realtimeWs.send({
        type: 'PARTY_ROOM_START_GAME' as any,
        payload: { roomId: room.id, userId: user?.id } as any,
      });

      if (res.gameSession?.gameSessionId) {
        navigate(
          `/tic-tac-toe?source=party-room&partyRoomId=${room.id}&gameSessionId=${res.gameSession.gameSessionId}`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not start game');
    }
  };

  const handleLeave = async () => {
    if (!room) return;
    try {
      await apiClient.rooms.leaveRoom(room.id);
    } catch {
      // ignore
    }
    navigate('/rooms');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !room || !user) return;
    const content = chatMessage.trim();
    setChatMessage('');

    // Single source of truth: Send via WebSocket with unique clientMessageId
    const clientMessageId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    realtimeWs.send({
      type: 'PARTY_ROOM_CHAT_SEND' as any,
      payload: { roomId: room.id, userId: user.id, content, clientMessageId } as any,
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-black uppercase tracking-wider text-amber-400 animate-pulse">
        CONNECTING TO PARTY ROOM...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center animate-pop-in">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-base font-black text-rose-400 uppercase">
          {errorMessage || 'Room not found'}
        </h2>
        <p className="text-xs font-bold text-[var(--color-text-muted)] max-w-sm">
          {errorMessage === 'Room is full.'
            ? 'This party room has reached its maximum player capacity.'
            : 'You cannot enter this room at this time.'}
        </p>
        <ArcadeButton variant="amber" size="md" onClick={() => navigate('/rooms')}>
          RETURN TO ROOMS
        </ArcadeButton>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in text-left">
      {/* In-Room Alert / Validation Banner */}
      {errorMessage && (
        <div className="w-full p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-pop-in">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 cursor-pointer shadow-sm"
          >
            OK
          </button>
        </div>
      )}

      {/* Room Header Card */}
      <div className="p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-[var(--color-text)]">
              {room.name}
            </h1>
            <ArcadeBadge variant="amber">
              {room.gameId === 'tic-tac-toe' ? 'TIC TAC TOE' : room.gameId}
            </ArcadeBadge>
          </div>
          <span className="text-xs font-bold text-[var(--color-text-muted)]">
            Host: {room.members.find((m: any) => m.isHost)?.displayName} &bull; Capacity:{' '}
            {room.members.length} / {room.maxPlayers}
          </span>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl sm:text-2xl font-black px-4 py-1.5 rounded-2xl bg-[var(--color-card-inner)] border-2 border-amber-400 text-amber-400 tracking-widest shadow-inner">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            type="button"
            className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-700 hover:bg-slate-600 text-white shadow-[0_2px_0_#334155] cursor-pointer"
          >
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
        </div>
      </div>

      {/* Main Grid: Player Slots & Realtime Room Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player Slot Cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
              PARTY MEMBERS ({room.members.length} / {room.maxPlayers})
            </span>

            {isHost ? (
              <ArcadeButton
                id="btn-start-party-game"
                variant="amber"
                size="md"
                onClick={handleStartGame}
                icon="🚀"
              >
                START GAME
              </ArcadeButton>
            ) : (
              <ArcadeButton
                variant={currentMember?.isReady ? 'teal' : 'slate'}
                size="md"
                onClick={handleToggleReady}
              >
                {currentMember?.isReady ? '✓ READY!' : 'READY UP'}
              </ArcadeButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {room.members.map((member: any) => (
              <div
                key={member.userId}
                className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_4px_0_var(--color-card-shadow)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.displayName} src={member.avatarUrl} size="md" />
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-[var(--color-text)] truncate max-w-[120px]">
                        {member.displayName}
                      </span>
                      {member.isHost && (
                        <span className="text-[10px] text-amber-400" title="Room Host">
                          👑
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                      @{member.username}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    member.isReady
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {member.isReady ? 'READY' : 'WAITING'}
                </span>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, room.maxPlayers - room.members.length) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-4 rounded-3xl bg-[var(--color-card-inner)]/50 border-2 border-dashed border-[var(--color-border)]/50 flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider"
                >
                  + Open Slot {room.members.length + i + 1}
                </div>
              )
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleLeave}
              className="text-xs font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              LEAVE PARTY ROOM
            </button>
          </div>
        </div>

        {/* Right 1 Col: Realtime Room Chat */}
        <div className="h-[450px] p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col justify-between">
          <div className="pb-2 border-b border-[var(--color-border)]/50 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              ROOM CHAT
            </span>
            <span className="text-[10px] font-bold text-amber-400">REALTIME</span>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5">
            {room.messages?.map((m: any) => (
              <div key={m.id} className="flex flex-col text-left">
                <span className="text-[10px] font-black text-amber-400">
                  {m.userName}:
                </span>
                <span className="text-xs font-bold text-[var(--color-text)] bg-[var(--color-card-inner)] p-2 rounded-xl border border-[var(--color-border)]/50 mt-0.5">
                  {m.content}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Composer */}
          <form onSubmit={handleSendChatMessage} className="flex items-center gap-1.5 pt-2 border-t border-[var(--color-border)]/50">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Chat in room..."
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <ArcadeButton variant="amber" size="sm" type="submit">
              SEND
            </ArcadeButton>
          </form>
        </div>
      </div>
    </div>
  );
};
