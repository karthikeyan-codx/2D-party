import React from 'react';

export type ArcadeButtonVariant = 'amber' | 'teal' | 'coral' | 'cyan' | 'blue' | 'slate';
export type ArcadeButtonSize = 'sm' | 'md' | 'lg';

interface ArcadeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ArcadeButtonVariant;
  size?: ArcadeButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ArcadeButtonVariant, { bg: string; shadow: string; border: string }> = {
  amber: {
    bg: 'bg-[#f8a427] hover:bg-[#ffb43e] text-white',
    shadow: 'shadow-[0_4px_0_#c97808] active:shadow-[0_1px_0_#c97808]',
    border: 'border-t border-amber-200/40',
  },
  teal: {
    bg: 'bg-[#1eb29a] hover:bg-[#27c9ae] text-white',
    shadow: 'shadow-[0_4px_0_#127e6c] active:shadow-[0_1px_0_#127e6c]',
    border: 'border-t border-emerald-200/40',
  },
  coral: {
    bg: 'bg-[#e74c60] hover:bg-[#f06173] text-white',
    shadow: 'shadow-[0_4px_0_#af2c3e] active:shadow-[0_1px_0_#af2c3e]',
    border: 'border-t border-rose-200/40',
  },
  cyan: {
    bg: 'bg-[#36b6ff] hover:bg-[#5ec5ff] text-white',
    shadow: 'shadow-[0_4px_0_#1988cc] active:shadow-[0_1px_0_#1988cc]',
    border: 'border-t border-sky-200/40',
  },
  blue: {
    bg: 'bg-[#276cb8] hover:bg-[#3b82d4] text-white',
    shadow: 'shadow-[0_4px_0_#174780] active:shadow-[0_1px_0_#174780]',
    border: 'border-t border-blue-200/40',
  },
  slate: {
    bg: 'bg-[#5d688e] hover:bg-[#6e7ba6] text-white',
    shadow: 'shadow-[0_4px_0_#3c4566] active:shadow-[0_1px_0_#3c4566]',
    border: 'border-t border-slate-300/30',
  },
};

const sizeStyles: Record<ArcadeButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-extrabold tracking-wider rounded-lg',
  md: 'px-5 py-2.5 text-sm font-black tracking-wider rounded-xl',
  lg: 'px-7 py-3.5 text-base font-black tracking-widest rounded-2xl',
};

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  variant = 'amber',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <button
      disabled={disabled}
      className={`
        arcade-btn inline-flex items-center justify-center gap-2 uppercase font-arcade select-none
        transition-all duration-75 text-center
        ${currentVariant.bg}
        ${currentVariant.shadow}
        ${currentVariant.border}
        ${currentSize}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale shadow-none translate-y-1' : 'cursor-pointer active:translate-y-[3px]'}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
