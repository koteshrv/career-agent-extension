import React, { useState } from 'react';
import { AuthUser, ExtensionView } from '../types';
import { loginWithGoogle } from '../lib/api';
import { saveAuth } from '../lib/storage';
import {
  Sparkles,
  Briefcase,
  User,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Orbit,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  currentView: ExtensionView;
  onViewChange: (view: ExtensionView) => void;
  authUser: AuthUser | null;
  onAuthChange: (user: AuthUser | null) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  followUpDueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  authUser,
  onAuthChange,
  theme,
  onThemeToggle,
  followUpDueCount,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      await saveAuth(user);
      onAuthChange(user);
    } catch (err) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await saveAuth(null);
    onAuthChange(null);
    setShowAuthMenu(false);
  };

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm sticky top-0 z-50 px-3.5 py-2.5">
      {/* Top row: Brand + Auth + Theme */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-sm text-white">
            <Orbit className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-white">
                Career<span className="text-brand-600 dark:text-brand-500">Agent</span>
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded border border-brand-200 dark:border-brand-800/50">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-none">
              1-Click ATS Autofill & Tracker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Button / Profile avatar */}
          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setShowAuthMenu(!showAuthMenu)}
                className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full border border-stone-200 dark:border-stone-700 hover:border-brand-400 dark:hover:border-brand-500 transition-all text-left"
              >
                {authUser.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={authUser.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold text-[10px] flex items-center justify-center">
                    {authUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 max-w-[70px] truncate">
                  {authUser.name.split(' ')[0]}
                </span>
              </button>

              {showAuthMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-stone-900 rounded-lg shadow-lg border border-stone-200 dark:border-stone-800 p-2 z-50 text-xs">
                  <div className="px-2 py-1.5 border-b border-stone-100 dark:border-stone-800 mb-1">
                    <p className="font-semibold text-stone-800 dark:text-stone-100 truncate">{authUser.name}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{authUser.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors disabled:opacity-50 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-brand-400 dark:text-brand-600" />
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80">
        <button
          onClick={() => onViewChange('detect')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
            currentView === 'detect'
              ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          Active Job
        </button>

        <button
          onClick={() => onViewChange('applications')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium relative transition-all ${
            currentView === 'applications'
              ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Tracker
          {followUpDueCount > 0 && (
            <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
              {followUpDueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('profile')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
            currentView === 'profile'
              ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile
        </button>
      </nav>
    </header>
  );
};
