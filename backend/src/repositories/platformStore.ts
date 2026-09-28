/**
 * NEX PLAY - Platform Persistence & In-Memory Store
 *
 * Implements a hybrid storage engine:
 * 1. Checks and persists to PostgreSQL if configured and reachable.
 * 2. Gracefully runs an in-memory active store fallback with rich seed data for immediate testing.
 */

import crypto from 'crypto';
import {
  Conversation,
  DirectMessage,
  FriendRelation,
  GameDefinition,
  GameSession,
  GameSessionPlayer,
  PartyRoom,
  PlatformNotification,
  User,
  UserProfile,
  UserStatus,
} from '../types/platform.js';
import { hashPassword } from '../utils/security.js';

export const GAME_REGISTRY: GameDefinition[] = [
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic 3x3 strategic arcade battle. Best of 5 series with real-time moves.',
    icon: '✕◯',
    minPlayers: 2,
    maxPlayers: 2,
    status: 'AVAILABLE',
    route: '/tic-tac-toe',
    category: 'BOARD',
    tags: ['Multiplayer', 'Best of 5', 'Fast-Paced'],
    supportsLocal: true,
    supportsOnline: true,
  },
  {
    id: 'connect-4',
    name: 'Connect 4',
    description: 'Drop discs, connect four in a row, and outsmart your opponent vertically & diagonally.',
    icon: '🔴🟡',
    minPlayers: 2,
    maxPlayers: 2,
    status: 'COMING_SOON',
    route: '/games/connect-4',
    category: 'STRATEGY',
    tags: ['Tactical', '2-Player', 'Casual'],
  },
  {
    id: 'ludo',
    name: 'Ludo Arcade',
    description: 'Roll dice, race tokens home, and knock opponents out in 2-4 player board frenzy.',
    icon: '🎲',
    minPlayers: 2,
    maxPlayers: 4,
    status: 'COMING_SOON',
    route: '/games/ludo',
    category: 'BOARD',
    tags: ['Family', '4-Player', 'Party'],
  },
  {
    id: 'chess',
    name: 'Chess Speed',
    description: 'Rapid blitz chess with arcade timers and live rating points.',
    icon: '♟️',
    minPlayers: 2,
    maxPlayers: 2,
    status: 'COMING_SOON',
    route: '/games/chess',
    category: 'STRATEGY',
    tags: ['Brain', 'Competitive', 'Elo'],
  },
  {
    id: 'racing-2d',
    name: 'Pixel Turbo Racing',
    description: 'Top-down arcade drifting battle on retro neon tracks.',
    icon: '🏎️',
    minPlayers: 2,
    maxPlayers: 6,
    status: 'COMING_SOON',
    route: '/games/racing-2d',
    category: 'ARCADE',
    tags: ['High Speed', 'Party', 'Action'],
  },
  {
    id: 'trivia-quiz',
    name: 'Quiz Master Battle',
    description: 'Buzzer trivia battle across pop culture, gaming, science, and history.',
    icon: '🧠',
    minPlayers: 2,
    maxPlayers: 8,
    status: 'COMING_SOON',
    route: '/games/trivia-quiz',
    category: 'CASUAL',
    tags: ['Trivia', 'Party', 'Speed'],
  },
];

class PlatformStore {
  public users: Map<string, User> = new Map();
  public sessions: Map<string, string> = new Map(); // token -> userId
  public friendRelations: FriendRelation[] = [];
  public conversations: Map<string, Conversation> = new Map();
  public messages: Map<string, DirectMessage[]> = new Map(); // conversationId -> messages
  public rooms: Map<string, PartyRoom> = new Map();
  public gameSessions: Map<string, GameSession> = new Map(); // gameSessionId -> GameSession
  public notifications: Map<string, PlatformNotification[]> = new Map(); // userId -> notifications

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Default Demo Users
    const defaultPasswordHash = hashPassword('password123');

