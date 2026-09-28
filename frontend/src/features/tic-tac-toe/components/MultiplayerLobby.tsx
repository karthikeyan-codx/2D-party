import React, { useState } from 'react';
import { ArcadeButton } from '../../../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../../../components/ui/ArcadeBadge.js';
import { MultiplayerSessionState } from '../session/WebSocketGameSession.js';

interface MultiplayerLobbyProps {
  multiplayer: MultiplayerSessionState;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onStartLocalMatch: (player1Name: string, player2Name: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  multiplayer,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  onStartLocalMatch,
}) => {
  const [displayName, setDisplayName] = useState('Player');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'local'>('create');

  // Local 2-Player Name Inputs
  const [localP1Name, setLocalP1Name] = useState('Player 1');
  const [localP2Name, setLocalP2Name] = useState('Player 2');

  const handleCopyCode = () => {
    if (multiplayer.roomId) {
      navigator.clipboard.writeText(multiplayer.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartLocal = () => {
    const p1 = localP1Name.trim() || 'Player 1';
    const p2 = localP2Name.trim() || 'Player 2';
    onStartLocalMatch(p1.slice(0, 18), p2.slice(0, 18));
  };

  const isBothConnected = Boolean(multiplayer.players.X?.connected && multiplayer.players.O?.connected);

  // Sub-state: Inside Online Room, waiting for 2nd player or ready to start
  if (multiplayer.roomId) {
    return (
      <div className="w-full max-w-[420px] mx-auto p-5 sm:p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] flex flex-col items-center gap-5 animate-pop-in">
        {/* Room Header */}
        <div className="flex flex-col items-center text-center gap-1 w-full border-b border-[var(--color-border)]/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
              ONLINE GAME ROOM
            </span>
            <ArcadeBadge variant="amber">BEST OF 5</ArcadeBadge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-2xl font-black px-4 py-1.5 rounded-xl bg-[var(--color-card-inner)] border-2 border-amber-400 text-amber-400 tracking-widest shadow-inner">
              {multiplayer.roomId}
            </span>
            <button
              onClick={handleCopyCode}
              type="button"
              className="arcade-btn px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-700 hover:bg-slate-600 text-white shadow-[0_2px_0_#334155] cursor-pointer"
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Players Matchup Cards */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Player X */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[#f04f65]/40 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#f04f65]/20 text-[#f04f65] font-black text-xl flex items-center justify-center">
                ✕
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">
                  PLAYER X {multiplayer.mySymbol === 'X' ? '(YOU)' : ''}
                </span>
                <span className="text-sm font-black text-[var(--color-text)]">
                  {multiplayer.players.X?.displayName || 'Host'}
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              READY
            </span>
          </div>

          {/* Player O */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[#31b2fc]/40 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#31b2fc]/20 text-[#31b2fc] font-black text-xl flex items-center justify-center">
                ◯
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">
                  PLAYER O {multiplayer.mySymbol === 'O' ? '(YOU)' : ''}
                </span>
                <span className="text-sm font-black text-[var(--color-text)]">
                  {multiplayer.players.O?.displayName || (
                    <span className="italic text-[var(--color-text-muted)]">Waiting for opponent...</span>
                  )}
                </span>
              </div>
            </div>
            {multiplayer.players.O?.connected ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                READY
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                WAITING
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Start Match or Waiting Instructions */}
        {isBothConnected ? (
          <div className="w-full flex flex-col items-center gap-2 pt-2">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
              ✓ Both Players Connected!
            </p>
            <ArcadeButton
              id="btn-start-match"
              variant="amber"
              size="lg"
              fullWidth
              onClick={onStartGame}
            >
              START MATCH
            </ArcadeButton>
          </div>
        ) : (
          <div className="w-full py-3 px-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center gap-2 text-xs font-bold text-amber-300 text-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <span>
              Share room code{' '}
              <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                {multiplayer.roomId}
              </strong>{' '}
              with a friend to join!
            </span>
          </div>
        )}

        {/* Leave Lobby Action */}
        <button
          id="btn-leave-lobby"
          type="button"
          onClick={onLeaveRoom}
          className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)] hover:text-rose-400 transition-colors py-1 cursor-pointer"
        >
          LEAVE ROOM
        </button>
      </div>
    );
  }

  // Sub-state: Game Mode Selection (CREATE ROOM, JOIN ROOM, LOCAL 2 PLAYER)
  return (
    <div className="w-full max-w-[420px] mx-auto p-5 sm:p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] flex flex-col gap-4 animate-pop-in">
      {/* Lobby Title */}
      <div className="flex flex-col items-center text-center gap-1 border-b border-[var(--color-border)]/60 pb-3">
        <h2 className="text-xl font-black uppercase tracking-widest text-[var(--color-text)]">
          TIC TAC TOE
        </h2>
        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Choose How To Play &bull; Best of 5
        </p>
      </div>

      {/* Mode Tabs: CREATE ROOM | JOIN ROOM | LOCAL 2 PLAYER */}
      <div className="flex rounded-xl bg-[var(--color-card-inner)] p-1 gap-1 border border-[var(--color-border)]/60">
        <button
          id="tab-create-room"
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'create'
              ? 'bg-[#f8a427] text-white shadow-[0_2px_0_#c97808]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          CREATE ROOM
        </button>
        <button
          id="tab-join-room"
          type="button"
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'join'
              ? 'bg-[#36b6ff] text-white shadow-[0_2px_0_#1988cc]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          JOIN ROOM
        </button>
        <button
          id="tab-local-2p"
          type="button"
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'local'
              ? 'bg-[#22c55e] text-white shadow-[0_2px_0_#15803d]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          LOCAL 2P
        </button>
      </div>

      {/* Tab Panel 1: CREATE ROOM */}
      {activeTab === 'create' && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-player-name-create"
              className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              YOUR PLAYER NAME
            </label>
            <input
              id="input-player-name-create"
              type="text"
              maxLength={18}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter player name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-sm font-black text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)] font-medium text-center">
            Host an online room, get a 6-character code, and play a best-of-5 series with a friend on another device.
          </p>
          <ArcadeButton
            id="btn-create-room-action"
            variant="amber"
            size="lg"
            fullWidth
            onClick={() => onCreateRoom(displayName)}
            disabled={multiplayer.connectionStatus !== 'connected'}
          >
            CREATE ROOM
          </ArcadeButton>
        </div>
      )}

      {/* Tab Panel 2: JOIN ROOM */}
      {activeTab === 'join' && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-player-name-join"
              className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              YOUR PLAYER NAME
            </label>
            <input
              id="input-player-name-join"
              type="text"
              maxLength={18}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter player name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-sm font-black text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="input-join-code"
              className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              ENTER 6-CHARACTER ROOM CODE
            </label>
            <input
              id="input-join-code"
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-base font-mono font-black tracking-widest text-center uppercase text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <ArcadeButton
            id="btn-join-room-action"
            variant="cyan"
            size="lg"
            fullWidth
            onClick={() => onJoinRoom(joinCode, displayName)}
            disabled={!joinCode.trim() || multiplayer.connectionStatus !== 'connected'}
          >
            JOIN ROOM
          </ArcadeButton>
        </div>
      )}

      {/* Tab Panel 3: LOCAL 2 PLAYER (Pass & Play on Same Device) */}
      {activeTab === 'local' && (
        <div className="flex flex-col gap-3.5 pt-1">
          <p className="text-xs text-[var(--color-text-muted)] font-medium text-center">
            Two players take turns on this same device. No room or internet required!
          </p>

          {/* Player 1 Card */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[#f04f65]/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#f04f65]">
                PLAYER 1 &bull; SYMBOL X
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#f04f65]/20 text-[#f04f65] font-black text-xs flex items-center justify-center">
                ✕
              </div>
            </div>
            <input
              id="input-local-p1-name"
              type="text"
              maxLength={18}
              value={localP1Name}
              onChange={(e) => setLocalP1Name(e.target.value)}
              placeholder="Player 1"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm font-black text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#f04f65]"
            />
          </div>

          {/* Player 2 Card */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[#31b2fc]/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#31b2fc]">
                PLAYER 2 &bull; SYMBOL O
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#31b2fc]/20 text-[#31b2fc] font-black text-xs flex items-center justify-center">
                ◯
              </div>
            </div>
            <input
              id="input-local-p2-name"
              type="text"
              maxLength={18}
              value={localP2Name}
              onChange={(e) => setLocalP2Name(e.target.value)}
              placeholder="Player 2"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm font-black text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#31b2fc]"
            />
          </div>

          <ArcadeButton
            id="btn-start-local-match"
            variant="amber"
            size="lg"
            fullWidth
            onClick={handleStartLocal}
          >
            START LOCAL MATCH
          </ArcadeButton>
        </div>
      )}

      {/* Error message if any */}
      {multiplayer.lastRejectReason && activeTab !== 'local' && (
        <div className="w-full py-2 px-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-black text-center">
          {multiplayer.lastRejectReason}
        </div>
      )}
    </div>
  );
};
