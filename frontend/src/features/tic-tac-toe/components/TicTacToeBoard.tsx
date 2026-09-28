import React from 'react';
import { Board, Player, WinLine } from '@games/tic-tac-toe/types/types';

interface TicTacToeBoardProps {
  board: Board;
  currentPlayer: Player;
  isGameOver: boolean;
  winningLine: WinLine | null;
  onCellClick: (index: number) => void;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  board,
  currentPlayer,
  isGameOver,
  winningLine,
  onCellClick,
}) => {
  const isWinningCell = (index: number): boolean => {
    return winningLine !== null && winningLine.includes(index);
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-[380px] sm:max-w-[400px] mx-auto p-3 sm:p-4 bg-[var(--color-card)] rounded-3xl border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)]">
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full aspect-square">
        {board.map((cell, index) => {
          const isWinner = isWinningCell(index);
          const isEmpty = cell === null;

          return (
            <button
              key={index}
              id={`tictactoe-cell-${index}`}
              aria-label={`Cell ${index + 1}, ${cell ? `occupied by ${cell}` : 'empty'}`}
              disabled={isGameOver || !isEmpty}
              onClick={() => onCellClick(index)}
              className={`
                group relative aspect-square rounded-2xl flex items-center justify-center font-arcade
                arcade-tile select-none cursor-pointer p-3 sm:p-4 focus:outline-none focus:ring-4 focus:ring-amber-400/50
                ${
                  isWinner
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_6px_0_#b27406] animate-win-glow z-10'
                    : 'bg-[var(--color-tile)] hover:bg-[var(--color-tile-hover)] border border-[var(--color-border)] shadow-[0_5px_0_var(--color-tile-shadow)]'
                }
                ${isEmpty && !isGameOver ? 'active:translate-y-1 active:shadow-[0_2px_0_var(--color-tile-shadow)]' : ''}
                ${isGameOver && isEmpty ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {/* Tactile X Piece */}
              {cell === 'X' && (
                <div className="animate-pop-in flex items-center justify-center w-full h-full">
                  <svg
                    viewBox="0 0 64 64"
                    className="w-full h-full drop-shadow-[0_3px_0_rgba(175,44,62,0.6)]"
                    fill="none"
                  >
                    <line
                      x1="14"
                      y1="14"
                      x2="50"
                      y2="50"
                      stroke={isWinner ? '#111827' : '#f04f65'}
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                    <line
                      x1="50"
                      y1="14"
                      x2="14"
                      y2="50"
                      stroke={isWinner ? '#111827' : '#f04f65'}
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                    {/* Inner highlight line */}
                    {!isWinner && (
                      <>
                        <line
                          x1="16"
                          y1="16"
                          x2="48"
                          y2="48"
                          stroke="#ff8696"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.6"
                        />
                        <line
                          x1="48"
                          y1="16"
                          x2="16"
                          y2="48"
                          stroke="#ff8696"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.6"
                        />
                      </>
                    )}
                  </svg>
                </div>
              )}

              {/* Tactile O Piece */}
              {cell === 'O' && (
                <div className="animate-pop-in flex items-center justify-center w-full h-full">
                  <svg
                    viewBox="0 0 64 64"
                    className="w-full h-full drop-shadow-[0_3px_0_rgba(25,136,204,0.6)]"
                    fill="none"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="20"
                      stroke={isWinner ? '#111827' : '#31b2fc'}
                      strokeWidth="11"
                    />
                    {/* Inner highlight arc */}
                    {!isWinner && (
                      <circle
                        cx="32"
                        cy="32"
                        r="22"
                        stroke="#80d5ff"
                        strokeWidth="2.5"
                        opacity="0.5"
                      />
                    )}
                  </svg>
                </div>
              )}

              {/* Ghost Hover Preview */}
              {isEmpty && !isGameOver && (
                <div className="opacity-0 group-hover:opacity-20 transition-opacity w-full h-full flex items-center justify-center pointer-events-none">
                  {currentPlayer === 'X' ? (
                    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                      <line x1="16" y1="16" x2="48" y2="48" stroke="#f04f65" strokeWidth="9" strokeLinecap="round" />
                      <line x1="48" y1="16" x2="16" y2="48" stroke="#f04f65" strokeWidth="9" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                      <circle cx="32" cy="32" r="18" stroke="#31b2fc" strokeWidth="9" />
                    </svg>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
