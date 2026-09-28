import React from 'react';
import { StatusDot, UserStatus } from './StatusDot.js';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'P';

  const avatarUrl =
    src || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'player')}&backgroundColor=ffbf2b`;

  return (
    <div className={`relative inline-block select-none flex-shrink-0 ${className}`}>
      <div
        className={`
          ${sizeMap[size]} rounded-2xl overflow-hidden bg-[var(--color-card-inner)]
          border-2 border-[var(--color-border)] shadow-sm flex items-center justify-center font-black text-[var(--color-text)]
        `}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to text initials if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span className="font-black text-[var(--color-text)]">{initials}</span>
      </div>

      {status && (
        <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[var(--color-card)] rounded-full">
          <StatusDot status={status} size={size === 'xl' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
        </span>
      )}
    </div>
  );
};
