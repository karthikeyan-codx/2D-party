import {
  Player,
  ScoreState,
  TicTacToeState,
  WinLine,
} from '../../../games/tic-tac-toe/types/types.js';

export type MatchStatus =
  | 'LOBBY'
  | 'WAITING_FOR_OPPONENT'
  | 'READY'
  | 'ROUND_IN_PROGRESS'
  | 'ROUND_COMPLETE'
  | 'MATCH_COMPLETE'
  | 'OPPONENT_DISCONNECTED';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type RoundResultType = 'X_WIN' | 'O_WIN' | 'DRAW';
export type SeriesResultType = 'X_WIN' | 'O_WIN' | 'DRAW';

export interface PublicPlayerInfo {
  playerId: string;
  displayName: string;
  symbol: Player;
  connected: boolean;
  ready: boolean;
}

export interface RoomPlayersSummary {
  X?: PublicPlayerInfo;
  O?: PublicPlayerInfo;
}

export interface AuthoritativeMatchState {
  roomId: string;
  matchStatus: MatchStatus;
  currentRound: number; // 1 .. 5
  maxRounds: number;    // 5
  players: RoomPlayersSummary;
  score: ScoreState;
  currentTurn: Player;
  board: (Player | null)[];
  winningLine: WinLine | null;
  roundResult: RoundResultType | null;
  seriesResult: SeriesResultType | null;
  readyForNextRound: {
    X: boolean;
    O: boolean;
  };
  totalTurnsThisRound: number;
}

export type MoveRejectCode =
  | 'NOT_YOUR_TURN'
  | 'GAME_NOT_ACTIVE'
  | 'CELL_OCCUPIED'
  | 'INVALID_POSITION'
  | 'PLAYER_NOT_IN_ROOM'
  | 'ROOM_NOT_FOUND'
  | 'MALFORMED_PAYLOAD';

/* =========================================
 * Client -> Server Messages
 * ========================================= */

export interface CreateRoomMessage {
  type: 'CREATE_ROOM';
  payload: {
    displayName?: string;
  };
}

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  payload: {
    roomId: string;
    displayName?: string;
    playerId?: string;
  };
}

export interface StartGameMessage {
  type: 'START_GAME';
  payload: {
    roomId: string;
    playerId: string;
  };
}

export interface MakeMoveMessage {
  type: 'MAKE_MOVE';
  payload: {
    roomId: string;
    playerId: string;
    position: number;
  };
}

export interface NextRoundReadyMessage {
  type: 'NEXT_ROUND_READY';
  payload: {
    roomId: string;
    playerId: string;
  };
}

export interface PlayAgainMessage {
  type: 'PLAY_AGAIN';
  payload: {
    roomId: string;
    playerId: string;
  };
}

export interface LeaveRoomMessage {
  type: 'LEAVE_ROOM';
  payload: {
    roomId: string;
    playerId: string;
  };
}

export interface PingMessage {
  type: 'PING';
  payload: {
    timestamp: number;
  };
}

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | StartGameMessage
  | MakeMoveMessage
  | NextRoundReadyMessage
  | PlayAgainMessage
  | LeaveRoomMessage
  | PingMessage;

/* =========================================
 * Server -> Client Messages
 * ========================================= */

export interface RoomCreatedMessage {
  type: 'ROOM_CREATED';
  payload: {
    roomId: string;
    playerId: string;
    symbol: Player;
  };
}

export interface RoomJoinedMessage {
  type: 'ROOM_JOINED';
  payload: {
    roomId: string;
    playerId: string;
    symbol: Player;
  };
}

export interface GameStateBroadcast {
  type: 'GAME_STATE';
  payload: AuthoritativeMatchState;
}

export interface MoveRejectedMessage {
  type: 'MOVE_REJECTED';
  payload: {
    reason: string;
    code: MoveRejectCode;
  };
}

export interface PlayerDisconnectedMessage {
  type: 'PLAYER_DISCONNECTED';
  payload: {
    playerId: string;
    symbol: Player;
    gracePeriodSeconds: number;
  };
}

export interface PlayerReconnectedMessage {
  type: 'PLAYER_RECONNECTED';
  payload: {
    playerId: string;
    symbol: Player;
  };
}

export interface RoomClosedMessage {
  type: 'ROOM_CLOSED';
  payload: {
    reason: string;
  };
}

export interface ErrorMessage {
  type: 'ERROR';
  payload: {
    message: string;
    code: string;
  };
}

export interface PongMessage {
  type: 'PONG';
  payload: {
    timestamp: number;
  };
}

export type ServerMessage =
  | RoomCreatedMessage
  | RoomJoinedMessage
  | GameStateBroadcast
  | MoveRejectedMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | RoomClosedMessage
  | ErrorMessage
  | PongMessage;
