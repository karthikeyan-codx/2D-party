import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { ArcadeButton } from '../components/ui/ArcadeButton.js';
import { ArcadeBadge } from '../components/ui/ArcadeBadge.js';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginId.trim() || !password.trim()) {
      setError('Please enter your username/email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginId.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !regUsername.trim() ||
      !regDisplayName.trim() ||
      !regEmail.trim() ||
      !regPassword.trim()
    ) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: regUsername.trim(),
        displayName: regDisplayName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email may already be taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Login helper for fast testing
  const handleDemoLogin = async (username: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-3 sm:p-4">
      {/* Arcade Card Wrapper */}
      <div className="relative w-full max-w-[420px] pt-6 animate-pop-in">
        {/* Star Crest */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-10 select-none">
          <div className="w-12 h-12 rounded-2xl bg-[#ffbf2b] border-2 border-amber-300 shadow-[0_4px_0_#c97808] flex items-center justify-center font-black text-slate-950 text-2xl animate-bounce">
            ★
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-[var(--color-card)] rounded-3xl border-2 border-[var(--color-border)] shadow-[0_10px_0_var(--color-card-shadow)] p-6 sm:p-8 pt-10 flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-1 border-b border-[var(--color-border)]/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black uppercase tracking-widest text-[var(--color-text)]">
                NEX PLAY
              </span>
              <ArcadeBadge variant="amber">ARCADE</ArcadeBadge>
            </div>
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              {mode === 'login' ? 'Sign In To Your Account' : 'Create Your Player Identity'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-[var(--color-card-inner)] p-1 gap-1 border border-[var(--color-border)]/60 select-none">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_2px_0_#b27406]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              LOG IN
            </button>
            <button
              id="tab-auth-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#36b6ff] text-white shadow-[0_2px_0_#1988cc]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black text-center animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="input-login-id"
                  className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                >
                  USERNAME OR EMAIL
                </label>
                <input
                  id="input-login-id"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. karthik or player@nexplay.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label
                  htmlFor="input-login-password"
                  className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <ArcadeButton
                id="btn-login-submit"
                variant="amber"
                size="lg"
                fullWidth
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
              </ArcadeButton>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-reg-username"
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                  >
                    USERNAME
                  </label>
                  <input
                    id="input-reg-username"
                    type="text"
                    maxLength={20}
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                    placeholder="player1"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-reg-display"
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                  >
                    DISPLAY NAME
                  </label>
                  <input
                    id="input-reg-display"
                    type="text"
                    maxLength={24}
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Gamer Pro"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label
                  htmlFor="input-reg-email"
                  className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="input-reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="player@nexplay.com"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-reg-pass"
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                  >
                    PASSWORD
                  </label>
                  <input
                    id="input-reg-pass"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="input-reg-confirm"
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]"
                  >
                    CONFIRM PASS
                  </label>
                  <input
                    id="input-reg-confirm"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter pass"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-card-inner)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <ArcadeButton
                id="btn-register-submit"
                variant="cyan"
                size="lg"
                fullWidth
                type="submit"
                disabled={isSubmitting}
                className="mt-1"
              >
                {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </ArcadeButton>
            </form>
          )}

          {/* Quick Demo Accounts for fast testing */}
          <div className="pt-2 border-t border-[var(--color-border)]/50 flex flex-col gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              FAST TEST ACCOUNTS
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('karthik')}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--color-card-inner)] hover:bg-amber-400/20 border border-[var(--color-border)] text-[11px] font-black text-amber-400 transition-colors cursor-pointer"
              >
                🎮 Karthik S
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('alex_pro')}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--color-card-inner)] hover:bg-sky-400/20 border border-[var(--color-border)] text-[11px] font-black text-sky-400 transition-colors cursor-pointer"
              >
                👾 Alex Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
