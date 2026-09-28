/**
 * NEX PLAY - Tic Tac Toe Local 2-Player Session Adapter
 *
 * Implements local pass-and-play on a single device.
 * Reuses the authoritative TicTacToeEngine logic (zero duplicate rules).
 * Pure in-memory state with zero network / WebSocket dependencies.
 */

import {
  Board,
  Player,
  ScoreState,
  TicTacToeState,
  WinLine,
} from '../../types/types.js';
import {
  createInitialBoard,
  createInitialScore,
  makeMove as engineMakeMove,
} from '../../logic/engine.js';

export type LocalMatchStatus =
  | 'SETUP'
  | 'ROUND_IN_PROGRESS'
  | 'ROUND_COMPLETE'
  | 'MATCH_COMPLETE';

export type LocalRoundResult = 'X_WIN' | 'O_WIN' | 'DRAW' | null;
export type LocalSeriesResult = 'X_WIN' | 'O_WIN' | 'DRAW' | null;

export interface LocalPlayerConfig {
  name: string;
  symbol: Player;
}

export interface LocalMatchState {
  mode: 'LOCAL';
  player1: LocalPlayerConfig;
  player2: LocalPlayerConfig;
  currentRound: number; // 1 .. 5
  maxRounds: number; // strictly 5
  score: ScoreState;
  board: Board;
  currentTurn: Player;
  roundStarter: Player;
  matchStatus: LocalMatchStatus;
  roundResult: LocalRoundResult;
  seriesResult: LocalSeriesResult;
  winningLine: WinLine | null;
  winner: Player | null;
  winnerName: string | null;
  totalTurnsThisRound: number;
}

export type LocalStateListener = (state: LocalMatchState) => void;

export class LocalGameSession {
  private state: LocalMatchState;
  private listeners: Set<LocalStateListener> = new Set();

  constructor(player1Name = 'Player 1', player2Name = 'Player 2') {
    const p1 = this.sanitizeName(player1Name, 'Player 1');
    const p2 = this.sanitizeName(player2Name, 'Player 2');

    this.state = {
      mode: 'LOCAL',
      player1: { name: p1, symbol: 'X' },
      player2: { name: p2, symbol: 'O' },
      currentRound: 1,
      maxRounds: 5,
      score: createInitialScore(),
      board: createInitialBoard(),
      currentTurn: 'X',
      roundStarter: 'X',
      matchStatus: 'SETUP',
      roundResult: null,
      seriesResult: null,
      winningLine: null,
      winner: null,
      winnerName: null,
      totalTurnsThisRound: 0,
    };
  }

  public getState(): Readonly<LocalMatchState> {
    return this.state;
  }

