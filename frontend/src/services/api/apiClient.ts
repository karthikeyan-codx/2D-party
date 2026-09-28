/**
 * NEX PLAY - Frontend API Client
 * Centralized HTTP service for authentication, profiles, friends, messaging, rooms, and notifications.
 */

import { API_URL } from '../../config/network.js';

const TOKEN_KEY = 'nexplay_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL.replace(/\/+$/, '')}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const apiClient = {
  // Auth
  auth: {
    register: (payload: { username: string; displayName: string; email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (payload: { login: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      }),
    me: () => request<{ user: any }>('/auth/me'),
  },

  // Users & Profiles
  users: {
    getProfile: (username: string) => request<{ profile: any }>(`/users/profile/${username}`),
    updateProfile: (payload: { displayName?: string; bio?: string; avatarUrl?: string }) =>
      request<{ user: any }>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    search: (query: string) => request<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`),
  },

  // Friends
  friends: {
    getFriends: () => request<{ friends: any[] }>('/friends'),
    sendRequest: (receiverId: string) =>
      request<{ success: boolean }>('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      }),
    acceptRequest: (senderId: string) =>
      request<{ success: boolean }>('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ senderId }),
      }),
    rejectRequest: (senderId: string) =>
      request<{ success: boolean }>('/friends/reject', {
        method: 'POST',
        body: JSON.stringify({ senderId }),
      }),
    removeFriend: (friendId: string) =>
      request<{ success: boolean }>('/friends/remove', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      }),
  },

  // Chat
  chat: {
    getConversations: () => request<{ conversations: any[] }>('/chat/conversations'),
    getOrCreateDirect: (targetUserId: string) =>
      request<{ conversation: any }>('/chat/conversations/direct', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      }),
    getMessages: (conversationId: string) =>
      request<{ messages: any[] }>(`/chat/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, content: string, clientMessageId?: string) =>
      request<{ message: any }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, clientMessageId }),
      }),
  },

  // Party Rooms
  rooms: {
    getRooms: () => request<{ rooms: any[] }>('/rooms'),
    getRoom: (id: string) => request<{ room: any }>(`/rooms/${id}`),
    createRoom: (payload: { name: string; gameId?: string; maxPlayers?: number }) =>
      request<{ room: any }>('/rooms/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    joinRoom: (id: string) =>
      request<{ success: boolean; room: any }>(`/rooms/${id}/join`, {
        method: 'POST',
      }),
    leaveRoom: (id: string) =>
      request<{ success: boolean; room?: any }>(`/rooms/${id}/leave`, {
        method: 'POST',
      }),
    setReady: (id: string, isReady: boolean) =>
      request<{ room: any }>(`/rooms/${id}/ready`, {
        method: 'POST',
        body: JSON.stringify({ isReady }),
      }),
    startGame: (id: string) =>
      request<{ success: boolean; room: any; gameSession?: any }>(`/rooms/${id}/start`, {
        method: 'POST',
      }),
    updateGame: (id: string, gameId: string) =>
      request<{ room: any }>(`/rooms/${id}/game`, {
        method: 'POST',
        body: JSON.stringify({ gameId }),
      }),
    sendMessage: (id: string, content: string, clientMessageId?: string) =>
      request<{ room: any }>(`/rooms/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, clientMessageId }),
      }),
    getGameSession: (id: string) => request<{ gameSession: any }>(`/game-sessions/${id}`),
  },

  // Notifications
  notifications: {
    getNotifications: () => request<{ notifications: any[] }>('/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'POST',
      }),
  },

  // Games Registry
  games: {
    getGames: () => request<{ games: any[] }>('/games'),
  },
};
