import React from 'react';

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY';

interface StatusDotProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'md',
  showLabel = false,
}) => {
  const config = {
    ONLINE: { color: 'bg-emerald-400', border: 'border-emerald-300', text: 'text-emerald-400', label: 'Online' },
    IN_GAME: { color: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-400', label: 'In Game' },
    AWAY: { color: 'bg-cyan-400', border: 'border-cyan-300', text: 'text-cyan-400', label: 'Away' },
    OFFLINE: { color: 'bg-slate-400', border: 'border-slate-300', text: 'text-slate-400', label: 'Offline' },
  }[status] || { color: 'bg-slate-400', border: 'border-slate-300', text: 'text-slate-400', label: 'Offline' };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <span className={`rounded-full ${dotSizes} ${config.color} ${status === 'ONLINE' ? 'animate-pulse' : ''}`} />
      {showLabel && (
        <span className={`text-[11px] font-black uppercase tracking-wider ${config.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};
