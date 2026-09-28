/**
 * NEX PLAY - Tic Tac Toe Game Configuration
 *
 * Isolated configuration specification defining player requirements,
 * timing rules, and metadata for platform registration.
 */

export interface GameConfig {
  id: string;
  name: string;
  slug: string;
  version: string;
  category: 'casual' | 'strategy' | 'action' | 'puzzle';
  players: {
    min: number;
    max: number;
    recommended: number;
  };
  modes: ('single-player' | 'pass-and-play' | 'online-multiplayer')[];
  turnDurationSeconds: number;
  totalRoundsDefault: number;
  isTurnBased: boolean;
  gridSize: {
    rows: number;
    cols: number;
  };
}

export const ticTacToeConfig: GameConfig = {
  id: 'game-tic-tac-toe',
  name: 'Tic Tac Toe',
  slug: 'tic-tac-toe',
  version: '1.0.0',
  category: 'casual',
  players: {
    min: 2,
    max: 2,
    recommended: 2,
  },
  modes: ['single-player', 'pass-and-play', 'online-multiplayer'],
  turnDurationSeconds: 30,
  totalRoundsDefault: 5,
  isTurnBased: true,
  gridSize: {
    rows: 3,
    cols: 3,
  },
};

export default ticTacToeConfig;
