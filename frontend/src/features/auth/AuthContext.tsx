/**
 * NEX PLAY - Authentication Context
 * Manages user session, persistent login, and realtime presence synchronization.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getStoredToken, setStoredToken } from '../../services/api/apiClient.js';
import { realtimeWs } from '../../services/realtime/WebSocketClient.js';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';
  createdAt: string;
  lastSeenAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (payload: { username: string; displayName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with WebSocket for presence when user is available
  useEffect(() => {
    if (user) {
      realtimeWs.send({
        type: 'USER_IDENTIFY' as any,
        payload: { userId: user.id, username: user.username, status: 'ONLINE' } as any,
      });
    }
  }, [user]);

  // Initial Session Check
  useEffect(() => {
    const initializeAuth = async () => {
      const stored = getStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: profile } = await apiClient.auth.me();
        setUser(profile);
        setToken(stored);
      } catch {
        // Token invalid or expired
        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (loginId: string, pass: string) => {
    const res = await apiClient.auth.login({ login: loginId, password: pass });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: { username: string; displayName: string; email: string; password: string }) => {
    const res = await apiClient.auth.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
