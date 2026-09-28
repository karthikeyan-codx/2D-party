import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { platformRouter } from '../src/routes/platformRoutes.js';
import { platformStore } from '../src/repositories/platformStore.js';

describe('NEX PLAY Platform API Test Suite', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', platformRouter);

  let server: http.Server;
  let baseUrl: string;

  it('Setup test server', async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });
  });

  let testToken = '';
  const testUser = {
    username: `tester_${Date.now().toString(36)}`,
    displayName: 'Test Gamer',
    email: `tester_${Date.now().toString(36)}@nexplay.com`,
    password: 'password123',
  };

  it('1. Register new user successfully', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.token);
    assert.strictEqual(data.user.username, testUser.username);
    testToken = data.token;
  });

  it('2. Reject duplicate username', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testUser,
        email: 'different@nexplay.com',
      }),
    });
    assert.strictEqual(res.status, 409);
  });

  it('3. Login with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: testUser.username,
        password: testUser.password,
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
  });

  it('4. Reject login with invalid password', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: testUser.username,
        password: 'wrongpassword',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('5. Verify session with /api/auth/me', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.username, testUser.username);
  });

  it('6. Fetch user profile with stats', async () => {
    const res = await fetch(`${baseUrl}/users/profile/${testUser.username}`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.profile.stats);
    assert.strictEqual(data.profile.username, testUser.username);
  });

  it('7. Friends management: Send and list requests', async () => {
    // Send request from testUser to alex_pro (usr-2)
    const res = await fetch(`${baseUrl}/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ receiverId: 'usr-2' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    // List friends
    const listRes = await fetch(`${baseUrl}/friends`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.friends));
    assert.ok(listData.friends.length > 0);
  });

  let testConversationId = '';

  it('8. Direct Chat: Create conversation and send message', async () => {
    // Start direct chat with alex_pro (usr-2)
    const convRes = await fetch(`${baseUrl}/chat/conversations/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ targetUserId: 'usr-2' }),
    });
    const convData = await convRes.json();
    assert.strictEqual(convRes.status, 200);
    assert.ok(convData.conversation.id);
    testConversationId = convData.conversation.id;

    // Send message
    const msgRes = await fetch(`${baseUrl}/chat/conversations/${testConversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ content: 'Hello from automated test!' }),
    });
    const msgData = await msgRes.json();
    assert.strictEqual(msgRes.status, 201);
    assert.strictEqual(msgData.message.content, 'Hello from automated test!');
  });

  it('9. Direct & Room Chat Deduplication: Reconciles server echo with clientMessageId', async () => {
    // Post message with clientMessageId
    const cId = 'cm_test_123';
    const msg1Res = await fetch(`${baseUrl}/chat/conversations/${testConversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ content: 'Deduplicated Message Test', clientMessageId: cId }),
    });
    const msg1Data = await msg1Res.json();
    assert.strictEqual(msg1Res.status, 201);
    assert.strictEqual(msg1Data.message.clientMessageId, cId);

    // Send again with same clientMessageId (e.g. retry / server echo)
    const msg2Res = await fetch(`${baseUrl}/chat/conversations/${testConversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ content: 'Deduplicated Message Test', clientMessageId: cId }),
    });
    const msg2Data = await msg2Res.json();
    assert.strictEqual(msg2Data.message.id, msg1Data.message.id);

    // Send same text with different clientMessageId (user intentionally sends twice)
    const msg3Res = await fetch(`${baseUrl}/chat/conversations/${testConversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ content: 'Deduplicated Message Test', clientMessageId: 'cm_test_456' }),
    });
    const msg3Data = await msg3Res.json();
    assert.notStrictEqual(msg3Data.message.id, msg1Data.message.id);
  });

  let secondUserToken = '';
  it('10. Register second test user for room interactions', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `gamer2_${Date.now().toString(36)}`,
        displayName: 'Player Two',
        email: `gamer2_${Date.now().toString(36)}@nexplay.com`,
        password: 'password123',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    secondUserToken = data.token;
  });

  let testPartyRoomId = '';
  it('11. Party Room: Create 2-player room and test join when space available', async () => {
    const createRes = await fetch(`${baseUrl}/rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ name: '2-Player Arena', gameId: 'tic-tac-toe', maxPlayers: 2 }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    testPartyRoomId = createData.room.id;
    assert.strictEqual(createData.room.members.length, 1);

    // 1 player in room -> Host tries to start Tic Tac Toe -> REJECTED (needs 2 players)
    const earlyStartRes = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
    });
    const earlyStartData = await earlyStartRes.json();
    assert.strictEqual(earlyStartRes.status, 400);
    assert.strictEqual(earlyStartData.code, 'MIN_PLAYERS_NOT_MET');

    // Second user joins room (1/2 -> 2/2)
    const joinRes = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondUserToken}`,
      },
    });
    const joinData = await joinRes.json();
    assert.strictEqual(joinRes.status, 200);
    assert.strictEqual(joinData.room.members.length, 2);
  });

  it('12. Party Room: Reject 3rd player when room is FULL (2/2)', async () => {
    // Register third user
    const reg3 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `gamer3_${Date.now().toString(36)}`,
        displayName: 'Player Three',
        email: `gamer3_${Date.now().toString(36)}@nexplay.com`,
        password: 'password123',
      }),
    });
    const user3 = await reg3.json();

    // Player 3 tries to enter full room
    const rejectRes = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3.token}`,
      },
    });
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectRes.status, 409);
    assert.strictEqual(rejectData.code, 'ROOM_FULL');

    // Verify Player 3 is NOT in room members
    const roomCheck = await fetch(`${baseUrl}/rooms/${testPartyRoomId}`);
    const roomData = await roomCheck.json();
    assert.strictEqual(roomData.room.members.length, 2);
    assert.ok(!roomData.room.members.some((m: any) => m.username === user3.user.username));
  });

  it('13. Party Room: Refresh / reconnect existing member succeeds cleanly', async () => {
    // Existing player 2 refreshes and calls join
    const refreshRes = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondUserToken}`,
      },
    });
    const refreshData = await refreshRes.json();
    assert.strictEqual(refreshRes.status, 200);
    assert.strictEqual(refreshData.room.members.length, 2);
  });

  it('14. Tic Tac Toe from Party Room: Valid 2 players launch match directly', async () => {
    // Non-host tries to start -> REJECTED
    const nonHostStart = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondUserToken}`,
      },
    });
    assert.strictEqual(nonHostStart.status, 400);

    // Host starts game with exactly 2 players -> SUCCESS
    const hostStart = await fetch(`${baseUrl}/rooms/${testPartyRoomId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
    });
    const hostStartData = await hostStart.json();
    assert.strictEqual(hostStart.status, 200);
    assert.strictEqual(hostStartData.room.status, 'PLAYING');
    assert.ok(hostStartData.gameSession);
    assert.strictEqual(hostStartData.gameSession.gameId, 'tic-tac-toe');
    assert.strictEqual(hostStartData.gameSession.players.length, 2);
    assert.strictEqual(hostStartData.gameSession.players[0].symbol, 'X');
    assert.strictEqual(hostStartData.gameSession.players[1].symbol, 'O');

    // Verify session retrieval via API
    const sessionRes = await fetch(`${baseUrl}/game-sessions/${hostStartData.gameSession.gameSessionId}`);
    const sessionData = await sessionRes.json();
    assert.strictEqual(sessionRes.status, 200);
    assert.strictEqual(sessionData.gameSession.gameId, 'tic-tac-toe');
  });

  it('15. Game Registry lists available and coming soon games with player bounds', async () => {
    const res = await fetch(`${baseUrl}/games`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.games));
    const ttt = data.games.find((g: any) => g.id === 'tic-tac-toe');
    assert.ok(ttt);
    assert.strictEqual(ttt.status, 'AVAILABLE');
    assert.strictEqual(ttt.minPlayers, 2);
    assert.strictEqual(ttt.maxPlayers, 2);
  });

  it('Teardown test server', async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});
