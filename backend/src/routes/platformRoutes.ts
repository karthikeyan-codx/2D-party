import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { GAME_REGISTRY, platformStore } from '../repositories/platformStore.js';
import { generateSessionToken, verifyPassword } from '../utils/security.js';
import { roomManager } from '../websocket/roomManager.js';

export const platformRouter = Router();

// ==========================================
// 1. Authentication Routes
// ==========================================

platformRouter.post('/auth/register', (req, res: Response) => {
  const { username, displayName, email, password } = req.body;

  if (!username || !displayName || !email || !password) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const normalizedUser = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedUser.length < 3 || normalizedUser.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  if (platformStore.findUserByUsername(normalizedUser)) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  if (platformStore.findUserByEmail(normalizedEmail)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const user = platformStore.createUser({
    username: normalizedUser,
    displayName,
    email: normalizedEmail,
    password,
  });

  const token = generateSessionToken();
  platformStore.createSession(user.id, token);

  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({
    user: safeUser,
    token,
  });
});

platformRouter.post('/auth/login', (req, res: Response) => {
  const { login, password } = req.body; // login can be username or email

  if (!login || !password) {
    res.status(400).json({ error: 'Username/Email and password are required' });
    return;
  }

  const clean = login.toLowerCase().trim();
  const user = clean.includes('@')
    ? platformStore.findUserByEmail(clean)
    : platformStore.findUserByUsername(clean);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials. Please check your username/password.' });
    return;
  }

  const token = generateSessionToken();
  platformStore.createSession(user.id, token);
  platformStore.updateUserStatus(user.id, 'ONLINE');

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    token,
  });
});

platformRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    platformStore.deleteSession(req.token);
  }
  if (req.user) {
    platformStore.updateUserStatus(req.user.id, 'OFFLINE');
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

platformRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ==========================================
// 2. User & Profile Routes
// ==========================================

platformRouter.get('/users/profile/:username', (req, res: Response) => {
  const user = platformStore.findUserByUsername(req.params.username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const profile = platformStore.getUserProfile(user);
  res.json({ profile });
});

platformRouter.get('/profiles/:username', (req, res: Response) => {
  const user = platformStore.findUserByUsername(req.params.username);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const profile = platformStore.getUserProfile(user);
  res.json({ profile, stats: profile.stats });
});

platformRouter.put('/users/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const updated = platformStore.updateProfile(req.user.id, req.body);
  if (!updated) {
    res.status(400).json({ error: 'Failed to update profile' });
    return;
  }
  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser });
});

platformRouter.get('/users/search', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  const currentId = req.user?.id || '';
  const users = platformStore.searchUsers(q, currentId).map(({ passwordHash: _, ...u }) => u);
  res.json({ users });
});

// ==========================================
// 3. Friends Routes
// ==========================================

platformRouter.get('/friends', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const friends = platformStore.getFriends(req.user.id);
  res.json({ friends });
});

platformRouter.post('/friends/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { receiverId } = req.body;
  if (!receiverId) {
    res.status(400).json({ error: 'receiverId is required' });
    return;
  }
  const success = platformStore.sendFriendRequest(req.user.id, receiverId);
  if (!success) {
    res.status(400).json({ error: 'Cannot send request or already requested' });
    return;
  }
  res.json({ success: true, message: 'Friend request sent' });
});

platformRouter.post('/friends/accept', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { senderId } = req.body;
  const success = platformStore.acceptFriendRequest(req.user.id, senderId);
  if (!success) {
    res.status(400).json({ error: 'Could not accept friend request' });
    return;
  }
  res.json({ success: true, message: 'Friend request accepted' });
});

platformRouter.post('/friends/reject', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { senderId } = req.body;
  platformStore.rejectFriendRequest(req.user.id, senderId);
  res.json({ success: true, message: 'Friend request rejected' });
});

platformRouter.post('/friends/remove', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { friendId } = req.body;
  platformStore.removeFriend(req.user.id, friendId);
  res.json({ success: true, message: 'Friend removed' });
});

// ==========================================
// 4. Conversations & Direct Chat Routes
// ==========================================

platformRouter.get('/chat/conversations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const conversations = platformStore.getConversations(req.user.id);
  res.json({ conversations });
});

