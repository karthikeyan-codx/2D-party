/**
 * Tests for Local 2-Player Mode
 * Verifies all 18 lifecycle rules, turn alternation, Best-of-5 cap, and zero network dependency.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LocalGameSession } from '../modes/local/localSession.js';

describe('Tic Tac Toe - Local 2 Player Mode', () => {
  it('1 & 2 & 3 & 4. Starts with default names Player 1 (X) and Player 2 (O)', () => {
    const session = new LocalGameSession();
    const state = session.getState();
    assert.strictEqual(state.player1.name, 'Player 1');
    assert.strictEqual(state.player1.symbol, 'X');
    assert.strictEqual(state.player2.name, 'Player 2');
    assert.strictEqual(state.player2.symbol, 'O');
    assert.strictEqual(state.matchStatus, 'SETUP');
  });

  it('5 & 6. Player 1 starts as X and turn alternates correctly', () => {
    const session = new LocalGameSession();
    session.startMatch();
    let state = session.getState();
    assert.strictEqual(state.currentRound, 1);
    assert.strictEqual(state.currentTurn, 'X');
    assert.strictEqual(state.matchStatus, 'ROUND_IN_PROGRESS');

    // Move 1: X moves at 0
    assert.strictEqual(session.makeMove(0), true);
    state = session.getState();
    assert.strictEqual(state.board[0], 'X');
    assert.strictEqual(state.currentTurn, 'O');

    // Move 2: O moves at 1
    assert.strictEqual(session.makeMove(1), true);
    state = session.getState();
    assert.strictEqual(state.board[1], 'O');
    assert.strictEqual(state.currentTurn, 'X');
  });

  it('7. Invalid occupied-cell and out-of-bound moves are rejected', () => {
    const session = new LocalGameSession();
    session.startMatch();
    session.makeMove(0); // X at 0
    // Try to move again at 0
    assert.strictEqual(session.makeMove(0), false);
    // Try out of bounds
    assert.strictEqual(session.makeMove(9), false);
    assert.strictEqual(session.makeMove(-1), false);
  });

  it('8 & 11. X win works and score updates', () => {
    const session = new LocalGameSession('Alice', 'Bob');
    session.startMatch('Alice', 'Bob');
    // X wins top row: 0, 1, 2
    session.makeMove(0); // X
    session.makeMove(3); // O
    session.makeMove(1); // X
    session.makeMove(4); // O
    session.makeMove(2); // X wins!

    const state = session.getState();
    assert.strictEqual(state.roundResult, 'X_WIN');
    assert.strictEqual(state.winner, 'X');
    assert.strictEqual(state.winnerName, 'Alice');
    assert.deepStrictEqual(state.winningLine, [0, 1, 2]);
    assert.strictEqual(state.score.x, 1);
    assert.strictEqual(state.score.o, 0);
    assert.strictEqual(state.matchStatus, 'ROUND_COMPLETE');
  });

  it('9. O win works and round result shows O_WIN', () => {
    const session = new LocalGameSession();
    session.startMatch();
    // X at 0, O at 3, X at 1, O at 4, X at 8, O at 5 (O wins middle row 3, 4, 5)
    session.makeMove(0); // X
    session.makeMove(3); // O
    session.makeMove(1); // X
    session.makeMove(4); // O
    session.makeMove(8); // X
    session.makeMove(5); // O wins!

    const state = session.getState();
    assert.strictEqual(state.roundResult, 'O_WIN');
    assert.strictEqual(state.winner, 'O');
    assert.strictEqual(state.winnerName, 'Player 2');
    assert.deepStrictEqual(state.winningLine, [3, 4, 5]);
    assert.strictEqual(state.score.o, 1);
    assert.strictEqual(state.matchStatus, 'ROUND_COMPLETE');
  });

  it('10. Draw works when board is full with no winner', () => {
    const session = new LocalGameSession();
    session.startMatch();
    // Board:
    // X O X
    // X O O
    // O X X
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const m of moves) {
      session.makeMove(m);
    }
    const state = session.getState();
    assert.strictEqual(state.roundResult, 'DRAW');
    assert.strictEqual(state.winner, null);
    assert.strictEqual(state.score.draws, 1);
    assert.strictEqual(state.matchStatus, 'ROUND_COMPLETE');
  });

  it('14 & 15. Player reaching 3 round wins immediately ends match with MATCH_COMPLETE', () => {
    const session = new LocalGameSession('Player 1', 'Player 2');
    session.startMatch();

    // Helper to simulate a fast X win
    const winForX = () => {
      // Row 0, 1, 2
      session.makeMove(0); // X
      session.makeMove(3); // O
      session.makeMove(1); // X
      session.makeMove(4); // O
      session.makeMove(2); // X
    };

    // Round 1: X wins
    winForX();
    assert.strictEqual(session.getState().score.x, 1);
    assert.strictEqual(session.getState().matchStatus, 'ROUND_COMPLETE');

    // Round 2: next round -> X wins again
    session.nextRound();
    // Round 2 starter is O. Let O play 3, X play 0, O play 4, X play 1, O play 8, X play 2
    session.makeMove(3); // O
    session.makeMove(0); // X
    session.makeMove(4); // O
    session.makeMove(1); // X
    session.makeMove(8); // O
    session.makeMove(2); // X wins!
    assert.strictEqual(session.getState().score.x, 2);
    assert.strictEqual(session.getState().matchStatus, 'ROUND_COMPLETE');

    // Round 3: next round -> X wins 3rd time
    session.nextRound();
    winForX();
    const finalState = session.getState();
    assert.strictEqual(finalState.score.x, 3);
    assert.strictEqual(finalState.matchStatus, 'MATCH_COMPLETE');
    assert.strictEqual(finalState.seriesResult, 'X_WIN');
    assert.strictEqual(finalState.currentRound, 3);

    // Cannot start round 4 because match is complete
    assert.strictEqual(session.nextRound(), false);
  });

  it('12 & 13. Hard 5-Round limit: Round never becomes 6, match ends after Round 5', () => {
    const session = new LocalGameSession();
    session.startMatch();

    // Helper to play a draw
    const playDraw = () => {
      const isXStart = session.getState().currentTurn === 'X';
      // Moves that result in a draw regardless of starter:
      // Board:
      // 0 1 2
      // 3 4 5
      // 6 7 8
      if (isXStart) {
        // X O X / X O O / O X X
        [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((m) => session.makeMove(m));
      } else {
        // O X O / O X X / X O O
        [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((m) => session.makeMove(m));
      }
    };

    // Round 1
    playDraw();
    assert.strictEqual(session.getState().currentRound, 1);
    session.nextRound();

    // Round 2
    playDraw();
    assert.strictEqual(session.getState().currentRound, 2);
    session.nextRound();

    // Round 3
    playDraw();
    assert.strictEqual(session.getState().currentRound, 3);
    session.nextRound();

    // Round 4
    playDraw();
    assert.strictEqual(session.getState().currentRound, 4);
    session.nextRound();

    // Round 5
    assert.strictEqual(session.getState().currentRound, 5);
    playDraw();

    const afterRound5 = session.getState();
    assert.strictEqual(afterRound5.currentRound, 5);
    assert.strictEqual(afterRound5.matchStatus, 'MATCH_COMPLETE');
    assert.strictEqual(afterRound5.seriesResult, 'DRAW');

    // Attempting next round must be rejected
    assert.strictEqual(session.nextRound(), false);
    assert.strictEqual(session.getState().currentRound, 5);
  });

  it('16. Play Again resets scores and series back to Round 1', () => {
    const session = new LocalGameSession('Player 1', 'Player 2');
    session.startMatch();
    // Quick win
    session.makeMove(0);
    session.makeMove(3);
    session.makeMove(1);
    session.makeMove(4);
    session.makeMove(2);

    session.playAgain();
    const state = session.getState();
    assert.strictEqual(state.currentRound, 1);
    assert.strictEqual(state.score.x, 0);
    assert.strictEqual(state.score.o, 0);
    assert.strictEqual(state.matchStatus, 'ROUND_IN_PROGRESS');
    assert.strictEqual(state.currentTurn, 'X');
    assert.strictEqual(state.player1.name, 'Player 1');
    assert.strictEqual(state.player2.name, 'Player 2');
  });

  it('17. Return to setup / mode select works', () => {
    const session = new LocalGameSession();
    session.startMatch();
    session.makeMove(0);
    session.resetToSetup();
    const state = session.getState();
    assert.strictEqual(state.matchStatus, 'SETUP');
    assert.strictEqual(state.currentRound, 1);
    assert.strictEqual(state.score.x, 0);
  });

  it('18. Name customization and whitespace trimming', () => {
    const session = new LocalGameSession('   Karthik   ', '   ');
    assert.strictEqual(session.getState().player1.name, 'Karthik');
    assert.strictEqual(session.getState().player2.name, 'Player 2'); // fallback for empty
  });
});
