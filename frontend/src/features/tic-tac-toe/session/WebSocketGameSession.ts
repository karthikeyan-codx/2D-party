import { createInitialBoard, createInitialScore } from '@games/tic-tac-toe/logic/engine';
import {
  Board,
  MoveResult,
  Player,
  ScoreState,
  WinLine,
} from '@games/tic-tac-toe/types/types';
import { RealtimeWebSocketClient, realtimeWs } from '../../../services/realtime/WebSocketClient.js';
import {
  AuthoritativeMatchState,
  ConnectionStatus,
  MatchStatus,
  RoomPlayersSummary,
  RoundResultType,
  SeriesResultType,
  ServerMessage,
} from '../../../types/protocol.js';

export interface MultiplayerSessionState {
  roomId: string | null;
  myPlayerId: string | null;
  mySymbol: Player | null;
  myDisplayName: string;
  matchStatus: MatchStatus;
  currentRound: number;
  maxRounds: number;
  players: RoomPlayersSummary;
  score: ScoreState;
  currentTurn: Player;
  board: Board;
  winningLine: WinLine | null;
  roundResult: RoundResultType | null;
  seriesResult: SeriesResultType | null;
  readyForNextRound: {
    X: boolean;
    O: boolean;
  };
  totalTurnsThisRound: number;
  connectionStatus: ConnectionStatus;
  lastRejectReason: string | null;
  disconnectNotice: string | null;
}

export class WebSocketGameSession {
  private client: RealtimeWebSocketClient;
  private state: MultiplayerSessionState;
  private listeners: Set<(state: MultiplayerSessionState) => void> = new Set();

  constructor(client: RealtimeWebSocketClient = realtimeWs) {
    this.client = client;
    this.state = {
      roomId: null,
      myPlayerId: null,
      mySymbol: null,
      myDisplayName: 'Player',
      matchStatus: 'LOBBY',
      currentRound: 1,
      maxRounds: 5,
      players: {},
      score: createInitialScore(),
      currentTurn: 'X',
      board: createInitialBoard(),
      winningLine: null,
      roundResult: null,
      seriesResult: null,
      readyForNextRound: { X: false, O: false },
      totalTurnsThisRound: 0,
      connectionStatus: client.getStatus(),
      lastRejectReason: null,
      disconnectNotice: null,
    };

    this.client.connect();

    this.client.onStatusChange((status) => {
      this.state.connectionStatus = status;
      this.notify();
    });

    this.client.onMessage((msg: ServerMessage) => {
      this.handleServerMessage(msg);
    });
  }

  public getState(): MultiplayerSessionState {
    return this.state;
  }

  public makeMove(position: number): MoveResult {
    if (!this.state.roomId || !this.state.myPlayerId) {
      return { success: false, error: 'Not in a multiplayer room', state: this.getCompatGameState() };
    }

    if (this.state.matchStatus !== 'ROUND_IN_PROGRESS') {
      return { success: false, error: 'Round is not in progress', state: this.getCompatGameState() };
    }

    if (this.state.currentTurn !== this.state.mySymbol) {
      this.state.lastRejectReason = "It is not your turn. Waiting for opponent.";
      this.notify();
      return { success: false, error: 'Not your turn', state: this.getCompatGameState() };
    }

    this.state.lastRejectReason = null;
    this.notify();

    this.client.send({
      type: 'MAKE_MOVE',
      payload: {
        roomId: this.state.roomId,
        playerId: this.state.myPlayerId,
        position,
      },
    });

    return { success: true, state: this.getCompatGameState() };
  }

  public startGame() {
    if (this.state.roomId && this.state.myPlayerId) {
      this.client.send({
        type: 'START_GAME',
        payload: {
          roomId: this.state.roomId,
          playerId: this.state.myPlayerId,
        },
      });
    }
  }

  public nextRoundReady() {
    if (this.state.roomId && this.state.myPlayerId) {
      this.client.send({
        type: 'NEXT_ROUND_READY',
        payload: {
          roomId: this.state.roomId,
          playerId: this.state.myPlayerId,
        },
      });
    }
  }

  public playAgain() {
    if (this.state.roomId && this.state.myPlayerId) {
      this.client.send({
        type: 'PLAY_AGAIN',
        payload: {
          roomId: this.state.roomId,
          playerId: this.state.myPlayerId,
        },
      });
    }
  }

  public resetRound() {
    this.nextRoundReady();
  }

  public newMatch() {
    this.playAgain();
  }

