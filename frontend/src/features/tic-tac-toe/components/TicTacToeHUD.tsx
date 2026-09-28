import React from 'react';
import { Player, ScoreState } from '@games/tic-tac-toe/types/types';
import { ArcadeBadge } from '../../../components/ui/ArcadeBadge.js';
import { MultiplayerSessionState } from '../session/WebSocketGameSession.js';

interface TicTacToeHUDProps {
  isLocal: boolean;
  currentPlayer: Player;
  score: ScoreState;
  currentRound: number;
  maxRounds: number;
  isGameOver: boolean;
  winner: Player | null;
  playerXName: string;
  playerOName: string;
  winnerName?: string | null;
  multiplayer: MultiplayerSessionState;
  isMyTurn: boolean;
}

export const TicTacToeHUD: React.FC<TicTacToeHUDProps> = ({
  isLocal,
  currentPlayer,
  score,
  currentRound,
  maxRounds,
  isGameOver,
  winner,
  playerXName,
  playerOName,
  winnerName,
  multiplayer,
  isMyTurn,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col gap-2.5 sm:gap-3">
      {/* Header Level Ribbon & Match Stats */}
      <div className="flex items-center justify-between px-1">
        {/* Round Ribbon Badge - Strictly 1 .. 5 */}
        <ArcadeBadge variant="teal" ribbon>
          ROUND {Math.min(currentRound, maxRounds)} / {maxRounds}
        </ArcadeBadge>

        {/* Ties / Draws Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-black tracking-wider text-[var(--color-text-muted)]">
          <span>DRAWS:</span>
          <span className="text-[var(--color-text)] font-extrabold">{score.draws}</span>
        </div>
      </div>

      {/* Players vs Matchup HUD */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Player X / Player 1 Card */}
        <div
          className={`
            relative p-3 rounded-2xl border-2 transition-all duration-200 select-none flex items-center justify-between
            ${
              currentPlayer === 'X' && !isGameOver
                ? 'bg-[var(--color-card)] border-[#f04f65] shadow-[0_4px_0_#af2c3e] ring-2 ring-[#f04f65]/40'
                : 'bg-[var(--color-card)] border-[var(--color-border)] shadow-[0_3px_0_var(--color-card-shadow)] opacity-90'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f04f65]/15 border border-[#f04f65]/30 flex items-center justify-center text-[#f04f65] font-black text-lg shadow-inner">
              ✕
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">
                  {isLocal ? 'PLAYER 1' : 'PLAYER X'}
                </span>
                {!isLocal && multiplayer.mySymbol === 'X' && (
                  <span className="text-[8px] font-black px-1 rounded bg-[#f04f65]/20 text-[#f04f65]">
                    YOU
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate max-w-[75px] sm:max-w-none">
                {playerXName}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl sm:text-2xl font-black text-[#f04f65] leading-none">
              {score.x}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-[var(--color-text-muted)] tracking-widest uppercase">
              WINS
            </span>
          </div>
        </div>

        {/* Player O / Player 2 Card */}
        <div
          className={`
            relative p-3 rounded-2xl border-2 transition-all duration-200 select-none flex items-center justify-between
            ${
              currentPlayer === 'O' && !isGameOver
                ? 'bg-[var(--color-card)] border-[#31b2fc] shadow-[0_4px_0_#1888cc] ring-2 ring-[#31b2fc]/40'
                : 'bg-[var(--color-card)] border-[var(--color-border)] shadow-[0_3px_0_var(--color-card-shadow)] opacity-90'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#31b2fc]/15 border border-[#31b2fc]/30 flex items-center justify-center text-[#31b2fc] font-black text-lg shadow-inner">
              ◯
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">
                  {isLocal ? 'PLAYER 2' : 'PLAYER O'}
                </span>
                {!isLocal && multiplayer.mySymbol === 'O' && (
                  <span className="text-[8px] font-black px-1 rounded bg-[#31b2fc]/20 text-[#31b2fc]">
                    YOU
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate max-w-[75px] sm:max-w-none">
                {playerOName}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl sm:text-2xl font-black text-[#31b2fc] leading-none">
              {score.o}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-[var(--color-text-muted)] tracking-widest uppercase">
              WINS
            </span>
          </div>
        </div>
      </div>

      {/* Turn Status Banner */}
      <div className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] flex items-center justify-center gap-2 text-xs sm:text-sm font-black tracking-widest uppercase select-none">
        {!isLocal && multiplayer.matchStatus === 'OPPONENT_DISCONNECTED' ? (
          <span className="text-rose-400 animate-pulse">
            ⚠️ OPPONENT DISCONNECTED • WAITING TO RECONNECT
          </span>
        ) : isGameOver ? (
          winner ? (
            <span className="text-amber-400">
              🏆 ROUND WINNER: {winnerName ? winnerName.toUpperCase() : `PLAYER ${winner}`}
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              🤝 ROUND ENDED IN A DRAW
            </span>
          )
        ) : isLocal ? (
          currentPlayer === 'X' ? (
            <span className="text-[#f04f65] flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f04f65]" />
              👉 {playerXName.toUpperCase()}&apos;S TURN (X) &bull; TAP A TILE
            </span>
          ) : (
            <span className="text-[#31b2fc] flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#31b2fc]" />
              👉 {playerOName.toUpperCase()}&apos;S TURN (O) &bull; TAP A TILE
            </span>
          )
        ) : isMyTurn ? (
          <span className="text-emerald-400 flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            👉 YOUR TURN ({multiplayer.mySymbol}) &bull; TAP A TILE
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-ping" />
            ⏳ OPPONENT&apos;S TURN ({currentPlayer}) &bull; WAITING...
          </span>
        )}
      </div>
    </div>
  );
};