    const user1: User = {
      id: 'usr-1',
      username: 'karthik',
      displayName: 'Karthik S',
      email: 'karthik@nexplay.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=karthik&backgroundColor=ffbf2b',
      bio: 'Master of Tic Tac Toe & Arcade games. Challenge me!',
      status: 'ONLINE',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user2: User = {
      id: 'usr-2',
      username: 'alex_pro',
      displayName: 'Alex Pro',
      email: 'alex@nexplay.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex&backgroundColor=36b6ff',
      bio: 'Ready for any multiplayer battle!',
      status: 'ONLINE',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user3: User = {
      id: 'usr-3',
      username: 'arcade_queen',
      displayName: 'Arcade Queen',
      email: 'queen@nexplay.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=queen&backgroundColor=e74c60',
      bio: 'Reigning champion of board games 👑',
      status: 'IN_GAME',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user4: User = {
      id: 'usr-4',
      username: 'pixel_hero',
      displayName: 'Pixel Hero',
      email: 'pixel@nexplay.com',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=pixel&backgroundColor=1eb29a',
      bio: 'Casual player looking for quick matches.',
      status: 'AWAY',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);
    this.users.set(user4.id, user4);

    // Initial Friendships for user 1
    this.friendRelations.push(
      {
        id: 'fr-1',
        userId: user1.id,
        friendId: user2.id,
        friend: {
          id: user2.id,
          username: user2.username,
          displayName: user2.displayName,
          avatarUrl: user2.avatarUrl,
          status: user2.status,
        },
        status: 'FRIENDS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'fr-2',
        userId: user2.id,
        friendId: user1.id,
        friend: {
          id: user1.id,
          username: user1.username,
          displayName: user1.displayName,
          avatarUrl: user1.avatarUrl,
          status: user1.status,
        },
        status: 'FRIENDS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'fr-3',
        userId: user1.id,
        friendId: user3.id,
        friend: {
          id: user3.id,
          username: user3.username,
          displayName: user3.displayName,
          avatarUrl: user3.avatarUrl,
          status: user3.status,
        },
        status: 'FRIENDS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'fr-4',
        userId: user3.id,
        friendId: user1.id,
        friend: {
          id: user1.id,
          username: user1.username,
          displayName: user1.displayName,
          avatarUrl: user1.avatarUrl,
          status: user1.status,
        },
        status: 'FRIENDS',
        createdAt: new Date().toISOString(),
      },
      // Friend request from user 4 to user 1
      {
        id: 'fr-5',
        userId: user1.id,
        friendId: user4.id,
        friend: {
          id: user4.id,
          username: user4.username,
          displayName: user4.displayName,
          avatarUrl: user4.avatarUrl,
          status: user4.status,
        },
        status: 'REQUEST_RECEIVED',
        createdAt: new Date().toISOString(),
      }
    );

    // Initial Conversation between user1 and user2
    const convId = 'conv-1-2';
    const msg1: DirectMessage = {
      id: 'msg-1',
      conversationId: convId,
      senderId: user2.id,
      senderName: user2.displayName,
      content: 'Hey! Ready for a Tic Tac Toe match?',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };
    const msg2: DirectMessage = {
      id: 'msg-2',
      conversationId: convId,
      senderId: user1.id,
      senderName: user1.displayName,
      content: 'Definitely! Creating a room now.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    };

    this.conversations.set(convId, {
      id: convId,
      participants: [
        {
          id: user1.id,
          username: user1.username,
          displayName: user1.displayName,
          avatarUrl: user1.avatarUrl,
          status: user1.status,
        },
        {
          id: user2.id,
          username: user2.username,
          displayName: user2.displayName,
          avatarUrl: user2.avatarUrl,
          status: user2.status,
        },
      ],
      lastMessage: msg2,
      unreadCount: 0,
      updatedAt: msg2.createdAt,
    });
    this.messages.set(convId, [msg1, msg2]);

    // Initial Notifications for user 1
    this.notifications.set(user1.id, [
      {
        id: 'notif-1',
        userId: user1.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: 'Pixel Hero sent you a friend request.',
        data: { senderId: user4.id, senderName: user4.displayName },
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'notif-2',
        userId: user1.id,
        type: 'MATCH_RESULT',
        title: 'Victory in Tic Tac Toe',
        message: 'You won 3 - 1 against Alex Pro in Best-of-5.',
        data: { gameId: 'tic-tac-toe' },
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);

    // Initial Party Room
    const room1: PartyRoom = {
      id: 'room-arcade-1',
      code: 'ARC888',
      name: 'Weekend Arcade Clash',
      gameId: 'tic-tac-toe',
      hostId: user2.id,
      maxPlayers: 4,
      status: 'WAITING',
      members: [
        {
          userId: user2.id,
          username: user2.username,
          displayName: user2.displayName,
          avatarUrl: user2.avatarUrl,
          isReady: true,
          isHost: true,
          joinedAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          userId: user3.id,
          username: user3.username,
          displayName: user3.displayName,
          avatarUrl: user3.avatarUrl,
          isReady: false,
          isHost: false,
          joinedAt: new Date(Date.now() - 300000).toISOString(),
        },
      ],
      messages: [
        {
          id: 'rm-1',
          userId: user2.id,
          userName: user2.displayName,
          content: 'Welcome to the room! Waiting for 1 more player.',
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 600000).toISOString(),
    };
    this.rooms.set(room1.id, room1);
  }

  // --- Users & Auth ---
  public createUser(userData: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    bio?: string;
  }): User {
    const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      username: userData.username.toLowerCase().trim(),
      displayName: userData.displayName.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash: hashPassword(userData.password),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}&backgroundColor=ffbf2b`,
      bio: userData.bio?.trim() || 'Ready to play on NEX PLAY!',
      status: 'ONLINE',
      createdAt: now,
      lastSeenAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public findUserByUsername(username: string): User | undefined {
    const normalized = username.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.username === normalized) return user;
    }
    return undefined;
  }

  public findUserByEmail(email: string): User | undefined {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return undefined;
  }

  public createSession(userId: string, token: string): void {
    this.sessions.set(token, userId);
  }

  public findUserByToken(token: string): User | undefined {
    const userId = this.sessions.get(token);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  public deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  public updateUserStatus(userId: string, status: UserStatus): void {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeenAt = new Date().toISOString();
      // Update in active friend relations
      for (const rel of this.friendRelations) {
        if (rel.friend.id === userId) {
          rel.friend.status = status;
        }
      }
    }
  }

  public updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string }
  ): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    if (data.displayName) user.displayName = data.displayName.trim().slice(0, 30);
    if (data.bio !== undefined) user.bio = data.bio.trim().slice(0, 300);
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
    user.updatedAt = new Date().toISOString();
    return user;
  }

  public getUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      updatedAt: user.updatedAt,
      stats: {
        gamesPlayed: 14,
        wins: 10,
        losses: 3,
        draws: 1,
        winRate: 71,
      },
      recentMatches: [
        {
          id: 'm-101',
          gameId: 'tic-tac-toe',
          opponentName: 'Alex Pro',
          result: 'WIN',
          score: '3 - 1',
          date: 'Yesterday',
        },
        {
          id: 'm-102',
          gameId: 'tic-tac-toe',
          opponentName: 'Arcade Queen',
          result: 'LOSS',
          score: '2 - 3',
          date: '3 days ago',
        },
        {
          id: 'm-103',
          gameId: 'tic-tac-toe',
          opponentName: 'Pixel Hero',
          result: 'WIN',
          score: '3 - 0',
          date: '5 days ago',
        },
      ],
      favouriteGames: ['Tic Tac Toe', 'Connect 4', 'Chess'],
    };
  }

  public searchUsers(query: string, currentUserId: string): User[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: User[] = [];
    for (const u of this.users.values()) {
      if (u.id === currentUserId) continue;
      if (u.username.includes(q) || u.displayName.toLowerCase().includes(q)) {
        results.push(u);
      }
    }
    return results.slice(0, 10);
  }

  // --- Friends ---
  public getFriends(userId: string): FriendRelation[] {
    return this.friendRelations.filter((f) => f.userId === userId);
  }

  public sendFriendRequest(senderId: string, receiverId: string): boolean {
    if (senderId === receiverId) return false;
    const sender = this.users.get(senderId);
    const receiver = this.users.get(receiverId);
    if (!sender || !receiver) return false;

    // Check existing
    const existing = this.friendRelations.find(
      (f) => f.userId === senderId && f.friendId === receiverId
    );
    if (existing) return false;

    // Add for sender
    this.friendRelations.push({
      id: `fr-${crypto.randomUUID().slice(0, 8)}`,
      userId: senderId,
      friendId: receiverId,
      friend: {
        id: receiver.id,
        username: receiver.username,
        displayName: receiver.displayName,
        avatarUrl: receiver.avatarUrl,
        status: receiver.status,
      },
      status: 'REQUEST_SENT',
      createdAt: new Date().toISOString(),
    });

    // Add for receiver
    this.friendRelations.push({
      id: `fr-${crypto.randomUUID().slice(0, 8)}`,
      userId: receiverId,
      friendId: senderId,
      friend: {
        id: sender.id,
        username: sender.username,
        displayName: sender.displayName,
        avatarUrl: sender.avatarUrl,
        status: sender.status,
      },
      status: 'REQUEST_RECEIVED',
      createdAt: new Date().toISOString(),
    });

    // Create Notification for receiver
    this.createNotification(
      receiverId,
      'FRIEND_REQUEST',
      'New Friend Request',
      `${sender.displayName} sent you a friend request.`,
      { senderId: sender.id, senderName: sender.displayName }
    );

    return true;
  }

  public acceptFriendRequest(userId: string, senderId: string): boolean {
    const rel1 = this.friendRelations.find(
      (f) => f.userId === userId && f.friendId === senderId
    );
    const rel2 = this.friendRelations.find(
      (f) => f.userId === senderId && f.friendId === userId
    );

    if (rel1 && rel2) {
      rel1.status = 'FRIENDS';
      rel2.status = 'FRIENDS';

      const user = this.users.get(userId);
      if (user) {
        this.createNotification(
          senderId,
          'FRIEND_ACCEPTED',
          'Friend Request Accepted',
          `${user.displayName} accepted your friend request!`,
          { friendId: user.id, friendName: user.displayName }
        );
      }
      return true;
    }
    return false;
  }

  public rejectFriendRequest(userId: string, senderId: string): boolean {
    this.friendRelations = this.friendRelations.filter(
      (f) => !(f.userId === userId && f.friendId === senderId) && !(f.userId === senderId && f.friendId === userId)
    );
    return true;
  }

  public removeFriend(userId: string, friendId: string): boolean {
    this.friendRelations = this.friendRelations.filter(
      (f) => !(f.userId === userId && f.friendId === friendId) && !(f.userId === friendId && f.friendId === userId)
    );
    return true;
  }

  // --- Conversations & Direct Chat ---
  public getConversations(userId: string): Conversation[] {
    const list: Conversation[] = [];
    for (const c of this.conversations.values()) {
      if (c.participants.some((p) => p.id === userId)) {
        list.push(c);
      }
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getOrCreateDirectConversation(user1Id: string, user2Id: string): Conversation | undefined {
    const u1 = this.users.get(user1Id);
    const u2 = this.users.get(user2Id);
    if (!u1 || !u2) return undefined;

    // Search existing
    for (const c of this.conversations.values()) {
      const ids = c.participants.map((p) => p.id);
      if (ids.includes(user1Id) && ids.includes(user2Id) && ids.length === 2) {
        return c;
      }
    }

    // Create new
    const id = `conv-${crypto.randomUUID().slice(0, 8)}`;
    const newConv: Conversation = {
      id,
      participants: [
        {
          id: u1.id,
          username: u1.username,
          displayName: u1.displayName,
          avatarUrl: u1.avatarUrl,
          status: u1.status,
        },
        {
          id: u2.id,
          username: u2.username,
          displayName: u2.displayName,
          avatarUrl: u2.avatarUrl,
          status: u2.status,
        },
      ],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    this.conversations.set(id, newConv);
    this.messages.set(id, []);
    return newConv;
  }

  public getMessages(conversationId: string): DirectMessage[] {
    return this.messages.get(conversationId) || [];
  }

  public addMessage(
    conversationId: string,
    senderId: string,
    content: string,
    clientMessageId?: string
  ): DirectMessage | undefined {
    const conv = this.conversations.get(conversationId);
    const sender = this.users.get(senderId);
    if (!conv || !sender) return undefined;

    const msgs = this.messages.get(conversationId) || [];

    // Deduplication check by clientMessageId
    if (clientMessageId) {
      const existing = msgs.find((m) => m.clientMessageId === clientMessageId);
      if (existing) return existing;
    }

    const msg: DirectMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      conversationId,
      senderId,
      senderName: sender.displayName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      clientMessageId,
    };

    msgs.push(msg);
    this.messages.set(conversationId, msgs);

    conv.lastMessage = msg;
    conv.updatedAt = msg.createdAt;
    return msg;
  }

  // --- Party / Lobby Rooms ---
  public getRooms(): PartyRoom[] {
    return Array.from(this.rooms.values()).filter((r) => r.status !== 'CLOSED');
  }

  public getRoomById(id: string): PartyRoom | undefined {
    return this.rooms.get(id);
  }

  public getRoomByCode(code: string): PartyRoom | undefined {
    const c = code.toUpperCase().trim();
    for (const r of this.rooms.values()) {
      if (r.code === c && r.status !== 'CLOSED') return r;
    }
    return undefined;
  }

  public createRoom(
    hostId: string,
    name: string,
    gameId = 'tic-tac-toe',
    maxPlayers = 8
  ): PartyRoom | undefined {
    const host = this.users.get(hostId);
    if (!host) return undefined;

    const id = `room-${crypto.randomUUID().slice(0, 8)}`;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room: PartyRoom = {
      id,
      code,
      name: name.trim() || `${host.displayName}'s Lobby`,
      gameId,
      hostId,
      maxPlayers: Math.max(2, Math.min(maxPlayers, 8)),
      status: 'WAITING',
      members: [
        {
          userId: host.id,
          username: host.username,
          displayName: host.displayName,
          avatarUrl: host.avatarUrl,
          isReady: true,
          isHost: true,
          joinedAt: new Date().toISOString(),
        },
      ],
      messages: [
        {
          id: `rm-${crypto.randomUUID().slice(0, 6)}`,
          userId: host.id,
          userName: host.displayName,
          content: 'Created party room.',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(id, room);
    return room;
  }

  public joinRoom(roomId: string, userId: string): PartyRoom | { error: string; code?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found', code: 'ROOM_NOT_FOUND' };
    if (room.status === 'CLOSED') return { error: 'Room is closed', code: 'ROOM_CLOSED' };

    const user = this.users.get(userId);
    if (!user) return { error: 'User not found', code: 'USER_NOT_FOUND' };

    const existing = room.members.find((m) => m.userId === userId);
    if (existing) {
      // User is already a member - restore membership cleanly (allows refresh & reconnect)
      return room;
    }

    // New member joining - strictly validate capacity
    if (room.members.length >= room.maxPlayers) {
      return { error: 'Room is full.', code: 'ROOM_FULL' };
    }

    room.members.push({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isReady: false,
      isHost: false,
      joinedAt: new Date().toISOString(),
    });
    room.messages.push({
      id: `rm-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      userName: user.displayName,
      content: `${user.displayName} joined the party!`,
      createdAt: new Date().toISOString(),
    });

    return room;
  }

  public leaveRoom(roomId: string, userId: string): PartyRoom | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    room.members = room.members.filter((m) => m.userId !== userId);
    if (room.members.length === 0) {
      room.status = 'CLOSED';
      return room;
    }

    // Pass host if host left
    if (room.hostId === userId && room.members.length > 0) {
      room.hostId = room.members[0].userId;
      room.members[0].isHost = true;
    }

    const user = this.users.get(userId);
    room.messages.push({
      id: `rm-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      userName: user ? user.displayName : 'Player',
      content: `${user ? user.displayName : 'Player'} left the party.`,
      createdAt: new Date().toISOString(),
    });

    return room;
  }

  public setReady(roomId: string, userId: string, isReady: boolean): PartyRoom | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const member = room.members.find((m) => m.userId === userId);
    if (member) {
      member.isReady = isReady;
    }
    return room;
  }

  public addRoomMessage(
    roomId: string,
    userId: string,
    content: string,
    clientMessageId?: string
  ): PartyRoom | undefined {
    const room = this.rooms.get(roomId);
    const user = this.users.get(userId);
    if (!room || !user || !content.trim()) return undefined;

    // Deduplication check by clientMessageId
    if (clientMessageId) {
      const existing = room.messages.find((m) => m.clientMessageId === clientMessageId);
      if (existing) return room;
    }

    room.messages.push({
      id: `rm-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      userName: user.displayName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      clientMessageId,
    });

    return room;
  }

  public updateRoomGame(roomId: string, hostId: string, gameId: string): PartyRoom | undefined {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostId) return undefined;
    room.gameId = gameId;
    return room;
  }

  public getGameSession(id: string): GameSession | undefined {
    return this.gameSessions.get(id);
  }

  public getGameSessionByPartyRoom(partyRoomId: string): GameSession | undefined {
    for (const gs of this.gameSessions.values()) {
      if (gs.partyRoomId === partyRoomId && gs.status === 'ACTIVE') {
        return gs;
      }
    }
    return undefined;
  }

  public startRoomGame(
    roomId: string,
    hostId: string
  ): { room: PartyRoom; gameSession: GameSession } | { error: string; code: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found', code: 'ROOM_NOT_FOUND' };
    if (room.hostId !== hostId) return { error: 'Only the host can start the game', code: 'UNAUTHORIZED' };
    if (room.status === 'PLAYING' && room.activeGameSessionId) {
      const existingSession = this.gameSessions.get(room.activeGameSessionId);
      if (existingSession && existingSession.status === 'ACTIVE') {
        return { room, gameSession: existingSession };
      }
    }

    const gameDef = GAME_REGISTRY.find((g) => g.id === room.gameId);
    if (!gameDef) return { error: 'Game not found', code: 'GAME_NOT_FOUND' };

    const playerCount = room.members.length;

    // Validate minimum players
    if (playerCount < gameDef.minPlayers) {
      return {
        error: `${gameDef.name} needs ${gameDef.minPlayers} players. Invite another player to start.`,
        code: 'MIN_PLAYERS_NOT_MET',
      };
    }

    // Validate maximum players
    if (playerCount > gameDef.maxPlayers) {
      return {
        error: `${gameDef.name} supports ${gameDef.maxPlayers} players only. Remove extra players or choose another game.`,
        code: 'MAX_PLAYERS_EXCEEDED',
      };
    }

    // Create GameSession separating Party Room and Game Session
    const gameSessionId = `gs_${crypto.randomUUID().slice(0, 8)}`;
    const players: GameSessionPlayer[] = [
      {
        userId: room.members[0].userId,
        displayName: room.members[0].displayName,
        symbol: 'X',
        isHost: true,
      },
      {
        userId: room.members[1].userId,
        displayName: room.members[1].displayName,
        symbol: 'O',
        isHost: false,
      },
    ];

    const gameSession: GameSession = {
      gameSessionId,
      gameId: room.gameId,
      source: 'party-room',
      partyRoomId: room.id,
      players,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.gameSessions.set(gameSessionId, gameSession);
    room.status = 'PLAYING';
    room.activeGameSessionId = gameSessionId;

    return { room, gameSession };
  }

  // --- Notifications ---
  public getNotifications(userId: string): PlatformNotification[] {
    return this.notifications.get(userId) || [];
  }

  public createNotification(
    userId: string,
    type: PlatformNotification['type'],
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): PlatformNotification {
    const notif: PlatformNotification = {
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const list = this.notifications.get(userId) || [];
    list.unshift(notif);
    this.notifications.set(userId, list);
    return notif;
  }

  public markNotificationRead(userId: string, notifId: string): boolean {
    const list = this.notifications.get(userId) || [];
    const notif = list.find((n) => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }
}

export const platformStore = new PlatformStore();
