import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient.js';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.notifications.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await apiClient.notifications.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore
      }
    }
    setIsOpen(false);

    // Route based on notification type
    if (notif.type === 'FRIEND_REQUEST' || notif.type === 'FRIEND_ACCEPTED') {
      navigate('/friends');
    } else if (notif.type === 'ROOM_INVITE' && notif.data?.roomId) {
      navigate(`/rooms/${notif.data.roomId}`);
    } else if (notif.type === 'MATCH_RESULT') {
      navigate('/profile');
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        id="btn-notifications-toggle"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 sm:p-2.5 rounded-2xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] text-[var(--color-text)] transition-colors cursor-pointer select-none"
        aria-label="Notifications"
      >
        <span className="text-base sm:text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 border-2 border-[var(--color-card)] rounded-full text-[10px] font-black text-white flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[0_10px_0_var(--color-card-shadow)] z-50 p-4 animate-pop-in flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                {unreadCount} NEW
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-[var(--color-text-muted)]">
                No notifications right now!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 text-left ${
                    !notif.isRead
                      ? 'bg-[var(--color-card-inner)] border-amber-400/50 shadow-sm'
                      : 'bg-transparent border-[var(--color-border)]/40 hover:bg-[var(--color-card-inner)] opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--color-text)]">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-[var(--color-text-muted)] leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
