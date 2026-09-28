/**
 * Unit Test Suite for Tic Tac Toe Pure Domain Logic Engine
 *
 * Verifies all 11 core engine scenarios:
 * 1. Initial board
 * 2. Valid move
 * 3. Invalid move (already occupied, out of range)
 * 4. Player turn switching
 * 5. Horizontal win
 * 6. Vertical win
 * 7. Diagonal win
 * 8. Draw
 * 9. Move after game over
 * 10. Reset game / round
 * 11. Score update
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDraw,
  checkWin,
  createInitialBoard,
  createInitialState,
  makeMove,
  newGame,
  resetRound,
} from '../logic/engine.js';
import { Board } from '../types/types.js';

test('1. Initial board is completely empty with 9 null cells', () => {
  const board = createInitialBoard();
  assert.equal(board.length, 9);
  assert.ok(board.every((cell) => cell === null));

  const state = createInitialState('X');
  assert.equal(state.currentPlayer, 'X');
  assert.equal(state.status, 'idle');
  assert.equal(state.winner, null);
  assert.equal(state.winningLine, null);
  assert.equal(state.isGameOver, false);
  assert.deepEqual(state.score, { x: 0, o: 0, draws: 0 });
});

test('2. Valid move places player marker into target cell', () => {
  const state = createInitialState('X');
  const result = makeMove(state, 4); // Center cell

  assert.equal(result.success, true);
  assert.equal(result.state.board[4], 'X');
  assert.equal(result.state.moveHistory.length, 1);
  assert.equal(result.state.moveHistory[0].player, 'X');
  assert.equal(result.state.moveHistory[0].position, 4);
});

test('3. Invalid moves are rejected with error explanation', () => {
  const state = createInitialState('X');
  const move1 = makeMove(state, 0);
  assert.equal(move1.success, true);

  // Attempt to place in already occupied cell 0
  const occupiedAttempt = makeMove(move1.state, 0);
  assert.equal(occupiedAttempt.success, false);
  assert.match(occupiedAttempt.error ?? '', /already occupied/);

  // Attempt to place in out-of-range cell
  const outOfRangeNegative = makeMove(move1.state, -1);
  assert.equal(outOfRangeNegative.success, false);
  assert.match(outOfRangeNegative.error ?? '', /Invalid position/);

  const outOfRangeHigh = makeMove(move1.state, 9);
  assert.equal(outOfRangeHigh.success, false);
});

test('4. Player turn switches alternatively between X and O', () => {
  const state0 = createInitialState('X');
  assert.equal(state0.currentPlayer, 'X');

  const move1 = makeMove(state0, 0); // X moves
  assert.equal(move1.state.currentPlayer, 'O');

  const move2 = makeMove(move1.state, 1); // O moves
  assert.equal(move2.state.currentPlayer, 'X');

  const move3 = makeMove(move2.state, 2); // X moves
  assert.equal(move3.state.currentPlayer, 'O');
});

test('5. Horizontal win detection identifies winner and coordinates', () => {
  // Simulate top row win: [0, 1, 2]
  // X: 0, O: 3, X: 1, O: 4, X: 2
  let state = createInitialState('X');
  state = makeMove(state, 0).state; // X
  state = makeMove(state, 3).state; // O
  state = makeMove(state, 1).state; // X
  state = makeMove(state, 4).state; // O
  const winMove = makeMove(state, 2); // X completes [0, 1, 2]

  assert.equal(winMove.success, true);
  assert.equal(winMove.state.status, 'won');
  assert.equal(winMove.state.winner, 'X');
  assert.deepEqual(winMove.state.winningLine, [0, 1, 2]);
  assert.equal(winMove.state.isGameOver, true);
});

test('6. Vertical win detection identifies column victory', () => {
  // Simulate center column win: [1, 4, 7]
  // X: 1, O: 0, X: 4, O: 2, X: 7
  let state = createInitialState('X');
  state = makeMove(state, 1).state; // X
  state = makeMove(state, 0).state; // O
  state = makeMove(state, 4).state; // X
  state = makeMove(state, 2).state; // O
  const winMove = makeMove(state, 7); // X completes [1, 4, 7]

  assert.equal(winMove.state.status, 'won');
  assert.equal(winMove.state.winner, 'X');
  assert.deepEqual(winMove.state.winningLine, [1, 4, 7]);
  assert.equal(winMove.state.isGameOver, true);
});

test('7. Diagonal win detection identifies diagonal victory', () => {
  // Simulate diagonal win: [0, 4, 8]
  // X: 0, O: 1, X: 4, O: 2, X: 8
  let state = createInitialState('X');
  state = makeMove(state, 0).state; // X
  state = makeMove(state, 1).state; // O
  state = makeMove(state, 4).state; // X
  state = makeMove(state, 2).state; // O
  const winMove = makeMove(state, 8); // X completes [0, 4, 8]

  assert.equal(winMove.state.status, 'won');
  assert.equal(winMove.state.winner, 'X');
  assert.deepEqual(winMove.state.winningLine, [0, 4, 8]);
  assert.equal(winMove.state.isGameOver, true);
});

test('8. Draw is triggered when board is full with no winner', () => {
  // Cat's game sequence:
  // X O X
  // X X O
  // O X O
  // 0:X, 1:O, 2:X, 3:X, 4:X, 5:O, 6:O, 7:X, 8:O
  const drawBoard: Board = [
    'X', 'O', 'X',
    'X', 'X', 'O',
    'O', 'X', 'O',
  ];

  assert.equal(checkWin(drawBoard), null);
  assert.equal(checkDraw(drawBoard, false), true);

  // Play through state
  let state = createInitialState('X');
  const sequence = [0, 1, 2, 5, 3, 6, 4, 8, 7];
  for (let i = 0; i < sequence.length; i++) {
    state = makeMove(state, sequence[i]).state;
  }

  assert.equal(state.status, 'draw');
  assert.equal(state.winner, null);
  assert.equal(state.isGameOver, true);
  assert.equal(state.score.draws, 1);
});

test('9. Move after game over is strictly prevented', () => {
  let state = createInitialState('X');
  state = makeMove(state, 0).state; // X
  state = makeMove(state, 3).state; // O
  state = makeMove(state, 1).state; // X
  state = makeMove(state, 4).state; // O
  state = makeMove(state, 2).state; // X wins [0, 1, 2]

  assert.equal(state.isGameOver, true);

  // Attempt move after game over
  const illegalMove = makeMove(state, 8);
  assert.equal(illegalMove.success, false);
  assert.match(illegalMove.error ?? '', /already over/);
});

test('10. Reset round preserves match scores while clearing board', () => {
  let state = createInitialState('X');
  state = makeMove(state, 0).state; // X
  state = makeMove(state, 3).state; // O
  state = makeMove(state, 1).state; // X
  state = makeMove(state, 4).state; // O
  state = makeMove(state, 2).state; // X wins -> score.x is 1

  assert.equal(state.score.x, 1);
  assert.equal(state.round, 1);

  // Reset round
  const nextRoundState = resetRound(state);
  assert.equal(nextRoundState.round, 2);
  assert.equal(nextRoundState.isGameOver, false);
  assert.equal(nextRoundState.winner, null);
  assert.equal(nextRoundState.winningLine, null);
  assert.equal(nextRoundState.score.x, 1); // Score preserved!
  assert.ok(nextRoundState.board.every((cell) => cell === null));

  // New game resets everything
  const brandNewGame = newGame('X');
  assert.equal(brandNewGame.round, 1);
  assert.equal(brandNewGame.score.x, 0);
  assert.equal(brandNewGame.score.o, 0);
  assert.equal(brandNewGame.score.draws, 0);
});

test('11. Score updates correctly across multiple matches', () => {
  let state = createInitialState('X');

  // Match 1: X wins
  state = makeMove(state, 0).state; // X
  state = makeMove(state, 3).state; // O
  state = makeMove(state, 1).state; // X
  state = makeMove(state, 4).state; // O
  state = makeMove(state, 2).state; // X wins
  assert.deepEqual(state.score, { x: 1, o: 0, draws: 0 });

  // Start round 2
  state = resetRound(state, 'O');
  assert.equal(state.currentPlayer, 'O');

  // Match 2: O wins (0, 1, 2)
  state = makeMove(state, 0).state; // O
  state = makeMove(state, 3).state; // X
  state = makeMove(state, 1).state; // O
  state = makeMove(state, 4).state; // X
  state = makeMove(state, 2).state; // O wins
  assert.deepEqual(state.score, { x: 1, o: 1, draws: 0 });
});
