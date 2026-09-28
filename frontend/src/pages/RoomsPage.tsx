import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';

interface PartyRoomItem {
  id: string;
  code: string;
  name: string;
  gameId: string;
  hostId: string;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'CLOSED';
  members: any[];
}

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<PartyRoomItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGame, setSelectedGame] = useState('tic-tac-toe');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadRooms = async () => {
    try {
      const res = await apiClient.rooms.getRooms();
      setRooms(res.rooms || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await apiClient.rooms.createRoom({
        name: roomName || 'Arcade Party Room',
        gameId: selectedGame,
        maxPlayers,
      });
      setIsModalOpen(false);
      navigate(`/rooms/${res.room.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create room');
    }
  };

  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const handleEnterRoom = async (roomIdOrCode: string) => {
    if (!roomIdOrCode.trim()) return;
    const target = roomIdOrCode.trim();
    setJoiningRoomId(target);
    setErrorMessage(null);
    try {
      const res = await apiClient.rooms.joinRoom(target);
      if (res.room?.id) {
        navigate(`/rooms/${res.room.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Room is full.');
      loadRooms();
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    handleEnterRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[var(--color-text)]">
              PARTY ROOMS
            </h1>
            <ArcadeBadge variant="amber">2–8 PLAYERS</ArcadeBadge>
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Create or join multiplayer party lobbies to squad up before launching into matches
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <form onSubmit={handleJoinWithCode} className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="w-28 px-3 py-2 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-mono font-black tracking-widest text-center uppercase text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || Boolean(joiningRoomId)}
              className="px-3 py-2 rounded-2xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-black uppercase text-[var(--color-text)] cursor-pointer disabled:opacity-50"
            >
              {joiningRoomId === joinCode.trim().toUpperCase() ? '...' : 'JOIN'}
            </button>
          </form>

          <ArcadeButton
            variant="amber"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon="➕"
          >
            HOST ROOM
          </ArcadeButton>
        </div>
      </div>

      {/* Error / Full Room Alert */}
      {errorMessage && (
        <div className="w-full p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider flex items-center justify-between animate-pop-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-black px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.length === 0 ? (
          <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-8">
            <span className="text-4xl">🎪</span>
            <h3 className="text-sm font-black uppercase text-[var(--color-text)]">
              NO ACTIVE PARTY ROOMS
            </h3>
            <p className="text-xs font-medium text-[var(--color-text-muted)] max-w-sm">
              Be the first to host a party lobby and invite your friends for multiplayer games!
            </p>
            <ArcadeButton
              variant="amber"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              CREATE A ROOM
            </ArcadeButton>
          </div>
        ) : (
          rooms.map((room) => {
            const isPlaying = room.status === 'PLAYING';

            return (
              <div
                key={room.id}
                className="p-5 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col justify-between gap-4 select-none"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
                        {room.name}
                      </h3>
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30">
                        {room.code}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] mt-0.5">
                      Game: {room.gameId === 'tic-tac-toe' ? 'Tic Tac Toe' : room.gameId}
                    </span>
                  </div>

                  <ArcadeBadge variant={isPlaying ? 'coral' : 'teal'}>
                    {isPlaying ? 'PLAYING' : 'WAITING'}
                  </ArcadeBadge>
                </div>

                {/* Member Avatars */}
                <div className="flex items-center gap-2 py-2">
                  {room.members.map((m) => (
                    <Avatar key={m.userId} name={m.displayName} src={m.avatarUrl} size="sm" />
                  ))}
                  <span className="text-xs font-black text-[var(--color-text-muted)] pl-1">
                    {room.members.length} / {room.maxPlayers}
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                    Host: {room.members.find((m) => m.isHost)?.displayName || 'Host'}
                  </span>

                  <ArcadeButton
                    variant={room.members.length >= room.maxPlayers ? 'slate' : 'cyan'}
                    size="sm"
                    disabled={joiningRoomId === room.id}
                    onClick={() => handleEnterRoom(room.id)}
                  >
                    {joiningRoomId === room.id ? 'JOINING...' : room.members.length >= room.maxPlayers ? 'ROOM FULL' : 'ENTER ROOM'}
                  </ArcadeButton>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-[380px] p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_10px_0_var(--color-card-shadow)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-3">
              <span className="text-base font-black uppercase tracking-wider text-[var(--color-text)]">
                HOST PARTY ROOM
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-black text-[var(--color-text-muted)] hover:text-rose-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-black text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  ROOM NAME
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Squad Arcade Night"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  SELECT GAME
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="tic-tac-toe">Tic Tac Toe (2 Players)</option>
                  <option value="connect-4">Connect 4 (Coming Soon)</option>
                  <option value="ludo">Ludo (Coming Soon)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  MAX PLAYERS (2-8)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <ArcadeButton variant="amber" size="md" fullWidth type="submit">
                CREATE ROOM
              </ArcadeButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
