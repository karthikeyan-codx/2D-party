/**
 * NEX PLAY - Platform Domain Types
 * Covers Users, Profiles, Friendships, Messaging, Party Rooms, Notifications, and Game Registry.
 */

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  bio: string;
  status: UserStatus;
  createdAt: string;
  lastSeenAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'passwordHash' | 'email'> {
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  recentMatches: Array<{
    id: string;
    gameId: string;
    opponentName: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    score: string;
    date: string;
  }>;
  favouriteGames: string[];
}

export type FriendshipStatus = 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIENDS' | 'BLOCKED';

export interface FriendRelation {
  id: string;
  userId: string;
  friendId: string;
  friend: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    status: UserStatus;
  };
  status: FriendshipStatus;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  clientMessageId?: string;
}

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    status: UserStatus;
  }>;
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface PartyRoomMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isReady: boolean;
  isHost: boolean;
  joinedAt: string;
}

export interface PartyRoomMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  clientMessageId?: string;
}

export interface GameSessionPlayer {
  userId: string;
  displayName: string;
  symbol?: 'X' | 'O' | string;
  isHost?: boolean;
}

export interface GameSession {
  gameSessionId: string;
  gameId: string;
  source: 'party-room' | 'direct';
  partyRoomId?: string;
  players: GameSessionPlayer[];
  status: 'INITIALIZING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface PartyRoom {
  id: string;
  code: string;
  name: string;
  gameId: string;
  hostId: string;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'CLOSED';
  members: PartyRoomMember[];
  messages: PartyRoomMessage[];
  activeGameSessionId?: string;
  createdAt: string;
}

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'ROOM_INVITE'
  | 'GAME_INVITE'
  | 'MATCH_RESULT';

export interface PlatformNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  status: 'AVAILABLE' | 'COMING_SOON';
  route: string;
  category: 'BOARD' | 'ARCADE' | 'STRATEGY' | 'CASUAL';
  tags: string[];
  supportsLocal?: boolean;
  supportsOnline?: boolean;
}
