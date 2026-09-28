import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { apiClient } from '../services/api/apiClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';

interface GameItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  status: 'AVAILABLE' | 'COMING_SOON';
  route: string;
  category: string;
  tags: string[];
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [games, setGames] = useState<GameItem[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [gamesRes, friendsRes] = await Promise.all([
          apiClient.games.getGames(),
          apiClient.friends.getFriends().catch(() => ({ friends: [] })),
        ]);
        setGames(gamesRes.games || []);
        setFriends(friendsRes.friends || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const onlineFriends = friends.filter(
    (f) => f.status === 'FRIENDS' && f.friend?.status !== 'OFFLINE'
  );

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-pop-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 animate-spin border-4 border-[var(--color-border)] shadow-[0_4px_0_var(--color-card-shadow)]" />
        <span className="text-sm font-black tracking-widest text-[var(--color-text-muted)] uppercase">
          Loading Arcade Command Center...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in">
      {/* 1. Hero Welcome & Quick Action Card */}
      <div className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/15 via-[var(--color-card)] to-sky-500/15 border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={user?.displayName || 'Gamer'}
            src={user?.avatarUrl}
            size="xl"
            status={user?.status || 'ONLINE'}
            className="hidden sm:block"
          />
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-3xl font-black uppercase tracking-wider text-[var(--color-text)]">
                Welcome back, {user?.displayName || 'Player'} 👋
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[var(--color-text-muted)]">
              Level up your match score, invite friends, and challenge the arcade leaderboards.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <ArcadeButton
            id="btn-dash-play-now"
            variant="amber"
            size="md"
            onClick={() => navigate('/tic-tac-toe')}
            icon="🎮"
          >
            PLAY NOW
          </ArcadeButton>
          <ArcadeButton
            id="btn-dash-create-room"
            variant="cyan"
            size="md"
            onClick={() => navigate('/rooms')}
            icon="🎪"
          >
            PARTY ROOMS
          </ArcadeButton>
        </div>
      </div>

      {/* 2. Main Grid: Games Showcase + Friends/Activity Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Game Catalog Showcase */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[var(--color-text)]">
                ARCADE GAMES
              </h2>
              <ArcadeBadge variant="teal">LIVE</ArcadeBadge>
            </div>
            <button
              onClick={() => navigate('/games')}
              className="text-xs font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              VIEW ALL GAMES &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {games.map((game) => {
              const isAvailable = game.status === 'AVAILABLE';

              return (
                <div
                  key={game.id}
                  className={`
                    relative p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 text-left select-none
                    ${
                      isAvailable
                        ? 'bg-[var(--color-card)] border-amber-400/40 shadow-[0_6px_0_var(--color-card-shadow)] hover:border-amber-400'
                        : 'bg-[var(--color-card)] border-[var(--color-border)]/60 shadow-[0_4px_0_var(--color-card-shadow)] opacity-75'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)] flex items-center justify-center text-2xl shadow-inner">
                        {game.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
                          {game.name}
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)]">
                          {game.minPlayers === game.maxPlayers
                            ? `${game.minPlayers} Players`
                            : `${game.minPlayers}-${game.maxPlayers} Players`}
                        </span>
                      </div>
                    </div>

                    <ArcadeBadge variant={isAvailable ? 'amber' : 'slate'}>
                      {isAvailable ? 'AVAILABLE' : 'COMING SOON'}
                    </ArcadeBadge>
                  </div>

                  <p className="text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
                    {game.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {game.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-[var(--color-card-inner)] text-[var(--color-text-muted)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {isAvailable ? (
                      <ArcadeButton
                        id={`btn-play-game-${game.id}`}
                        variant="amber"
                        size="sm"
                        onClick={() => navigate(game.route)}
                      >
                        PLAY
                      </ArcadeButton>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)] italic">
                        In Development
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Online Friends & Recent Activity */}
        <div className="flex flex-col gap-6">
          {/* Online Friends Widget */}
          <div className="p-5 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
                  ONLINE FRIENDS
                </span>
                <span className="text-xs font-black text-emerald-400">
                  ({onlineFriends.length})
                </span>
              </div>
              <button
                onClick={() => navigate('/friends')}
                className="text-[11px] font-black uppercase text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                MANAGE &rarr;
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {onlineFriends.length === 0 ? (
                <div className="py-4 text-center flex flex-col items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <p className="text-xs font-bold text-[var(--color-text-muted)]">
                    No friends online right now.
                  </p>
                  <button
                    onClick={() => navigate('/friends')}
                    className="text-[11px] font-black text-sky-400 uppercase tracking-wider hover:underline"
                  >
                    Find Players
                  </button>
                </div>
              ) : (
                onlineFriends.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={f.friend.displayName}
                        src={f.friend.avatarUrl}
                        size="sm"
                        status={f.friend.status}
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-[var(--color-text)] truncate max-w-[100px]">
                          {f.friend.displayName}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] truncate max-w-[100px]">
                          @{f.friend.username}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/chat')}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors cursor-pointer"
                    >
                      CHAT
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="p-5 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col gap-4 text-left">
            <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
              RECENT ACTIVITY
            </span>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50">
                <span className="text-lg">🏆</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[var(--color-text)]">
                    Won Tic Tac Toe Series
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    Defeated Alex Pro 3 — 1 in Best-of-5.
                  </span>
                  <span className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1">
                    Yesterday
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50">
                <span className="text-lg">🤝</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[var(--color-text)]">
                    New Friendship
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    Arcade Queen accepted your friend request.
                  </span>
                  <span className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1">
                    2 days ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
