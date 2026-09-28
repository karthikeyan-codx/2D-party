import { WebSocket } from 'ws';
import {
  createInitialBoard,
  createInitialScore,
  makeMove as engineMakeMove,
} from '../../../games/tic-tac-toe/logic/engine.js';
import {
  Board,
  Player,
  ScoreState,
  WinLine,
} from '../../../games/tic-tac-toe/types/types.js';
import { config } from '../config/index.js';
import { matchRepository } from '../repositories/matchRepository.js';
import {
  AuthoritativeMatchState,
  GameStateBroadcast,
  MatchStatus,
  MoveRejectCode,
  MoveRejectedMessage,
  RoomPlayersSummary,
  RoundResultType,
  SeriesResultType,
  ServerMessage,
} from '../types/protocol.js';

export interface RoomPlayer {
  playerId: string;
  displayName: string;
  symbol: Player;
  connected: boolean;
  ready: boolean;
  ws: WebSocket;
  disconnectTimeout: NodeJS.Timeout | null;
}

export interface TicTacToeRoom {
  roomId: string;
  matchStatus: MatchStatus;
  currentRound: number; // 1 .. 5
  maxRounds: number;    // 5
  playerX: RoomPlayer | null;
  playerO: RoomPlayer | null;
  score: ScoreState;
  board: Board;
  currentTurn: Player;
  winningLine: WinLine | null;
  roundResult: RoundResultType | null;
  seriesResult: SeriesResultType | null;
  readyForNextRound: {
    X: boolean;
    O: boolean;
  };
  totalTurnsThisRound: number;
  createdAt: Date;
  startedAt: Date;
  updatedAt: Date;
}

export class RoomManager {
  private rooms: Map<string, TicTacToeRoom> = new Map();
  private socketToPlayerMap: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  private generatePlayerId(): string {
    return 'ply_' + Math.random().toString(36).substring(2, 10);
  }