  public createRoom(displayName: string = 'Player 1') {
    this.state.myDisplayName = displayName;
    this.state.lastRejectReason = null;
    this.client.send({
      type: 'CREATE_ROOM',
      payload: { displayName },
    });
  }

  public joinRoom(roomId: string, displayName: string = 'Player 2', playerId?: string) {
    this.state.myDisplayName = displayName;
    this.state.lastRejectReason = null;
    this.client.send({
      type: 'JOIN_ROOM',
      payload: {
        roomId: roomId.trim().toUpperCase(),
        displayName,
        playerId: playerId || this.state.myPlayerId || undefined,
      },
    });
  }

  public leaveRoom() {
    if (this.state.roomId && this.state.myPlayerId) {
      this.client.send({
        type: 'LEAVE_ROOM',
        payload: {
          roomId: this.state.roomId,
          playerId: this.state.myPlayerId,
        },
      });
    }
    this.state = {
      ...this.state,
      roomId: null,
      myPlayerId: null,
      mySymbol: null,
      matchStatus: 'LOBBY',
      currentRound: 1,
      players: {},
      score: createInitialScore(),
      board: createInitialBoard(),
      currentTurn: 'X',
      winningLine: null,
      roundResult: null,
      seriesResult: null,
      readyForNextRound: { X: false, O: false },
      totalTurnsThisRound: 0,
      lastRejectReason: null,
      disconnectNotice: null,
    };
    this.notify();
  }

  public subscribe(listener: (state: MultiplayerSessionState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'ROOM_CREATED':
        this.state.roomId = msg.payload.roomId;
        this.state.myPlayerId = msg.payload.playerId;
        this.state.mySymbol = msg.payload.symbol;
        this.state.matchStatus = 'WAITING_FOR_OPPONENT';
        this.notify();
        break;

      case 'ROOM_JOINED':
        this.state.roomId = msg.payload.roomId;
        this.state.myPlayerId = msg.payload.playerId;
        this.state.mySymbol = msg.payload.symbol;
        this.notify();
        break;

      case 'GAME_STATE': {
        const payload: AuthoritativeMatchState = msg.payload;
        this.state.roomId = payload.roomId;
        this.state.matchStatus = payload.matchStatus;
        this.state.currentRound = payload.currentRound;
        this.state.maxRounds = payload.maxRounds;
        this.state.players = payload.players;
        this.state.score = payload.score;
        this.state.currentTurn = payload.currentTurn;
        this.state.board = payload.board as Board;
        this.state.winningLine = payload.winningLine;
        this.state.roundResult = payload.roundResult;
        this.state.seriesResult = payload.seriesResult;
        this.state.readyForNextRound = payload.readyForNextRound;
        this.state.totalTurnsThisRound = payload.totalTurnsThisRound;
        this.notify();
        break;
      }

      case 'MOVE_REJECTED':
        this.state.lastRejectReason = msg.payload.reason;
        this.notify();
        break;

      case 'PLAYER_DISCONNECTED':
        this.state.disconnectNotice = `Opponent disconnected. Reconnect grace period: ${msg.payload.gracePeriodSeconds}s`;
        this.notify();
        break;

      case 'PLAYER_RECONNECTED':
        this.state.disconnectNotice = null;
        this.notify();
        break;

      case 'ROOM_CLOSED':
        this.state.lastRejectReason = msg.payload.reason;
        this.state.matchStatus = 'LOBBY';
        this.state.roomId = null;
        this.notify();
        break;

      case 'ERROR':
        this.state.lastRejectReason = msg.payload.message;
        this.notify();
        break;
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  private getCompatGameState() {
    return {
      board: this.state.board,
      currentPlayer: this.state.currentTurn,
      status: (this.state.roundResult === 'X_WIN' || this.state.roundResult === 'O_WIN'
        ? 'won'
        : this.state.roundResult === 'DRAW'
        ? 'draw'
        : 'in-progress') as 'idle' | 'in-progress' | 'won' | 'draw',
      winner: this.state.roundResult === 'X_WIN' ? ('X' as const) : this.state.roundResult === 'O_WIN' ? ('O' as const) : null,
      winningLine: this.state.winningLine,
      round: this.state.currentRound,
      maxRounds: this.state.maxRounds,
      score: this.state.score,
      moveHistory: [],
      isGameOver: this.state.matchStatus === 'ROUND_COMPLETE' || this.state.matchStatus === 'MATCH_COMPLETE',
    };
  }
}
