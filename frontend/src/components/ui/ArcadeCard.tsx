import React from 'react';

interface ArcadeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'inset' | 'highlight';
  glow?: boolean;
}

export const ArcadeCard: React.FC<ArcadeCardProps> = ({
  variant = 'default',
  glow = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass = {
    default: 'bg-[var(--color-card)] border border-[var(--color-border)] shadow-[0_6px_0_var(--color-card-shadow)]',
    inset: 'bg-[var(--color-card-inner)] border border-[var(--color-border)]/60 shadow-inner',
    highlight: 'bg-[var(--color-card)] border-2 border-amber-400/80 shadow-[0_6px_0_#c97808]',
  }[variant];

  return (
    <div
      className={`
        rounded-2xl p-4 transition-all duration-200
        ${variantClass}
        ${glow ? 'ring-4 ring-amber-400/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
