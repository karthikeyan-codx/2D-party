/**
 * NEX PLAY - Tic Tac Toe Domain Types
 * Completely isolated from UI framework and network protocols.
 */

export type Player = 'X' | 'O';

export type CellValue = Player | null;

export type Board = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];

export type WinLine = [number, number, number];

export type GameStatus = 'idle' | 'in-progress' | 'won' | 'draw';

export interface ScoreState {
  x: number;
  o: number;
  draws: number;
}

export interface MoveRecord {
  player: Player;
  position: number;
  timestamp: number;
}

export interface TicTacToeState {
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: WinLine | null;
  round: number;
  maxRounds: number;
  score: ScoreState;
  moveHistory: MoveRecord[];
  isGameOver: boolean;
}

export interface MoveResult {
  success: boolean;
  error?: string;
  state: TicTacToeState;
}

export interface PlayerInfo {
  id: string;
  name: string;
  symbol: Player;
  isHost: boolean;
}