  private sendToSocket(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private getPlayersSummary(room: TicTacToeRoom): RoomPlayersSummary {
    const summary: RoomPlayersSummary = {};
    if (room.playerX) {
      summary.X = {
        playerId: room.playerX.playerId,
        displayName: room.playerX.displayName,
        symbol: 'X',
        connected: room.playerX.connected,
        ready: room.playerX.ready,
      };
    }
    if (room.playerO) {
      summary.O = {
        playerId: room.playerO.playerId,
        displayName: room.playerO.displayName,
        symbol: 'O',
        connected: room.playerO.connected,
        ready: room.playerO.ready,
      };
    }
    return summary;
  }

  public broadcastGameState(room: TicTacToeRoom) {
    const authoritativeState: AuthoritativeMatchState = {
      roomId: room.roomId,
      matchStatus: room.matchStatus,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      players: this.getPlayersSummary(room),
      score: { ...room.score },
      currentTurn: room.currentTurn,
      board: [...room.board],
      winningLine: room.winningLine ? [...room.winningLine] : null,
      roundResult: room.roundResult,
      seriesResult: room.seriesResult,
      readyForNextRound: { ...room.readyForNextRound },
      totalTurnsThisRound: room.totalTurnsThisRound,
    };

    const broadcast: GameStateBroadcast = {
      type: 'GAME_STATE',
      payload: authoritativeState,
    };

    if (room.playerX?.ws) {
      this.sendToSocket(room.playerX.ws, broadcast);
    }
    if (room.playerO?.ws) {
      this.sendToSocket(room.playerO.ws, broadcast);
    }
  }

  public createRoom(ws: WebSocket, displayName: string = 'Player 1'): { roomId: string; playerId: string } {
    const roomId = this.generateRoomCode();
    const playerId = this.generatePlayerId();

    const playerX: RoomPlayer = {
      playerId,
      displayName: displayName.trim() || 'Player 1',
      symbol: 'X',
      connected: true,
      ready: true,
      ws,
      disconnectTimeout: null,
    };

    const room: TicTacToeRoom = {
      roomId,
      matchStatus: 'WAITING_FOR_OPPONENT',
      currentRound: 1,
      maxRounds: 5,
      playerX,
      playerO: null,
      score: createInitialScore(),
      board: createInitialBoard(),
      currentTurn: 'X',
      winningLine: null,
      roundResult: null,
      seriesResult: null,
      readyForNextRound: { X: false, O: false },
      totalTurnsThisRound: 0,
      createdAt: new Date(),
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.socketToPlayerMap.set(ws, { roomId, playerId });

    this.sendToSocket(ws, {
      type: 'ROOM_CREATED',
      payload: {
        roomId,
        playerId,
        symbol: 'X',
      },
    });

    this.broadcastGameState(room);
    return { roomId, playerId };
  }

  public createPartyGame(
    gameSessionId: string,
    playerXInfo: { userId: string; displayName: string },
    playerOInfo: { userId: string; displayName: string }
  ): TicTacToeRoom {
    const roomId = gameSessionId;
    const playerXId = `ply_${playerXInfo.userId}`;
    const playerOId = `ply_${playerOInfo.userId}`;

    const playerX: RoomPlayer = {
      playerId: playerXId,
      displayName: playerXInfo.displayName || 'Player X',
      symbol: 'X',
      connected: false,
      ready: true,
      ws: null as any,
      disconnectTimeout: null,
    };

    const playerO: RoomPlayer = {
      playerId: playerOId,
      displayName: playerOInfo.displayName || 'Player O',
      symbol: 'O',
      connected: false,
      ready: true,
      ws: null as any,
      disconnectTimeout: null,
    };

    const room: TicTacToeRoom = {
      roomId,
      matchStatus: 'ROUND_IN_PROGRESS',
      currentRound: 1,
      maxRounds: 5,
      playerX,
      playerO,
      score: createInitialScore(),
      board: createInitialBoard(),
      currentTurn: 'X',
      winningLine: null,
      roundResult: null,
      seriesResult: null,
      readyForNextRound: { X: false, O: false },
      totalTurnsThisRound: 0,
      createdAt: new Date(),
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public joinRoom(
    ws: WebSocket,
    roomIdInput: string,
    displayName: string = 'Player 2',
    existingPlayerId?: string
  ): boolean {
    const roomId = roomIdInput.trim().toUpperCase();
    const room = this.rooms.get(roomId);

    if (!room) {
      this.sendToSocket(ws, {
        type: 'ERROR',
        payload: {
          code: 'ROOM_NOT_FOUND',
          message: `Room "${roomId}" does not exist. Please verify the code.`,
        },
      });
      return false;
    }

    // Reconnection handling or party-room slot claiming
    const reconnectingPlayer = existingPlayerId
      ? room.playerX?.playerId === existingPlayerId
        ? room.playerX
        : room.playerO?.playerId === existingPlayerId
        ? room.playerO
        : null
      : (!room.playerX?.connected ? room.playerX : !room.playerO?.connected ? room.playerO : null);

    if (reconnectingPlayer) {
      if (reconnectingPlayer.disconnectTimeout) {
        clearTimeout(reconnectingPlayer.disconnectTimeout);
        reconnectingPlayer.disconnectTimeout = null;
      }

      reconnectingPlayer.ws = ws;
      reconnectingPlayer.connected = true;
      if (displayName && displayName !== 'Player 2') {
        reconnectingPlayer.displayName = displayName.trim();
      }
      this.socketToPlayerMap.set(ws, { roomId, playerId: reconnectingPlayer.playerId });

      // If match was in OPPONENT_DISCONNECTED, restore state
      if (room.matchStatus === 'OPPONENT_DISCONNECTED') {
        room.matchStatus = room.roundResult ? 'ROUND_COMPLETE' : 'ROUND_IN_PROGRESS';
      }

      this.sendToSocket(ws, {
        type: 'ROOM_JOINED',
        payload: {
          roomId,
          playerId: reconnectingPlayer.playerId,
          symbol: reconnectingPlayer.symbol,
        },
      });

      const otherPlayer = reconnectingPlayer.symbol === 'X' ? room.playerO : room.playerX;
      if (otherPlayer?.ws) {
        this.sendToSocket(otherPlayer.ws, {
          type: 'PLAYER_RECONNECTED',
          payload: {
            playerId: reconnectingPlayer.playerId,
            symbol: reconnectingPlayer.symbol,
          },
        });
      }

      this.broadcastGameState(room);
      return true;
    }

    // Reject 3rd player
    if (room.playerX && room.playerO && room.playerX.connected && room.playerO.connected) {
      this.sendToSocket(ws, {
        type: 'ERROR',
        payload: {
          code: 'ROOM_FULL',
          message: `Room "${roomId}" is already full with 2 active players.`,
        },
      });
      return false;
    }

    const playerId = this.generatePlayerId();
    const assignedSymbol: Player = room.playerX ? 'O' : 'X';

    const newPlayer: RoomPlayer = {
      playerId,
      displayName: displayName.trim() || `Player ${assignedSymbol}`,
      symbol: assignedSymbol,
      connected: true,
      ready: true,
      ws,
      disconnectTimeout: null,
    };

    if (assignedSymbol === 'X') {
      room.playerX = newPlayer;
    } else {
      room.playerO = newPlayer;
    }

    this.socketToPlayerMap.set(ws, { roomId, playerId });

    this.sendToSocket(ws, {
      type: 'ROOM_JOINED',
      payload: {
        roomId,
        playerId,
        symbol: assignedSymbol,
      },
    });

    // Both players connected -> transition to READY state in lobby
    if (room.playerX && room.playerO) {
      room.matchStatus = 'READY';
    }

    this.broadcastGameState(room);
    return true;
  }

  public startGame(ws: WebSocket, roomId: string, playerId: string) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return;

    const isMember =
      room.playerX?.playerId === playerId || room.playerO?.playerId === playerId;
    if (!isMember) return;

    if (!room.playerX || !room.playerO) return;

    // Transition from READY to ROUND_IN_PROGRESS
    if (room.matchStatus === 'READY' || room.matchStatus === 'WAITING_FOR_OPPONENT') {
      room.matchStatus = 'ROUND_IN_PROGRESS';
      room.currentRound = 1;
      room.maxRounds = 5;
      room.score = createInitialScore();
      room.board = createInitialBoard();
      room.currentTurn = 'X';
      room.winningLine = null;
      room.roundResult = null;
      room.seriesResult = null;
      room.totalTurnsThisRound = 0;
      room.readyForNextRound = { X: false, O: false };
      room.startedAt = new Date();
      this.broadcastGameState(room);
    }
  }

  public handleMove(ws: WebSocket, roomId: string, playerId: string, position: number) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) {
      this.sendMoveRejected(ws, 'Room not found', 'ROOM_NOT_FOUND');
      return;
    }

    const player =
      room.playerX?.playerId === playerId
        ? room.playerX
        : room.playerO?.playerId === playerId
        ? room.playerO
        : null;

    if (!player) {
      this.sendMoveRejected(ws, 'You are not a registered player in this room', 'PLAYER_NOT_IN_ROOM');
      return;
    }

    if (room.matchStatus !== 'ROUND_IN_PROGRESS') {
      this.sendMoveRejected(ws, 'Round is not currently active', 'GAME_NOT_ACTIVE');
      return;
    }

    // Strict Turn Validation
    if (room.currentTurn !== player.symbol) {
      this.sendMoveRejected(
        ws,
        `It is not your turn. Waiting for Player ${room.currentTurn}.`,
        'NOT_YOUR_TURN'
      );
      return;
    }

    // Board position validation
    if (!Number.isInteger(position) || position < 0 || position > 8) {
      this.sendMoveRejected(ws, 'Invalid board index. Must be between 0 and 8.', 'INVALID_POSITION');
      return;
    }

    if (room.board[position] !== null) {
      this.sendMoveRejected(ws, 'Selected cell is already occupied.', 'CELL_OCCUPIED');
      return;
    }

    // Authoritative move validation using pure engine
    // Build temporary engine state
    const engineState = {
      board: room.board,
      currentPlayer: room.currentTurn,
      status: 'in-progress' as const,
      winner: null,
      winningLine: null,
      round: room.currentRound,
      maxRounds: room.maxRounds,
      score: room.score,
      moveHistory: [],
      isGameOver: false,
    };

    const moveResult = engineMakeMove(engineState, position);
    if (!moveResult.success) {
      this.sendMoveRejected(ws, moveResult.error || 'Move rejected by game engine', 'INVALID_POSITION');
      return;
    }

    // Update authoritative state
    room.board = moveResult.state.board;
    room.totalTurnsThisRound++;
    room.currentTurn = moveResult.state.currentPlayer;
    room.updatedAt = new Date();

    // Check Win or Draw condition
    if (moveResult.state.isGameOver) {
      if (moveResult.state.status === 'won') {
        const winner = moveResult.state.winner!;
        room.winningLine = moveResult.state.winningLine;
        room.roundResult = winner === 'X' ? 'X_WIN' : 'O_WIN';

        if (winner === 'X') {
          room.score.x++;
        } else {
          room.score.o++;
        }
      } else {
        // Draw
        room.winningLine = null;
        room.roundResult = 'DRAW';
        room.score.draws++;
      }

      // Check Best-of-5 Series Win Conditions
      // Rule 1: First to 3 wins immediately wins the entire series!
      if (room.score.x >= 3) {
        room.seriesResult = 'X_WIN';
        room.matchStatus = 'MATCH_COMPLETE';
      } else if (room.score.o >= 3) {
        room.seriesResult = 'O_WIN';
        room.matchStatus = 'MATCH_COMPLETE';
      }
      // Rule 2: Round 5 limit reached
      else if (room.currentRound >= 5) {
        if (room.score.x > room.score.o) {
          room.seriesResult = 'X_WIN';
        } else if (room.score.o > room.score.x) {
          room.seriesResult = 'O_WIN';
        } else {
          room.seriesResult = 'DRAW';
        }
        room.matchStatus = 'MATCH_COMPLETE';
      }
      // Rule 3: Still rounds remaining
      else {
        room.matchStatus = 'ROUND_COMPLETE';
        room.readyForNextRound = { X: false, O: false };
      }

      // Persist if series completed
      if (room.matchStatus === 'MATCH_COMPLETE') {
        matchRepository.saveMatch({
          gameId: 'tic-tac-toe',
          roomId: room.roomId,
          playerX: room.playerX?.displayName || 'Player X',
          playerO: room.playerO?.displayName || 'Player O',
          winner: room.seriesResult === 'X_WIN' ? 'X' : room.seriesResult === 'O_WIN' ? 'O' : null,
          result: room.seriesResult!,
          startedAt: room.startedAt,
          endedAt: new Date(),
          totalTurns: room.totalTurnsThisRound,
          finalScoreX: room.score.x,
          finalScoreO: room.score.o,
        }).catch(() => {});
      }
    }

    this.broadcastGameState(room);
  }

  /**
   * Synchronized Next Round: Both players must click Next Round to advance.
   */
  public handleNextRoundReady(ws: WebSocket, roomId: string, playerId: string) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return;

    if (room.matchStatus !== 'ROUND_COMPLETE') return;

    // Strictly ensure round never exceeds 5
    if (room.currentRound >= 5) {
      room.matchStatus = 'MATCH_COMPLETE';
      this.broadcastGameState(room);
      return;
    }

    const isPlayerX = room.playerX?.playerId === playerId;
    const isPlayerO = room.playerO?.playerId === playerId;
    if (!isPlayerX && !isPlayerO) return;

    if (isPlayerX) room.readyForNextRound.X = true;
    if (isPlayerO) room.readyForNextRound.O = true;

    // If both players are ready, advance to the next round authoritatively!
    if (room.readyForNextRound.X && room.readyForNextRound.O) {
      room.currentRound++; // Advances from 1->2, 2->3, 3->4, 4->5 (strictly capped at 5)
      room.board = createInitialBoard();
      room.winningLine = null;
      room.roundResult = null;
      room.readyForNextRound = { X: false, O: false };
      room.totalTurnsThisRound = 0;
      // Alternate starting player per round
      room.currentTurn = room.currentRound % 2 === 1 ? 'X' : 'O';
      room.matchStatus = 'ROUND_IN_PROGRESS';
    }

    this.broadcastGameState(room);
  }