  public subscribe(listener: LocalStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = { ...this.state };
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  public sanitizeName(name: string, fallback: string): string {
    const trimmed = name?.trim() || '';
    if (!trimmed) return fallback;
    return trimmed.slice(0, 18);
  }

  /**
   * Starts a new match with configured player names.
   */
  public startMatch(p1Name?: string, p2Name?: string): void {
    const p1 = this.sanitizeName(p1Name ?? this.state.player1.name, 'Player 1');
    const p2 = this.sanitizeName(p2Name ?? this.state.player2.name, 'Player 2');

    this.state = {
      ...this.state,
      player1: { name: p1, symbol: 'X' },
      player2: { name: p2, symbol: 'O' },
      currentRound: 1,
      maxRounds: 5,
      score: createInitialScore(),
      board: createInitialBoard(),
      currentTurn: 'X',
      roundStarter: 'X',
      matchStatus: 'ROUND_IN_PROGRESS',
      roundResult: null,
      seriesResult: null,
      winningLine: null,
      winner: null,
      winnerName: null,
      totalTurnsThisRound: 0,
    };

    this.notify();
  }

  /**
   * Executes a move on the board using the shared TicTacToeEngine.
   */
  public makeMove(position: number): boolean {
    if (this.state.matchStatus !== 'ROUND_IN_PROGRESS') {
      return false;
    }

    if (position < 0 || position > 8 || this.state.board[position] !== null) {
      return false;
    }

    // Construct engine state wrapper
    const engineState: TicTacToeState = {
      board: [...this.state.board] as Board,
      currentPlayer: this.state.currentTurn,
      status: 'in-progress',
      winner: null,
      winningLine: null,
      round: this.state.currentRound,
      maxRounds: this.state.maxRounds,
      score: { ...this.state.score },
      moveHistory: [],
      isGameOver: false,
    };

    const moveResult = engineMakeMove(engineState, position);
    if (!moveResult.success) {
      return false;
    }

    const nextTurns = this.state.totalTurnsThisRound + 1;
    const isOver = moveResult.state.isGameOver;

    if (isOver) {
      const isWon = moveResult.state.status === 'won';
      const winner = moveResult.state.winner;
      const roundResult: LocalRoundResult = isWon
        ? winner === 'X'
          ? 'X_WIN'
          : 'O_WIN'
        : 'DRAW';

      const winnerName = isWon
        ? winner === 'X'
          ? this.state.player1.name
          : this.state.player2.name
        : null;

      const nextScore = moveResult.state.score;

      // Check Best-of-5 Series End Conditions:
      // 1. Any player reaches 3 wins
      // 2. Or currentRound reaches 5 (the hard limit)
      let nextMatchStatus: LocalMatchStatus = 'ROUND_COMPLETE';
      let nextSeriesResult: LocalSeriesResult = null;

      if (nextScore.x >= 3) {
        nextMatchStatus = 'MATCH_COMPLETE';
        nextSeriesResult = 'X_WIN';
      } else if (nextScore.o >= 3) {
        nextMatchStatus = 'MATCH_COMPLETE';
        nextSeriesResult = 'O_WIN';
      } else if (this.state.currentRound >= 5) {
        nextMatchStatus = 'MATCH_COMPLETE';
        if (nextScore.x > nextScore.o) {
          nextSeriesResult = 'X_WIN';
        } else if (nextScore.o > nextScore.x) {
          nextSeriesResult = 'O_WIN';
        } else {
          nextSeriesResult = 'DRAW';
        }
      }

      this.state = {
        ...this.state,
        board: moveResult.state.board,
        score: nextScore,
        roundResult,
        seriesResult: nextSeriesResult,
        winningLine: moveResult.state.winningLine,
        winner,
        winnerName,
        totalTurnsThisRound: nextTurns,
        matchStatus: nextMatchStatus,
      };
    } else {
      this.state = {
        ...this.state,
        board: moveResult.state.board,
        currentTurn: moveResult.state.currentPlayer,
        totalTurnsThisRound: nextTurns,
      };
    }

    this.notify();
    return true;
  }

  /**
   * Advances to the next round if the match is not complete and currentRound < 5.
   */
  public nextRound(): boolean {
    if (this.state.matchStatus !== 'ROUND_COMPLETE') {
      return false;
    }

    if (
      this.state.currentRound >= 5 ||
      this.state.score.x >= 3 ||
      this.state.score.o >= 3
    ) {
      return false;
    }

    const nextRound = this.state.currentRound + 1;
    // Alternate starting player each round
    const nextStarter: Player = nextRound % 2 === 1 ? 'X' : 'O';

    this.state = {
      ...this.state,
      currentRound: nextRound,
      roundStarter: nextStarter,
      currentTurn: nextStarter,
      board: createInitialBoard(),
      matchStatus: 'ROUND_IN_PROGRESS',
      roundResult: null,
      winningLine: null,
      winner: null,
      winnerName: null,
      totalTurnsThisRound: 0,
    };

    this.notify();
    return true;
  }

  /**
   * Resets the entire match for Play Again, keeping the player names.
   */
  public playAgain(): void {
    this.state = {
      ...this.state,
      currentRound: 1,
      score: createInitialScore(),
      board: createInitialBoard(),
      roundStarter: 'X',
      currentTurn: 'X',
      matchStatus: 'ROUND_IN_PROGRESS',
      roundResult: null,
      seriesResult: null,
      winningLine: null,
      winner: null,
      winnerName: null,
      totalTurnsThisRound: 0,
    };

    this.notify();
  }

  /**
   * Resets state back to mode setup.
   */
  public resetToSetup(): void {
    this.state = {
      ...this.state,
      matchStatus: 'SETUP',
      currentRound: 1,
      score: createInitialScore(),
      board: createInitialBoard(),
      roundResult: null,
      seriesResult: null,
      winningLine: null,
      winner: null,
      winnerName: null,
      totalTurnsThisRound: 0,
    };

    this.notify();
  }
}
