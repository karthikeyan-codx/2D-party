import React from 'react';

export type ArcadeBadgeVariant = 'teal' | 'amber' | 'coral' | 'cyan' | 'slate' | 'pill';

interface ArcadeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ArcadeBadgeVariant;
  icon?: React.ReactNode;
  ribbon?: boolean;
}

const badgeVariants: Record<ArcadeBadgeVariant, string> = {
  teal: 'bg-[#1eb29a] text-white shadow-[0_2px_0_#127e6c]',
  amber: 'bg-[#f8a427] text-white shadow-[0_2px_0_#c97808]',
  coral: 'bg-[#e74c60] text-white shadow-[0_2px_0_#af2c3e]',
  cyan: 'bg-[#36b6ff] text-white shadow-[0_2px_0_#1988cc]',
  slate: 'bg-[#5d688e] text-white shadow-[0_2px_0_#3c4566]',
  pill: 'bg-[var(--color-hud-pill)] text-[var(--color-text)] border border-[var(--color-border)]',
};

export const ArcadeBadge: React.FC<ArcadeBadgeProps> = ({
  variant = 'teal',
  ribbon = false,
  icon,
  className = '',
  children,
  ...props
}) => {
  const variantClass = badgeVariants[variant];

  if (ribbon) {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`} {...props}>
        {/* Ribbon wing left */}
        <div className="w-2.5 h-full bg-[#15806e] -skew-y-12 rounded-l-sm" />
        {/* Ribbon center */}
        <div
          className={`
            px-4 py-1 text-xs font-black tracking-widest uppercase flex items-center gap-1.5
            ${variantClass} rounded-sm
          `}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </div>
        {/* Ribbon wing right */}
        <div className="w-2.5 h-full bg-[#15806e] skew-y-12 rounded-r-sm" />
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase
        ${variantClass}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
};
