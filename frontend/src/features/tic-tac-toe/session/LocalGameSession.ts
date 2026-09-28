/**
 * Local Game Session Adapter
 * Wraps the isolated Tic Tac Toe domain engine.
 */

import {
  createInitialState,
  makeMove as engineMakeMove,
  newGame as engineNewGame,
  resetRound as engineResetRound,
} from '@games/tic-tac-toe/logic/engine';
import {
  MoveResult,
  Player,
  TicTacToeState,
} from '@games/tic-tac-toe/types/types';
import { IGameSession } from './GameSession.js';

export class LocalGameSession implements IGameSession {
  private state: TicTacToeState;
  private listeners: Set<(state: TicTacToeState) => void> = new Set();

  constructor(startingPlayer: Player = 'X', maxRounds: number = 5) {
    this.state = createInitialState(startingPlayer, maxRounds);
  }

  public getState(): TicTacToeState {
    return this.state;
  }

  public makeMove(position: number): MoveResult {
    const result = engineMakeMove(this.state, position);
    if (result.success) {
      this.state = result.state;
      this.notifyListeners();
    }
    return result;
  }

  public resetRound(): TicTacToeState {
    this.state = engineResetRound(this.state);
    this.notifyListeners();
    return this.state;
  }

  public newMatch(): TicTacToeState {
    this.state = engineNewGame('X', this.state.maxRounds);
    this.notifyListeners();
    return this.state;
  }

  public subscribe(listener: (state: TicTacToeState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
