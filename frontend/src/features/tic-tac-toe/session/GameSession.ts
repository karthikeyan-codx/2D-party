/**
 * NEX PLAY - Game Session Abstraction
 *
 * Provides a clean contract separating the UI layer from game execution.
 * Allows seamless switching from Local Engine (current phase) to
 * WebSocket Game Server (future multiplayer phase) with zero UI rewrites.
 */

import {
  MoveResult,
  TicTacToeState,
} from '@games/tic-tac-toe/types/types';

export interface IGameSession {
  /**
   * Retrieves the current snapshot of game state.
   */
  getState(): TicTacToeState;

  /**
   * Dispatches a player move at the board index (0 - 8).
   */
  makeMove(position: number): MoveResult;

  /**
   * Starts the next round while preserving scores.
   */
  resetRound(): TicTacToeState;

  /**
   * Resets the entire match including scores.
   */
  newMatch(): TicTacToeState;

  /**
   * Subscribes to state updates (supports reactive sync for both local state & WebSockets).
   */
  subscribe(listener: (state: TicTacToeState) => void): () => void;
}
