import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';
import { Avatar } from '../components/ui/Avatar.js';

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'requests' | 'search'>('online');
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadFriends = async () => {
    try {
      const res = await apiClient.friends.getFriends();
      setFriends(res.friends || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await apiClient.users.search(searchQuery.trim());
      setSearchResults(res.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await apiClient.friends.sendRequest(receiverId);
      setActionMessage('Friend request sent!');
      loadFriends();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Could not send request');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    try {
      await apiClient.friends.acceptRequest(senderId);
      setActionMessage('Friend request accepted!');
      loadFriends();
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleRejectRequest = async (senderId: string) => {
    try {
      await apiClient.friends.rejectRequest(senderId);
      setActionMessage('Friend request rejected');
      loadFriends();
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await apiClient.friends.removeFriend(friendId);
      loadFriends();
    } catch {
      // ignore
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await apiClient.chat.getOrCreateDirect(targetUserId);
      navigate(`/chat/${res.conversation.id}`);
    } catch {
      navigate('/chat');
    }
  };

  const acceptedFriends = friends.filter((f) => f.status === 'FRIENDS');
  const onlineFriends = acceptedFriends.filter((f) => f.friend?.status !== 'OFFLINE');
  const pendingRequests = friends.filter((f) => f.status === 'REQUEST_RECEIVED');

  return (
    <div className="w-full flex flex-col gap-6 animate-pop-in text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[var(--color-text)]">
              FRIENDS & PLAYERS
            </h1>
            <ArcadeBadge variant="cyan">SOCIAL</ArcadeBadge>
          </div>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Connect with friends, start 1-to-1 conversations, or party up for games
          </p>
        </div>

        {actionMessage && (
          <div className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black animate-pulse">
            ✓ {actionMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-[var(--color-card)] p-1.5 gap-1.5 border border-[var(--color-border)] select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'online'
              ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#b27406]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          ONLINE ({onlineFriends.length})
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#b27406]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          ALL FRIENDS ({acceptedFriends.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-cyan-400 text-slate-950 shadow-[0_2px_0_#1888cc]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <span>REQUESTS</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'search'
              ? 'bg-emerald-400 text-slate-950 shadow-[0_2px_0_#15803d]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          🔍 SEARCH PLAYERS
        </button>
      </div>

      {/* Tab Panels */}
      {/* 1. Online Friends */}
      {activeTab === 'online' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {onlineFriends.length === 0 ? (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-8">
              <span className="text-4xl">😴</span>
              <h3 className="text-sm font-black uppercase text-[var(--color-text)]">
                NO FRIENDS ONLINE RIGHT NOW
              </h3>
              <p className="text-xs font-medium text-[var(--color-text-muted)] max-w-sm">
                Search players in the community and invite them to your friend roster.
              </p>
              <ArcadeButton
                variant="amber"
                size="sm"
                onClick={() => setActiveTab('search')}
              >
                FIND PLAYERS
              </ArcadeButton>
            </div>
          ) : (
            onlineFriends.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={f.friend.displayName}
                    src={f.friend.avatarUrl}
                    size="md"
                    status={f.friend.status}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black text-[var(--color-text)] truncate max-w-[120px]">
                      {f.friend.displayName}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                      @{f.friend.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartChat(f.friend.id)}
                    className="p-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-black cursor-pointer"
                    title="Send Message"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${f.friend.username}`)}
                    className="p-2 rounded-xl bg-[var(--color-card-inner)] hover:bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-black cursor-pointer"
                    title="View Profile"
                  >
                    👤
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. All Friends */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {acceptedFriends.length === 0 ? (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-8">
              <span className="text-4xl">👥</span>
              <h3 className="text-sm font-black uppercase text-[var(--color-text)]">
                NO FRIENDS ADDED YET
              </h3>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Search players and add them as friends to challenge them to games!
              </p>
              <ArcadeButton
                variant="amber"
                size="sm"
                onClick={() => setActiveTab('search')}
              >
                FIND PLAYERS
              </ArcadeButton>
            </div>
          ) : (
            acceptedFriends.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={f.friend.displayName}
                    src={f.friend.avatarUrl}
                    size="md"
                    status={f.friend.status}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black text-[var(--color-text)] truncate max-w-[120px]">
                      {f.friend.displayName}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                      @{f.friend.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartChat(f.friend.id)}
                    className="p-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-black cursor-pointer"
                    title="Send Message"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(f.friend.id)}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-black cursor-pointer"
                    title="Remove Friend"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Requests */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-3 max-w-xl">
          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6">
              <span className="text-3xl">📬</span>
              <p className="text-xs font-bold text-[var(--color-text-muted)] mt-2">
                No pending friend requests.
              </p>
            </div>
          ) : (
            pendingRequests.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_4px_0_var(--color-card-shadow)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={f.friend.displayName}
                    src={f.friend.avatarUrl}
                    size="md"
                    status={f.friend.status}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--color-text)]">
                      {f.friend.displayName}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-muted)]">
                      @{f.friend.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(f.friend.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase cursor-pointer shadow-[0_2px_0_#15803d]"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => handleRejectRequest(f.friend.id)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--color-card-inner)] hover:bg-rose-500/20 text-rose-400 border border-[var(--color-border)] text-xs font-black uppercase cursor-pointer"
                  >
                    REJECT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Search Players */}
      {activeTab === 'search' && (
        <div className="flex flex-col gap-5 max-w-xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or display name..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <ArcadeButton variant="teal" size="md" type="submit" disabled={isSearching}>
              {isSearching ? 'SEARCHING...' : 'SEARCH'}
            </ArcadeButton>
          </form>

          <div className="flex flex-col gap-3">
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)]">
                {searchQuery ? 'No players found matching your query.' : 'Type a name to search for other players.'}
              </div>
            ) : (
              searchResults.map((player) => (
                <div
                  key={player.id}
                  className="p-4 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_4px_0_var(--color-card-shadow)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={player.displayName}
                      src={player.avatarUrl}
                      size="md"
                      status={player.status}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[var(--color-text)]">
                        {player.displayName}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-muted)]">
                        @{player.username}
                      </span>
                    </div>
                  </div>

                  <ArcadeButton
                    variant="amber"
                    size="sm"
                    onClick={() => handleSendRequest(player.id)}
                    icon="➕"
                  >
                    ADD FRIEND
                  </ArcadeButton>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
