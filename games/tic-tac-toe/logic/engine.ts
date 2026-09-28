/**
 * NEX PLAY - Tic Tac Toe Pure Domain Logic Engine
 *
 * Fully deterministic, isolated state machine.
 * Zero DOM manipulation, zero UI or network dependencies.
 */

import {
  Board,
  MoveRecord,
  MoveResult,
  Player,
  ScoreState,
  TicTacToeState,
  WinLine,
} from '../types/types.js';

export const WINNING_LINES: readonly WinLine[] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Creates a clean, empty 3x3 board.
 */
export function createInitialBoard(): Board {
  return [null, null, null, null, null, null, null, null, null];
}

/**
 * Creates an empty score state.
 */
export function createInitialScore(): ScoreState {
  return {
    x: 0,
    o: 0,
    draws: 0,
  };
}

/**
 * Creates the initial game state.
 */
export function createInitialState(
  startingPlayer: Player = 'X',
  maxRounds: number = 5
): TicTacToeState {
  return {
    board: createInitialBoard(),
    currentPlayer: startingPlayer,
    status: 'idle',
    winner: null,
    winningLine: null,
    round: 1,
    maxRounds,
    score: createInitialScore(),
    moveHistory: [],
    isGameOver: false,
  };
}

/**
 * Checks if the given board has a winning line.
 */
export function checkWin(board: Board): { winner: Player; line: WinLine } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cellA = board[a];
    if (cellA !== null && cellA === board[b] && cellA === board[c]) {
      return { winner: cellA, line };
    }
  }
  return null;
}

/**
 * Checks if the board is completely filled without a winner.
 */
export function checkDraw(board: Board, hasWinner: boolean): boolean {
  if (hasWinner) return false;
  return board.every((cell) => cell !== null);
}

/**
 * Validates whether a move can be placed at the target index.
 */
export function isValidMove(state: TicTacToeState, position: number): { valid: boolean; reason?: string } {
  if (state.isGameOver) {
    return { valid: false, reason: 'Game is already over. Reset to play another round.' };
  }

  if (!Number.isInteger(position) || position < 0 || position > 8) {
    return { valid: false, reason: `Invalid position ${position}. Must be between 0 and 8.` };
  }

  if (state.board[position] !== null) {
    return { valid: false, reason: `Cell ${position} is already occupied by ${state.board[position]}.` };
  }

  return { valid: true };
}

/**
 * Pure transition: Executes a move on the state and returns a new state object.
 */
export function makeMove(state: TicTacToeState, position: number): MoveResult {
  const validation = isValidMove(state, position);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
      state,
    };
  }

  // Clone board and apply move
  const nextBoard = [...state.board] as Board;
  nextBoard[position] = state.currentPlayer;

  const moveRecord: MoveRecord = {
    player: state.currentPlayer,
    position,
    timestamp: Date.now(),
  };

  const nextMoveHistory = [...state.moveHistory, moveRecord];
  const winCheck = checkWin(nextBoard);
  const isDraw = checkDraw(nextBoard, winCheck !== null);

  if (winCheck) {
    const nextScore: ScoreState = {
      ...state.score,
      [state.currentPlayer.toLowerCase() as 'x' | 'o']:
        state.score[state.currentPlayer.toLowerCase() as 'x' | 'o'] + 1,
    };

    return {
      success: true,
      state: {
        ...state,
        board: nextBoard,
        status: 'won',
        winner: winCheck.winner,
        winningLine: winCheck.line,
        isGameOver: true,
        score: nextScore,
        moveHistory: nextMoveHistory,
      },
    };
  }

  if (isDraw) {
    const nextScore: ScoreState = {
      ...state.score,
      draws: state.score.draws + 1,
    };

    return {
      success: true,
      state: {
        ...state,
        board: nextBoard,
        status: 'draw',
        winner: null,
        winningLine: null,
        isGameOver: true,
        score: nextScore,
        moveHistory: nextMoveHistory,
      },
    };
  }

  // Next player's turn
  const nextPlayer: Player = state.currentPlayer === 'X' ? 'O' : 'X';

  return {
    success: true,
    state: {
      ...state,
      board: nextBoard,
      currentPlayer: nextPlayer,
      status: 'in-progress',
      moveHistory: nextMoveHistory,
    },
  };
}

/**
 * Resets the board for the next round while preserving match scores.
 */
export function resetRound(state: TicTacToeState, startingPlayer?: Player): TicTacToeState {
  const nextStartingPlayer: Player =
    startingPlayer ?? (state.round % 2 === 0 ? 'X' : 'O');

  return {
    ...state,
    board: createInitialBoard(),
    currentPlayer: nextStartingPlayer,
    status: 'in-progress',
    winner: null,
    winningLine: null,
    round: state.round + 1,
    moveHistory: [],
    isGameOver: false,
  };
}

/**
 * Completely resets the game session including all scores.
 */
export function newGame(startingPlayer: Player = 'X', maxRounds: number = 5): TicTacToeState {
  return createInitialState(startingPlayer, maxRounds);
}