platformRouter.post('/chat/conversations/direct', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { targetUserId } = req.body;
  const conversation = platformStore.getOrCreateDirectConversation(req.user.id, targetUserId);
  if (!conversation) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ conversation });
});

platformRouter.get('/chat/conversations/:id/messages', requireAuth, (req, res: Response) => {
  const messages = platformStore.getMessages(req.params.id);
  res.json({ messages });
});

platformRouter.post('/chat/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { content, clientMessageId } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Message content cannot be empty' });
    return;
  }
  const message = platformStore.addMessage(req.params.id, req.user.id, content, clientMessageId);
  if (!message) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.status(201).json({ message });
});

// ==========================================
// 5. Party / Lobby Room Routes
// ==========================================

platformRouter.get('/rooms', (_req, res: Response) => {
  const rooms = platformStore.getRooms();
  res.json({ rooms });
});

platformRouter.get('/rooms/:id', (req, res: Response) => {
  const room = platformStore.getRoomById(req.params.id) || platformStore.getRoomByCode(req.params.id);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ room });
});

platformRouter.post('/rooms/create', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { name, gameId, maxPlayers } = req.body;
  const room = platformStore.createRoom(req.user.id, name, gameId, maxPlayers);
  if (!room) {
    res.status(400).json({ error: 'Failed to create room' });
    return;
  }
  res.status(201).json({ room });
});

platformRouter.post('/rooms/:id/join', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const target = platformStore.getRoomById(req.params.id) || platformStore.getRoomByCode(req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Room not found', code: 'ROOM_NOT_FOUND' });
    return;
  }
  const result = platformStore.joinRoom(target.id, req.user.id);
  if ('error' in result) {
    const status = result.code === 'ROOM_FULL' ? 409 : 400;
    res.status(status).json({ error: result.error, code: result.code });
    return;
  }
  res.json({ success: true, room: result });
});

platformRouter.post('/rooms/:id/leave', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const room = platformStore.leaveRoom(req.params.id, req.user.id);
  res.json({ success: true, room });
});

platformRouter.post('/rooms/:id/ready', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { isReady } = req.body;
  const room = platformStore.setReady(req.params.id, req.user.id, Boolean(isReady));
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ room });
});

platformRouter.post('/rooms/:id/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = platformStore.startRoomGame(req.params.id, req.user.id);
  if ('error' in result) {
    res.status(400).json({ error: result.error, code: result.code });
    return;
  }

  // Pre-provision Tic Tac Toe multiplayer game room if game is Tic Tac Toe
  if (result.room.gameId === 'tic-tac-toe' && result.gameSession) {
    const playerX = result.gameSession.players.find((p) => p.symbol === 'X') || result.gameSession.players[0];
    const playerO = result.gameSession.players.find((p) => p.symbol === 'O') || result.gameSession.players[1];
    roomManager.createPartyGame(result.gameSession.gameSessionId, playerX, playerO);
  }

  res.json({ success: true, room: result.room, gameSession: result.gameSession });
});

platformRouter.post('/rooms/:id/game', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { gameId } = req.body;
  const room = platformStore.updateRoomGame(req.params.id, req.user.id, gameId);
  if (!room) {
    res.status(400).json({ error: 'Could not update game' });
    return;
  }
  res.json({ room });
});

platformRouter.post('/rooms/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { content, clientMessageId } = req.body;
  const room = platformStore.addRoomMessage(req.params.id, req.user.id, content, clientMessageId);
  if (!room) {
    res.status(400).json({ error: 'Failed to post room message' });
    return;
  }
  res.status(201).json({ room });
});

platformRouter.get('/game-sessions/:id', (req, res: Response) => {
  const gameSession = platformStore.getGameSession(req.params.id);
  if (!gameSession) {
    res.status(404).json({ error: 'Game session not found' });
    return;
  }
  res.json({ gameSession });
});

// ==========================================
// 6. Notifications Routes
// ==========================================

platformRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const notifications = platformStore.getNotifications(req.user.id);
  res.json({ notifications });
});

platformRouter.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  platformStore.markNotificationRead(req.user.id, req.params.id);
  res.json({ success: true });
});

// ==========================================
// 7. Game Registry Route
// ==========================================

platformRouter.get('/games', (_req, res: Response) => {
  res.json({ games: GAME_REGISTRY });
});
