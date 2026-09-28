/**
 * NEX PLAY - Main Platform Layout
 * Responsive wrapper providing top desktop header and bottom mobile navigation bar.
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { useTheme } from '../theme/theme.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';
import { NotificationDropdown } from '../components/ui/NotificationDropdown.js';

export const PlatformLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Games', path: '/games', icon: '🎮' },
    { label: 'Friends', path: '/friends', icon: '👥' },
    { label: 'Chat', path: '/chat', icon: '💬' },
    { label: 'Party Rooms', path: '/rooms', icon: '🎪' },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Top Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--color-bg)]/85 border-b border-[var(--color-border)]/60 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 select-none group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#ffbf2b] border-2 border-amber-300 shadow-[0_3px_0_#c97808] flex items-center justify-center font-black text-slate-950 text-xl transition-transform group-hover:scale-105">
              ★
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-2xl font-black tracking-widest uppercase text-[var(--color-text)]">
                  NEX PLAY
                </span>
                <ArcadeBadge variant="amber">ARCADE</ArcadeBadge>
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] -mt-0.5">
                Gaming Platform
              </div>
            </div>
          </NavLink>

          {/* Center Navigation Links (Hidden on small mobile) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]/70">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#b27406]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-inner)]'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Actions: Notifications, Theme Switcher & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-2xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] text-sm sm:text-base cursor-pointer select-none transition-transform active:scale-95"
              aria-label="Toggle Theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notifications Dropdown */}
            {isAuthenticated && <NotificationDropdown />}

            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] cursor-pointer select-none"
                >
                  <Avatar name={user.displayName} src={user.avatarUrl} size="sm" status={user.status} />
                  <span className="hidden sm:inline text-xs font-black text-[var(--color-text)] truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">▼</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] z-50 p-2 animate-pop-in flex flex-col gap-1">
                    <div className="px-3 py-2 border-b border-[var(--color-border)]/50">
                      <div className="text-xs font-black text-[var(--color-text)] truncate">{user.displayName}</div>
                      <div className="text-[10px] font-bold text-[var(--color-text-muted)] truncate">@{user.username}</div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-[var(--color-text)] hover:bg-[var(--color-card-inner)] cursor-pointer transition-colors"
                    >
                      👤 My Profile
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/friends');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-[var(--color-text)] hover:bg-[var(--color-card-inner)] cursor-pointer transition-colors"
                    >
                      👥 Friends
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors border-t border-[var(--color-border)]/50"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_3px_0_#b27406] select-none cursor-pointer"
              >
                LOG IN
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-card)]/95 backdrop-blur-md border-t-2 border-[var(--color-border)] px-2 py-1.5 flex items-center justify-around select-none">
        {navLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-400 scale-105 font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-bold'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[9px] uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}

        {isAuthenticated && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-400 scale-105 font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-bold'
              }`
            }
          >
            <span className="text-base">👤</span>
            <span className="text-[9px] uppercase tracking-wider">Profile</span>
          </NavLink>
        )}
      </nav>

      {/* Footer (Desktop) */}
      <footer className="hidden md:block w-full text-center py-4 border-t border-[var(--color-border)]/40 text-xs font-bold tracking-widest uppercase text-[var(--color-text-muted)]">
        NEX PLAY &bull; MULTIPLAYER ARCADE GAMING PLATFORM &bull; ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};
