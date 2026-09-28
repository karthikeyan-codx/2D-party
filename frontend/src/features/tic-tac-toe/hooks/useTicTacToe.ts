import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../../services/audio/sfx.js';
import { MultiplayerSessionState, WebSocketGameSession } from '../session/WebSocketGameSession.js';
import { LocalGameSession, LocalMatchState } from '@games/tic-tac-toe/modes/local/localSession';

export type GameMode = 'ONLINE' | 'LOCAL';
export type PlayerPerspective = 'VICTORY' | 'DEFEAT' | 'DRAW' | null;
export type SeriesPerspective = 'MATCH_VICTORY' | 'MATCH_DEFEAT' | 'MATCH_DRAW' | null;

export interface UseTicTacToeOptions {
  source?: string | null;
  partyRoomId?: string | null;
  gameSessionId?: string | null;
  userDisplayName?: string | null;
  userId?: string | null;
}

export function useTicTacToe(options?: UseTicTacToeOptions) {
  const isPartyRoomLaunch = options?.source === 'party-room' && Boolean(options?.gameSessionId);
  const [gameMode, setGameMode] = useState<GameMode>('ONLINE');

  // Online WebSocket Session
  const onlineSession = useMemo(() => new WebSocketGameSession(), []);
  const [onlineState, setOnlineState] = useState<MultiplayerSessionState>(() =>
    onlineSession.getState()
  );

  // Local Pass-and-Play Session
  const localSession = useMemo(() => new LocalGameSession(), []);
  const [localState, setLocalState] = useState<LocalMatchState>(() =>
    localSession.getState()
  );

  const prevOnlineMoveCount = useRef(0);
  const prevOnlineMatchStatus = useRef(onlineState.matchStatus);

  const prevLocalMoveCount = useRef(0);
  const prevLocalMatchStatus = useRef(localState.matchStatus);

  // Auto-connect into game session if launched from Party Room
  useEffect(() => {
    if (isPartyRoomLaunch && options?.gameSessionId) {
      setGameMode('ONLINE');
      const displayName = options.userDisplayName || 'Player';
      const playerId = options.userId ? `ply_${options.userId}` : undefined;
      onlineSession.joinRoom(options.gameSessionId, displayName, playerId);
    }
  }, [isPartyRoomLaunch, options?.gameSessionId, options?.userDisplayName, options?.userId, onlineSession]);

  // Subscribe to Online Session
  useEffect(() => {
    const unsubscribe = onlineSession.subscribe((next) => {
      setOnlineState(next);

      if (gameMode === 'ONLINE') {
        // SFX for moves
        if (next.totalTurnsThisRound > prevOnlineMoveCount.current) {
          sfx.playMove(next.currentTurn === 'X' ? 'O' : 'X');
        }
        prevOnlineMoveCount.current = next.totalTurnsThisRound;

        // SFX for Round/Match Finish
        if (
          next.matchStatus !== prevOnlineMatchStatus.current &&
          (next.matchStatus === 'ROUND_COMPLETE' || next.matchStatus === 'MATCH_COMPLETE')
        ) {
          if (next.roundResult === 'DRAW') {
            sfx.playDraw();
          } else if (
            (next.mySymbol === 'X' && next.roundResult === 'X_WIN') ||
            (next.mySymbol === 'O' && next.roundResult === 'O_WIN')
          ) {
            sfx.playWin();
          } else {
            sfx.playDraw();
          }
        }
        prevOnlineMatchStatus.current = next.matchStatus;
      }
    });

    return unsubscribe;
  }, [onlineSession, gameMode]);

  // Subscribe to Local Session
  useEffect(() => {
    const unsubscribe = localSession.subscribe((next) => {
      setLocalState(next);

      if (gameMode === 'LOCAL') {
        // SFX for moves
        if (next.totalTurnsThisRound > prevLocalMoveCount.current) {
          sfx.playMove(next.currentTurn === 'X' ? 'O' : 'X');
        }
        prevLocalMoveCount.current = next.totalTurnsThisRound;

        // SFX for Round/Match Finish
        if (
          next.matchStatus !== prevLocalMatchStatus.current &&
          (next.matchStatus === 'ROUND_COMPLETE' || next.matchStatus === 'MATCH_COMPLETE')
        ) {
          if (next.roundResult === 'DRAW') {
            sfx.playDraw();
          } else {
            sfx.playWin();
          }
        }
        prevLocalMatchStatus.current = next.matchStatus;
      }
    });

    return unsubscribe;
  }, [localSession, gameMode]);

  const isLocal = gameMode === 'LOCAL';

  // Move Handler
  const handleMove = useCallback(
    (position: number) => {
      if (isLocal) {
        if (localState.matchStatus !== 'ROUND_IN_PROGRESS') return;
        localSession.makeMove(position);
      } else {
        if (
          onlineState.matchStatus !== 'ROUND_IN_PROGRESS' ||
          onlineState.board[position] !== null ||
          onlineState.currentTurn !== onlineState.mySymbol
        ) {
          return;
        }
        onlineSession.makeMove(position);
      }
    },
    [isLocal, localSession, localState.matchStatus, onlineSession, onlineState.board, onlineState.currentTurn, onlineState.matchStatus, onlineState.mySymbol]
  );

  // Local Match Start Handler
  const handleStartLocalMatch = useCallback(
    (player1Name: string, player2Name: string) => {
      sfx.playClick();
      setGameMode('LOCAL');
      localSession.startMatch(player1Name, player2Name);
    },
    [localSession]
  );

  // Online Start Match Handler
  const handleStartGame = useCallback(() => {
    sfx.playClick();
    onlineSession.startGame();
  }, [onlineSession]);

  // Next Round Handler
  const handleNextRound = useCallback(() => {
    sfx.playClick();
    if (isLocal) {
      localSession.nextRound();
    } else {
      onlineSession.nextRoundReady();
    }
  }, [isLocal, localSession, onlineSession]);

  // Play Again Handler
  const handlePlayAgain = useCallback(() => {
    sfx.playClick();
    if (isLocal) {
      localSession.playAgain();
    } else {
      onlineSession.playAgain();
    }
  }, [isLocal, localSession, onlineSession]);

  // Create Room Handler
  const handleCreateRoom = useCallback(
    (displayName: string) => {
      sfx.playClick();
      setGameMode('ONLINE');
      onlineSession.createRoom(displayName);
    },
    [onlineSession]
  );

  // Join Room Handler
  const handleJoinRoom = useCallback(
    (roomId: string, displayName: string) => {
      sfx.playClick();
      setGameMode('ONLINE');
      onlineSession.joinRoom(roomId, displayName);
    },
    [onlineSession]
  );

  // Leave Game / Return to Lobby Handler
  const handleLeaveRoom = useCallback(() => {
    sfx.playClick();
    if (isLocal) {
      localSession.resetToSetup();
    } else {
      onlineSession.leaveRoom();
    }
  }, [isLocal, localSession, onlineSession]);

  // Online Perspective Calculations
  const roundPerspective: PlayerPerspective = useMemo(() => {
    if (isLocal) return null;
    if (!onlineState.roundResult || !onlineState.mySymbol) return null;
    if (onlineState.roundResult === 'DRAW') return 'DRAW';
    if (onlineState.roundResult === 'X_WIN') {
      return onlineState.mySymbol === 'X' ? 'VICTORY' : 'DEFEAT';
    }
    if (onlineState.roundResult === 'O_WIN') {
      return onlineState.mySymbol === 'O' ? 'VICTORY' : 'DEFEAT';
    }
    return null;
  }, [isLocal, onlineState.mySymbol, onlineState.roundResult]);

  const seriesPerspective: SeriesPerspective = useMemo(() => {
    if (isLocal) return null;
    if (!onlineState.seriesResult || !onlineState.mySymbol) return null;
    if (onlineState.seriesResult === 'DRAW') return 'MATCH_DRAW';
    if (onlineState.seriesResult === 'X_WIN') {
      return onlineState.mySymbol === 'X' ? 'MATCH_VICTORY' : 'MATCH_DEFEAT';
    }
    if (onlineState.seriesResult === 'O_WIN') {
      return onlineState.mySymbol === 'O' ? 'MATCH_VICTORY' : 'MATCH_DEFEAT';
    }
    return null;
  }, [isLocal, onlineState.mySymbol, onlineState.seriesResult]);

  const isMyTurn = isLocal
    ? localState.matchStatus === 'ROUND_IN_PROGRESS'
    : Boolean(
        onlineState.matchStatus === 'ROUND_IN_PROGRESS' &&
          onlineState.mySymbol &&
          onlineState.currentTurn === onlineState.mySymbol
      );

  const isOpponentWaitingForNextRound = isLocal
    ? false
    : Boolean(
        onlineState.matchStatus === 'ROUND_COMPLETE' &&
          onlineState.mySymbol &&
          onlineState.readyForNextRound[onlineState.mySymbol] &&
          !onlineState.readyForNextRound[onlineState.mySymbol === 'X' ? 'O' : 'X']
      );

  const isInGame = isLocal
    ? localState.matchStatus !== 'SETUP'
    : isPartyRoomLaunch
    ? true
    : onlineState.roomId !== null &&
      (onlineState.matchStatus === 'ROUND_IN_PROGRESS' ||
        onlineState.matchStatus === 'ROUND_COMPLETE' ||
        onlineState.matchStatus === 'MATCH_COMPLETE' ||
        onlineState.matchStatus === 'OPPONENT_DISCONNECTED');

  const showModal = isLocal
    ? localState.matchStatus === 'ROUND_COMPLETE' || localState.matchStatus === 'MATCH_COMPLETE'
    : onlineState.matchStatus === 'ROUND_COMPLETE' || onlineState.matchStatus === 'MATCH_COMPLETE';

  return {
    gameMode,
    isLocal,
    isInGame,
    showModal,
    setGameMode,

    // Active Game Board State
    board: isLocal ? localState.board : onlineState.board,
    currentTurn: isLocal ? localState.currentTurn : onlineState.currentTurn,
    currentRound: isLocal ? localState.currentRound : onlineState.currentRound,
    maxRounds: isLocal ? localState.maxRounds : onlineState.maxRounds,
    score: isLocal ? localState.score : onlineState.score,
    winningLine: isLocal ? localState.winningLine : onlineState.winningLine,
    matchStatus: isLocal ? localState.matchStatus : onlineState.matchStatus,
    winner: isLocal
      ? localState.winner
      : onlineState.roundResult === 'X_WIN'
      ? 'X'
      : onlineState.roundResult === 'O_WIN'
      ? 'O'
      : null,
    totalTurnsThisRound: isLocal
      ? localState.totalTurnsThisRound
      : onlineState.totalTurnsThisRound,

    // Local Player Names
    player1Name: isLocal ? localState.player1.name : (onlineState.players.X?.displayName || 'Player X'),
    player2Name: isLocal ? localState.player2.name : (onlineState.players.O?.displayName || 'Player O'),
    localWinnerName: isLocal ? localState.winnerName : null,
    localChampionName: isLocal
      ? localState.seriesResult === 'X_WIN'
        ? localState.player1.name
        : localState.seriesResult === 'O_WIN'
        ? localState.player2.name
        : null
      : null,

    // Online-specific state
    onlineState,
    roundPerspective,
    seriesPerspective,
    isMyTurn,
    isOpponentWaitingForNextRound,

    // Handlers
    handleMove,
    handleStartGame,
    handleStartLocalMatch,
    handleNextRound,
    handlePlayAgain,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
  };
}