  /**
   * Play Again: Resets to a fresh best-of-5 series.
   */
  public playAgain(ws: WebSocket, roomId: string, playerId: string) {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return;

    const isMember =
      room.playerX?.playerId === playerId || room.playerO?.playerId === playerId;
    if (!isMember) return;

    // Reset to Round 1, 0-0 score, fresh series
    room.currentRound = 1;
    room.maxRounds = 5;
    room.score = createInitialScore();
    room.board = createInitialBoard();
    room.winningLine = null;
    room.roundResult = null;
    room.seriesResult = null;
    room.totalTurnsThisRound = 0;
    room.readyForNextRound = { X: false, O: false };
    room.currentTurn = 'X';
    room.matchStatus = 'ROUND_IN_PROGRESS';
    room.startedAt = new Date();

    this.broadcastGameState(room);
  }

  public leaveRoom(ws: WebSocket) {
    const info = this.socketToPlayerMap.get(ws);
    if (!info) return;

    const room = this.rooms.get(info.roomId);
    if (!room) return;

    const isPlayerX = room.playerX?.playerId === info.playerId;
    const leavingPlayer = isPlayerX ? room.playerX : room.playerO;
    const remainingPlayer = isPlayerX ? room.playerO : room.playerX;

    if (leavingPlayer?.disconnectTimeout) {
      clearTimeout(leavingPlayer.disconnectTimeout);
    }

    if (remainingPlayer?.ws) {
      this.sendToSocket(remainingPlayer.ws, {
        type: 'ROOM_CLOSED',
        payload: {
          reason: `${leavingPlayer?.displayName || 'Opponent'} has left the match.`,
        },
      });
    }

    this.socketToPlayerMap.delete(ws);
    this.rooms.delete(info.roomId);
  }

