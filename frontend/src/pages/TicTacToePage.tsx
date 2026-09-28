import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { useTicTacToe } from '../features/tic-tac-toe/hooks/useTicTacToe.js';
import { TicTacToeHUD } from '../features/tic-tac-toe/components/TicTacToeHUD.js';
import { TicTacToeBoard } from '../features/tic-tac-toe/components/TicTacToeBoard.js';
import { TicTacToeControls } from '../features/tic-tac-toe/components/TicTacToeControls.js';
import { MultiplayerLobby } from '../features/tic-tac-toe/components/MultiplayerLobby.js';
import { GameOverModal } from '../features/tic-tac-toe/components/GameOverModal.js';
import { useTheme } from '../theme/theme.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';

export const TicTacToePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const source = searchParams.get('source');
  const partyRoomId = searchParams.get('partyRoomId');
  const gameSessionId = searchParams.get('gameSessionId');
  const isPartyRoom = source === 'party-room' && Boolean(gameSessionId);

  const {
    isLocal,
    isInGame,
    showModal,
    board,
    currentTurn,
    currentRound,
    maxRounds,
    score,
    winningLine,
    matchStatus,
    winner,
    totalTurnsThisRound,
    player1Name,
    player2Name,
    localWinnerName,
    localChampionName,
    onlineState,
    roundPerspective,
    seriesPerspective,
    isMyTurn,
    isOpponentWaitingForNextRound,
    handleMove,
    handleStartGame,
    handleStartLocalMatch,
    handleNextRound,
    handlePlayAgain,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
  } = useTicTacToe({
    source,
    partyRoomId,
    gameSessionId,
    userDisplayName: user?.displayName,
    userId: user?.id,
  });

  const { theme, toggleTheme } = useTheme();

  const isRoundOver = matchStatus === 'ROUND_COMPLETE' || matchStatus === 'MATCH_COMPLETE';
  const isBoardDisabled = isLocal ? isRoundOver : (!isMyTurn || isRoundOver);

  const handleReturnNavigation = () => {
    if (isPartyRoom && partyRoomId) {
      navigate(`/rooms/${partyRoomId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-3 sm:p-5 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <header className="w-full flex items-center justify-between pb-3 sm:pb-4 border-b border-[var(--color-border)]/50">
        <div className="flex items-center gap-2.5">
          <button
            id="btn-back-to-platform"
            type="button"
            onClick={handleReturnNavigation}
            className="arcade-btn px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-black uppercase text-amber-400 hover:text-amber-300 transition-colors cursor-pointer select-none mr-1"
            title={isPartyRoom ? 'Return to Party Room' : 'Return to NEX PLAY Dashboard'}
          >
            {isPartyRoom ? '← PARTY ROOM' : '← PLATFORM'}
          </button>

          {/* Logo star */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#ffbf2b] border-2 border-amber-300 shadow-[0_3px_0_#c97808] flex items-center justify-center font-black text-slate-950 text-xl select-none">
            ★
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-2xl font-black tracking-widest uppercase text-[var(--color-text)]">
                NEX PLAY
              </span>
              <ArcadeBadge variant="amber">ARCADE</ArcadeBadge>
            </div>
            <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              Tic Tac Toe
            </div>
          </div>
        </div>

        {/* Header Right: Local badge or Room Badge and Connection Status */}
        <div className="flex items-center gap-2">
          {isLocal && isInGame ? (
            <ArcadeBadge variant="teal">🎮 LOCAL 2P</ArcadeBadge>
          ) : (
            <>
              {isInGame && onlineState.roomId && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                  <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)]">
                    ROOM:
                  </span>
                  <span className="font-mono text-xs font-black text-amber-400 tracking-wider">
                    {onlineState.roomId}
                  </span>
                </div>
              )}

              <ArcadeBadge variant={onlineState.connectionStatus === 'connected' ? 'teal' : 'coral'}>
                {onlineState.connectionStatus === 'connected' ? '● ONLINE' : '○ CONNECTING'}
              </ArcadeBadge>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center py-4 sm:py-6">
        {!isInGame ? (
          /* STATE 1: LOBBY & MODE SELECTION */
          <MultiplayerLobby
            multiplayer={onlineState}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onStartLocalMatch={handleStartLocalMatch}
          />
        ) : (
          /* STATE 2: ACTIVE GAME (Clean, Focused, Board Centered) */
          <div className="w-full max-w-[420px] flex flex-col items-center gap-3.5 sm:gap-4 animate-pop-in">
            {/* Heads Up Display */}
            <TicTacToeHUD
              isLocal={isLocal}
              currentPlayer={currentTurn}
              score={score}
              currentRound={currentRound}
              maxRounds={maxRounds}
              isGameOver={isRoundOver}
              winner={winner}
              playerXName={player1Name}
              playerOName={player2Name}
              winnerName={localWinnerName}
              multiplayer={onlineState}
              isMyTurn={isMyTurn}
            />

            {/* Focused 3x3 Board */}
            <TicTacToeBoard
              board={board}
              currentPlayer={currentTurn}
              isGameOver={isBoardDisabled}
              winningLine={winningLine}
              onCellClick={handleMove}
            />

            {/* Secondary Game Controls */}
            <TicTacToeControls
              onLeaveMatch={() => {
                handleLeaveRoom();
                handleReturnNavigation();
              }}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 border-t border-[var(--color-border)]/40 text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-[var(--color-text-muted)]">
        NEX PLAY &bull; MULTIPLAYER CASUAL GAMING
      </footer>

      {/* Round & Match Result Celebration Modal */}
      <GameOverModal
        isOpen={showModal}
        isLocal={isLocal}
        matchStatus={matchStatus}
        currentRound={currentRound}
        maxRounds={maxRounds}
        score={score}
        roundPerspective={roundPerspective}
        seriesPerspective={seriesPerspective}
        player1Name={player1Name}
        player2Name={player2Name}
        localWinnerName={localWinnerName}
        localChampionName={localChampionName}
        totalTurns={totalTurnsThisRound}
        winningLine={winningLine}
        isOpponentWaiting={isOpponentWaitingForNextRound}
        onNextRound={handleNextRound}
        onPlayAgain={handlePlayAgain}
        onReturnToLobby={() => {
          handleLeaveRoom();
          handleReturnNavigation();
        }}
      />
    </div>
  );
};
