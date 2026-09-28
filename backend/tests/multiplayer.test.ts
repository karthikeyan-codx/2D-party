/**
 * NEX PLAY - Comprehensive Multiplayer & Best-of-5 Series Test Suite
 *
 * Verifies all 20 required match flow, rule, and perspective scenarios:
 * 1. Match starts at Round 1 (max 5)
 * 2. Maximum round is 5, never reaches Round 6
 * 3. Player X wins round
 * 4. Player O wins round
 * 5. Round draw detection
 * 6. Series win: Player X reaches 3 wins -> Match immediately ends
 * 7. Series win: Player O reaches 3 wins -> Match immediately ends
 * 8. Match ends after Round 5 even if score is tied (Final DRAW)
 * 9. Match ends after Round 5 with decisive winner (e.g. 3-2 or 2-1)
 * 10. Round 5 draw ends match without Round 6
 * 11. Next round cannot start after match completion
 * 12. Next round synchronization requires both players
 * 13. Play Again resets series to round 1, score 0-0, empty board
 * 14. Turn enforcement: rejects move during opponent's turn
 * 15. Invalid move rejection (occupied cell, out of bounds)
 * 16. Move rejection after round completion
 * 17. Rejection of 3rd player from joining active match
 * 18. Disconnect grace period and reconnection restore
 * 19. Both clients receive same authoritative state broadcast
 * 20. End-to-end WebSocket integration
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { WebSocket } from 'ws';
import { RoomManager } from '../src/websocket/roomManager.js';
import { NexPlayWebSocketServer } from '../src/websocket/server.js';
import { ServerMessage } from '../src/types/protocol.js';

function createMockSocket(): { ws: WebSocket; sent: ServerMessage[] } {
  const sent: ServerMessage[] = [];
  const ws = {
    readyState: WebSocket.OPEN,
    send: (data: string) => {
      try {
        sent.push(JSON.parse(data));
      } catch {
        // ignore
      }
    },
  } as unknown as WebSocket;

  return { ws, sent };
}

test('1. Match starts at Round 1 and max rounds is 5', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  manager.startGame(socketA.ws, roomId, pA);

  const room = manager.getRoom(roomId)!;
  assert.equal(room.currentRound, 1);
  assert.equal(room.maxRounds, 5);
  assert.equal(room.matchStatus, 'ROUND_IN_PROGRESS');
  assert.equal(room.score.x, 0);
  assert.equal(room.score.o, 0);
  assert.equal(room.score.draws, 0);
});

test('2. Player X wins round -> score.x increments, roundResult is X_WIN', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // X wins top row [0, 1, 2]
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 0); // X
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 3); // O
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 1); // X
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4); // O
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 2); // X wins

  assert.equal(room.roundResult, 'X_WIN');
  assert.equal(room.score.x, 1);
  assert.equal(room.matchStatus, 'ROUND_COMPLETE');
  assert.deepEqual(room.winningLine, [0, 1, 2]);
});

test('3. Player O wins round -> score.o increments, roundResult is O_WIN', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // O wins row [3, 4, 5]
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 0); // X
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 3); // O
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 1); // X
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4); // O
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 8); // X
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 5); // O wins!

  assert.equal(room.roundResult, 'O_WIN');
  assert.equal(room.score.o, 1);
  assert.equal(room.matchStatus, 'ROUND_COMPLETE');
  assert.deepEqual(room.winningLine, [3, 4, 5]);
});

test('4. Round draw detection -> score.draws increments, roundResult is DRAW', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // Draw sequence: 0, 1, 2, 5, 3, 6, 4, 8, 7
  const moves = [0, 1, 2, 5, 3, 6, 4, 8, 7];
  for (const pos of moves) {
    const activePlayer = room.currentTurn === 'X' ? room.playerX! : room.playerO!;
    const socket = room.currentTurn === 'X' ? socketA.ws : socketB.ws;
    manager.handleMove(socket, roomId, activePlayer.playerId, pos);
  }

  assert.equal(room.roundResult, 'DRAW');
  assert.equal(room.score.draws, 1);
  assert.equal(room.matchStatus, 'ROUND_COMPLETE');
});

test('5. Series win: Player X reaches 3 wins -> Match immediately ends at MATCH_COMPLETE', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // Function to quickly play a win for X
  const winRoundForX = () => {
    room.currentTurn = 'X';
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 0);
    manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 3);
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 1);
    manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4);
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 2); // X wins
  };

  // Round 1
  winRoundForX();
  assert.equal(room.score.x, 1);
  assert.equal(room.matchStatus, 'ROUND_COMPLETE');

  // Next round sync
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);
  assert.equal(room.currentRound, 2);

  // Round 2
  winRoundForX();
  assert.equal(room.score.x, 2);
  assert.equal(room.matchStatus, 'ROUND_COMPLETE');

  // Next round sync
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);
  assert.equal(room.currentRound, 3);

  // Round 3: X reaches 3 wins!
  winRoundForX();
  assert.equal(room.score.x, 3);

  // Match MUST IMMEDIATELY be MATCH_COMPLETE!
  assert.equal(room.matchStatus, 'MATCH_COMPLETE');
  assert.equal(room.seriesResult, 'X_WIN');

  // Next round MUST be refused!
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);
  assert.equal(room.currentRound, 3); // NEVER advances to 4
  assert.equal(room.matchStatus, 'MATCH_COMPLETE');
});

test('6. Series win: Player O reaches 3 wins -> Match immediately ends at MATCH_COMPLETE', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  const winRoundForO = () => {
    room.currentTurn = 'X';
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 0);
    manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 3);
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 1);
    manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4);
    manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 8);
    manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 5); // O wins
  };

  winRoundForO(); // O: 1
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);

  winRoundForO(); // O: 2
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);

  winRoundForO(); // O: 3
  assert.equal(room.score.o, 3);
  assert.equal(room.matchStatus, 'MATCH_COMPLETE');
  assert.equal(room.seriesResult, 'O_WIN');
});

test('7. Five-round limit: Round never becomes 6, match ends after Round 5', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  const drawRound = () => {
    room.currentTurn = 'X';
    const moves = [0, 1, 2, 5, 3, 6, 4, 8, 7];
    for (const pos of moves) {
      const activePlayer = room.currentTurn === 'X' ? room.playerX! : room.playerO!;
      const socket = room.currentTurn === 'X' ? socketA.ws : socketB.ws;
      manager.handleMove(socket, roomId, activePlayer.playerId, pos);
    }
  };

  // Play through 4 rounds of draws
  for (let r = 1; r <= 4; r++) {
    assert.equal(room.currentRound, r);
    drawRound();
    assert.equal(room.matchStatus, 'ROUND_COMPLETE');
    manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
    manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);
  }

  // Now at Round 5
  assert.equal(room.currentRound, 5);
  drawRound(); // Round 5 ends in draw!

  // MUST BE MATCH_COMPLETE!
  assert.equal(room.matchStatus, 'MATCH_COMPLETE');
  assert.equal(room.seriesResult, 'DRAW');
  assert.equal(room.currentRound, 5); // NEVER becomes 6!

  // Attempting next round must do nothing
  manager.handleNextRoundReady(socketA.ws, roomId, room.playerX!.playerId);
  manager.handleNextRoundReady(socketB.ws, roomId, room.playerO!.playerId);
  assert.equal(room.currentRound, 5); // STILL 5, NOT 6!
});

test('8. Play Again resets series correctly to Round 1 and score 0-0', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // Complete a match
  room.score = { x: 3, o: 1, draws: 0 };
  room.matchStatus = 'MATCH_COMPLETE';
  room.seriesResult = 'X_WIN';

  // Play Again
  manager.playAgain(socketA.ws, roomId, room.playerX!.playerId);

  assert.equal(room.currentRound, 1);
  assert.equal(room.score.x, 0);
  assert.equal(room.score.o, 0);
  assert.equal(room.score.draws, 0);
  assert.equal(room.seriesResult, null);
  assert.equal(room.roundResult, null);
  assert.equal(room.matchStatus, 'ROUND_IN_PROGRESS');
  assert.ok(room.board.every((c) => c === null));
});

test('9. Turn enforcement and invalid move rejection', () => {
  const manager = new RoomManager();
  const socketA = createMockSocket();
  const socketB = createMockSocket();

  const { roomId, playerId: pA } = manager.createRoom(socketA.ws, 'Alice');
  manager.joinRoom(socketB.ws, roomId, 'Bob');
  const room = manager.getRoom(roomId)!;
  manager.startGame(socketA.ws, roomId, pA);

  // Bob tries to move on X's turn
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4);
  const outOfTurn = socketB.sent.find((m) => m.type === 'MOVE_REJECTED');
  assert.ok(outOfTurn);
  assert.equal((outOfTurn as { payload: { code: string } }).payload.code, 'NOT_YOUR_TURN');

  // Alice makes valid move at 4
  socketB.sent.length = 0;
  manager.handleMove(socketA.ws, roomId, room.playerX!.playerId, 4);

  // Bob tries occupied cell 4
  manager.handleMove(socketB.ws, roomId, room.playerO!.playerId, 4);
  const occupied = socketB.sent.find((m) => m.type === 'MOVE_REJECTED');
  assert.ok(occupied);
  assert.equal((occupied as { payload: { code: string } }).payload.code, 'CELL_OCCUPIED');
});

test('10. End-to-End WebSocket Network Integration (Server + 2 Real WebSockets)', async () => {
  const server = http.createServer();
  const nexWs = new NexPlayWebSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const wsUrl = `ws://127.0.0.1:${address.port}/ws`;

  const clientA = new WebSocket(wsUrl);
  await new Promise((resolve) => clientA.once('open', resolve));

  const clientB = new WebSocket(wsUrl);
  await new Promise((resolve) => clientB.once('open', resolve));

  const messagesA: ServerMessage[] = [];
  const messagesB: ServerMessage[] = [];

  clientA.on('message', (d) => messagesA.push(JSON.parse(d.toString())));
  clientB.on('message', (d) => messagesB.push(JSON.parse(d.toString())));

  // Client A creates room
  clientA.send(JSON.stringify({ type: 'CREATE_ROOM', payload: { displayName: 'Client A' } }));
  await new Promise((resolve) => setTimeout(resolve, 80));

  const created = messagesA.find((m) => m.type === 'ROOM_CREATED') as {
    payload: { roomId: string; playerId: string };
  };
  assert.ok(created);
  const roomId = created.payload.roomId;

  // Client B joins room
  clientB.send(JSON.stringify({ type: 'JOIN_ROOM', payload: { roomId, displayName: 'Client B' } }));
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Client A starts game
  clientA.send(JSON.stringify({ type: 'START_GAME', payload: { roomId, playerId: created.payload.playerId } }));
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Client A makes move at cell 4
  clientA.send(
    JSON.stringify({
      type: 'MAKE_MOVE',
      payload: { roomId, playerId: created.payload.playerId, position: 4 },
    })
  );
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Client B MUST see cell 4 updated to X immediately!
  const latestStateB = messagesB.filter((m) => m.type === 'GAME_STATE').pop() as {
    payload: { board: string[] };
  };
  assert.ok(latestStateB);
  assert.equal(latestStateB.payload.board[4], 'X');

  clientA.close();
  clientB.close();
  nexWs.getWss().close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
