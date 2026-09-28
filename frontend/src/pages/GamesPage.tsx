import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';

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

export const GamesPage: React.FC = () => {
  const [games, setGames] = useState<GameItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.games.getGames().then((res: { games: any[] }) => {
      setGames(res.games || []);
    });
  }, []);

  const categories = ['ALL', 'BOARD', 'STRATEGY', 'ARCADE', 'CASUAL'];

  const filteredGames = games.filter((g) => {
    const matchesCategory =
      selectedCategory === 'ALL' || g.category.toUpperCase() === selectedCategory;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[var(--color-text)]">
              GAMES VAULT
            </h1>
            <ArcadeBadge variant="amber">MULTIPLAYER</ArcadeBadge>
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Explore casual retro-modern games built for real-time social competition
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games..."
          className="w-full sm:w-64 px-4 py-2 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#b27406]'
                : 'bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => {
          const isAvailable = game.status === 'AVAILABLE';

          return (
            <div
              key={game.id}
              className={`
                relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between gap-5 select-none
                ${
                  isAvailable
                    ? 'bg-[var(--color-card)] border-amber-400/50 shadow-[0_8px_0_var(--color-card-shadow)] hover:border-amber-400 hover:-translate-y-0.5'
                    : 'bg-[var(--color-card)] border-[var(--color-border)]/60 shadow-[0_4px_0_var(--color-card-shadow)] opacity-80'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-inner">
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-[var(--color-text)]">
                      {game.name}
                    </h3>
                    <span className="text-[11px] font-extrabold uppercase text-[var(--color-text-muted)]">
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

              <div className="flex flex-col gap-3 pt-3 border-t border-[var(--color-border)]/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {game.tags.map((t) => (
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
                    id={`btn-games-play-${game.id}`}
                    variant="amber"
                    size="md"
                    fullWidth
                    onClick={() => navigate(game.route)}
                    icon="🎮"
                  >
                    PLAY NOW
                  </ArcadeButton>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50 text-center text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)] italic">
                    Under Development
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
