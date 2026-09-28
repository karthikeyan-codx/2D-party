import React, { useState } from 'react';
import { sfx } from '../../../services/audio/sfx.js';
import { Theme } from '../../../theme/theme.js';

interface TicTacToeControlsProps {
  onLeaveMatch: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const TicTacToeControls: React.FC<TicTacToeControlsProps> = ({
  onLeaveMatch,
  theme,
  onToggleTheme,
}) => {
  const [isMuted, setIsMuted] = useState(() => sfx.getMuted());

  const handleToggleSound = () => {
    const muted = sfx.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sfx.playClick();
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto flex items-center justify-between gap-3 pt-1">
      {/* Leave Match Button */}
      <button
        id="btn-leave-match"
        type="button"
        onClick={onLeaveMatch}
        className="arcade-btn px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 shadow-[0_2px_0_#4c0519] transition-colors cursor-pointer"
      >
        LEAVE MATCH
      </button>

      {/* Auxiliary Settings Controls (Sound & Theme) */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          id="btn-toggle-sound"
          type="button"
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="arcade-btn w-9 h-9 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] shadow-[0_2px_0_var(--color-card-shadow)] flex items-center justify-center text-[var(--color-text)] transition-colors"
        >
          {isMuted ? (
            <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          id="btn-toggle-theme"
          type="button"
          onClick={() => {
            sfx.playClick();
            onToggleTheme();
          }}
          title={theme === 'dark' ? 'Switch to Arcade Daylight (Light)' : 'Switch to Arcade Navy (Dark)'}
          aria-label="Toggle visual theme"
          className="arcade-btn w-9 h-9 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-inner)] border border-[var(--color-border)] shadow-[0_2px_0_var(--color-card-shadow)] flex items-center justify-center text-[var(--color-text)] transition-colors"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
