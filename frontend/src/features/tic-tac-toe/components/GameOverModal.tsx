import React from 'react';
import { ScoreState, WinLine } from '@games/tic-tac-toe/types/types';
import { ArcadeButton } from '../../../components/ui/ArcadeButton.js';
import { PlayerPerspective, SeriesPerspective } from '../hooks/useTicTacToe.js';

interface GameOverModalProps {
  isOpen: boolean;
  isLocal: boolean;
  matchStatus: string;
  currentRound: number;
  maxRounds: number;
  score: ScoreState;
  roundPerspective: PlayerPerspective;
  seriesPerspective: SeriesPerspective;
  player1Name?: string;
  player2Name?: string;
  localWinnerName?: string | null;
  localChampionName?: string | null;
  totalTurns: number;
  winningLine: WinLine | null;
  isOpponentWaiting: boolean;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isLocal,
  matchStatus,
  currentRound,
  score,
  roundPerspective,
  seriesPerspective,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  localWinnerName,
  localChampionName,
  totalTurns,
  isOpponentWaiting,
  onNextRound,
  onPlayAgain,
  onReturnToLobby,
}) => {
  if (!isOpen) return null;

  const isMatchComplete = matchStatus === 'MATCH_COMPLETE';

  // Determine Titles and Subtitles based on Local vs Online mode
  let title = 'ROUND OVER';
  let subtitle = `Round ${currentRound} of 5 Completed`;
  let isWin = false;
  let isDefeat = false;

  if (isLocal) {
    if (isMatchComplete) {
      if (localChampionName) {
        title = 'MATCH COMPLETE';
        subtitle = `${localChampionName.toUpperCase()} IS THE CHAMPION!`;
        isWin = true;
      } else {
        title = 'MATCH DRAW';
        subtitle = 'The series ended in a tie.';
      }
    } else {
      if (localWinnerName) {
        title = 'VICTORY!';
        subtitle = `${localWinnerName} won the round.`;
        isWin = true;
      } else {
        title = 'ROUND DRAW';
        subtitle = 'No player won this round.';
      }
    }
  } else {
    // Online Multiplayer
    if (isMatchComplete) {
      if (seriesPerspective === 'MATCH_VICTORY') {
        title = 'MATCH VICTORY!';
        subtitle = 'You won the best-of-5 series!';
        isWin = true;
      } else if (seriesPerspective === 'MATCH_DEFEAT') {
        title = 'MATCH DEFEAT';
        subtitle = 'Your opponent won the series.';
        isDefeat = true;
      } else {
        title = 'MATCH DRAW';
        subtitle = 'The series ended in a tie.';
      }
    } else {
      if (roundPerspective === 'VICTORY') {
        title = 'VICTORY!';
        subtitle = 'You completed 3 in a row!';
        isWin = true;
      } else if (roundPerspective === 'DEFEAT') {
        title = 'DEFEAT';
        subtitle = 'Your opponent won this round.';
        isDefeat = true;
      } else {
        title = 'ROUND DRAW';
        subtitle = 'No winner this round.';
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
      {/* Modal Container directly inspired by the BONUS card from the reference image */}
      <div className="relative w-full max-w-[340px] pt-8">
        {/* Triple Star Crest */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1.5 z-10 select-none">
          {/* Left star */}
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-base ${
              isWin
                ? 'bg-[#ffbf2b] border-amber-300 shadow-[0_3px_0_#c97808]'
                : isDefeat
                ? 'bg-[#5d688e] border-slate-400 shadow-[0_3px_0_#3c4566]'
                : 'bg-[#36b6ff] border-sky-300 shadow-[0_3px_0_#1988cc]'
            }`}
          >
            ★
          </div>
          {/* Center star (elevated) */}
          <div
            className={`w-12 h-12 -translate-y-2 rounded-full border-2 flex items-center justify-center text-white text-2xl ${
              isWin
                ? 'bg-[#ffbf2b] border-amber-300 shadow-[0_4px_0_#c97808] animate-bounce'
                : isDefeat
                ? 'bg-[#e74c60] border-rose-300 shadow-[0_4px_0_#af2c3e]'
                : 'bg-[#36b6ff] border-sky-300 shadow-[0_4px_0_#1988cc]'
            }`}
          >
            ★
          </div>
          {/* Right star */}
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-base ${
              isWin
                ? 'bg-[#ffbf2b] border-amber-300 shadow-[0_3px_0_#c97808]'
                : isDefeat
                ? 'bg-[#5d688e] border-slate-400 shadow-[0_3px_0_#3c4566]'
                : 'bg-[#36b6ff] border-sky-300 shadow-[0_3px_0_#1988cc]'
            }`}
          >
            ★
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-[var(--color-card)] rounded-3xl border-2 border-[var(--color-border)] shadow-[0_10px_0_var(--color-card-shadow)] p-6 pt-10 flex flex-col items-center text-center">
          {/* Title */}
          <h2
            className={`text-2xl font-black uppercase tracking-widest mb-1 ${
              isWin ? 'text-amber-400' : isDefeat ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {title}
          </h2>
          <p className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider uppercase mb-5">
            {subtitle}
          </p>

          {/* Score Box */}
          <div className="w-full py-4 px-4 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)] mb-5 flex flex-col items-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
              {isMatchComplete ? 'FINAL SERIES SCORE' : `SERIES SCORE (ROUND ${currentRound} OF 5)`}
            </span>

            <div className="flex items-center justify-center gap-4 my-1">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#f04f65] uppercase truncate max-w-[80px]">
                  {isLocal ? player1Name : 'X WINS'}
                </span>
                <span className="text-3xl font-black text-[#f04f65]">{score.x}</span>
              </div>
              <span className="text-2xl font-black text-[var(--color-text-muted)]">—</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#31b2fc] uppercase truncate max-w-[80px]">
                  {isLocal ? player2Name : 'O WINS'}
                </span>
                <span className="text-3xl font-black text-[#31b2fc]">{score.o}</span>
              </div>
            </div>

            <div className="w-full flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]/50 text-xs font-extrabold text-[var(--color-text-muted)]">
              <span>TURNS PLAYED</span>
              <span className="text-[var(--color-text)] font-black">{totalTurns}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            {isMatchComplete ? (
              <>
                <ArcadeButton
                  id="modal-btn-play-again"
                  variant="amber"
                  size="lg"
                  fullWidth
                  onClick={onPlayAgain}
                >
                  PLAY AGAIN
                </ArcadeButton>

                <ArcadeButton
                  id="modal-btn-return-lobby"
                  variant="slate"
                  size="md"
                  fullWidth
                  onClick={onReturnToLobby}
                >
                  {isLocal ? 'RETURN TO MODE SELECT' : 'RETURN TO LOBBY'}
                </ArcadeButton>
              </>
            ) : (
              <>
                {isOpponentWaiting ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black tracking-wider uppercase animate-pulse flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    WAITING FOR OPPONENT...
                  </div>
                ) : (
                  <ArcadeButton
                    id="modal-btn-next-round"
                    variant="teal"
                    size="lg"
                    fullWidth
                    onClick={onNextRound}
                  >
                    NEXT ROUND
                  </ArcadeButton>
                )}

                <button
                  id="modal-btn-leave-early"
                  type="button"
                  onClick={onReturnToLobby}
                  className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)] hover:text-rose-400 transition-colors py-1 cursor-pointer"
                >
                  {isLocal ? 'RETURN TO MODE SELECT' : 'LEAVE MATCH'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