  public handleDisconnect(ws: WebSocket) {
    const info = this.socketToPlayerMap.get(ws);
    if (!info) return;

    const room = this.rooms.get(info.roomId);
    if (!room) {
      this.socketToPlayerMap.delete(ws);
      return;
    }

    const isPlayerX = room.playerX?.playerId === info.playerId;
    const player = isPlayerX ? room.playerX : room.playerO;
    const otherPlayer = isPlayerX ? room.playerO : room.playerX;

    if (!player) return;

    player.connected = false;

    if (room.matchStatus === 'ROUND_IN_PROGRESS') {
      room.matchStatus = 'OPPONENT_DISCONNECTED';
    }

    if (otherPlayer?.ws) {
      this.sendToSocket(otherPlayer.ws, {
        type: 'PLAYER_DISCONNECTED',
        payload: {
          playerId: player.playerId,
          symbol: player.symbol,
          gracePeriodSeconds: Math.floor(config.playerDisconnectGracePeriodMs / 1000),
        },
      });
    }

    this.broadcastGameState(room);

    player.disconnectTimeout = setTimeout(() => {
      if (otherPlayer?.ws) {
        this.sendToSocket(otherPlayer.ws, {
          type: 'ROOM_CLOSED',
          payload: {
            reason: `Opponent failed to reconnect within ${Math.floor(
              config.playerDisconnectGracePeriodMs / 1000
            )} seconds. Match closed.`,
          },
        });
      }
      this.rooms.delete(room.roomId);
      this.socketToPlayerMap.delete(ws);
    }, config.playerDisconnectGracePeriodMs);
  }

  private sendMoveRejected(ws: WebSocket, reason: string, code: MoveRejectCode) {
    const message: MoveRejectedMessage = {
      type: 'MOVE_REJECTED',
      payload: {
        reason,
        code,
      },
    };
    this.sendToSocket(ws, message);
  }

  public getRoom(roomId: string): TicTacToeRoom | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }
}

export const roomManager = new RoomManager();
