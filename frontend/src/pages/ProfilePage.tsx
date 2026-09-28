import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { apiClient } from '../services/api/apiClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';

export const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const targetUsername = username || currentUser?.username;
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Modal fields
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');

  const loadProfile = async () => {
    if (!targetUsername) return;
    try {
      const res = await apiClient.users.getProfile(targetUsername);
      setProfile(res.profile);
      setEditDisplayName(res.profile.displayName);
      setEditBio(res.profile.bio);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetUsername]);

  const isOwnProfile = currentUser?.username === targetUsername;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.users.updateProfile({
        displayName: editDisplayName,
        bio: editBio,
      });
      updateUser(res.user);
      setProfile((prev: any) => ({
        ...prev,
        displayName: res.user.displayName,
        bio: res.user.bio,
      }));
      setIsEditing(false);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-black uppercase tracking-wider text-amber-400 animate-pulse">
        LOADING PLAYER PROFILE...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">👤</span>
        <h2 className="text-base font-black text-[var(--color-text)] uppercase">
          Player Profile Not Found
        </h2>
        <ArcadeButton variant="amber" size="sm" onClick={() => navigate('/dashboard')}>
          RETURN TO DASHBOARD
        </ArcadeButton>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in text-left">
      {/* 1. Profile Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_8px_0_var(--color-card-shadow)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar
            name={profile.displayName}
            src={profile.avatarUrl}
            size="xl"
            status={profile.status}
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
                {profile.displayName}
              </h1>
              <ArcadeBadge variant="amber">PRO GAMER</ArcadeBadge>
            </div>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">
              @{profile.username} &bull; Member since {new Date(profile.createdAt).toLocaleDateString()}
            </span>
            <p className="text-xs font-medium text-[var(--color-text)] mt-1 max-w-lg">
              &quot;{profile.bio}&quot;
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <ArcadeButton
            variant="cyan"
            size="md"
            onClick={() => setIsEditing(true)}
            icon="✏️"
          >
            EDIT PROFILE
          </ArcadeButton>
        )}
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_4px_0_var(--color-card-shadow)] flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
            GAMES PLAYED
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[var(--color-text)] mt-1">
            {profile.stats?.gamesPlayed || 0}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[#1eb29a]/40 shadow-[0_4px_0_var(--color-card-shadow)] flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
            WINS
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {profile.stats?.wins || 0}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[#e74c60]/40 shadow-[0_4px_0_var(--color-card-shadow)] flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
            LOSSES
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
            {profile.stats?.losses || 0}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-amber-400/40 shadow-[0_4px_0_var(--color-card-shadow)] flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
            WIN RATE
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {profile.stats?.winRate || 0}%
          </span>
        </div>
      </div>

      {/* 3. Recent Matches & Favourite Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-3">
            <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
              RECENT MATCHES
            </span>
            <ArcadeBadge variant="slate">HISTORY</ArcadeBadge>
          </div>

          <div className="flex flex-col gap-2.5">
            {profile.recentMatches?.map((match: any) => (
              <div
                key={match.id}
                className="p-3.5 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {match.result === 'WIN' ? '🏆' : match.result === 'LOSS' ? '💔' : '🤝'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[var(--color-text)]">
                      vs {match.opponentName}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                      Tic Tac Toe &bull; {match.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-amber-400">
                    {match.score}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      match.result === 'WIN'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : match.result === 'LOSS'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {match.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favourite Games */}
        <div className="p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 pb-3">
            <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
              FAVOURITE GAMES
            </span>
            <ArcadeBadge variant="amber">TOP PICKS</ArcadeBadge>
          </div>

          <div className="flex flex-col gap-3">
            {profile.favouriteGames?.map((favGame: string, idx: number) => (
              <div
                key={favGame}
                className="p-3.5 rounded-2xl bg-[var(--color-card-inner)] border border-[var(--color-border)]/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[var(--color-text)]">
                    {favGame}
                  </span>
                </div>

                <ArcadeButton
                  variant="amber"
                  size="sm"
                  onClick={() => navigate('/tic-tac-toe')}
                >
                  PLAY
                </ArcadeButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-[380px] p-6 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_10px_0_var(--color-card-shadow)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-3">
              <span className="text-base font-black uppercase tracking-wider text-[var(--color-text)]">
                EDIT PROFILE
              </span>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-black text-[var(--color-text-muted)] hover:text-rose-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  BIO / STATUS PHRASE
                </label>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
              </div>

              <ArcadeButton variant="cyan" size="md" fullWidth type="submit">
                SAVE CHANGES
              </ArcadeButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
