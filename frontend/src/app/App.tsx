/**
 * NEX PLAY - Application Root Router & Provider Tree
 * Combines BrowserRouter, AuthProvider, Platform Layout, and Game Routes.
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/AuthContext.js';
import { PlatformLayout } from '../layouts/PlatformLayout.js';
import { AuthPage } from '../pages/AuthPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { GamesPage } from '../pages/GamesPage.js';
import { FriendsPage } from '../pages/FriendsPage.js';
import { ChatPage } from '../pages/ChatPage.js';
import { RoomsPage } from '../pages/RoomsPage.js';
import { PartyRoomPage } from '../pages/PartyRoomPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { TicTacToePage } from '../pages/TicTacToePage.js';

// Route Guard for Protected Routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)]">
        <span className="text-xs font-black uppercase tracking-widest text-amber-400 animate-pulse">
          INITIALIZING NEX PLAY...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* Standalone Game Route (Retains existing Tic Tac Toe gameplay) */}
      <Route path="/tic-tac-toe" element={<TicTacToePage />} />

      {/* Main Platform Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:roomId" element={<PartyRoomPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
