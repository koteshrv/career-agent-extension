import React from 'react';
import { ExtensionView, SyncedProfileSummary } from '../types';
import { Orbit, Settings, ArrowLeft, Sun, Moon, CheckCircle2, KeyRound } from 'lucide-react';

interface HeaderProps {
  currentView: ExtensionView;
  onViewChange: (view: ExtensionView) => void;
  syncedProfile: SyncedProfileSummary | null;
  hasApiKey: boolean;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  syncedProfile,
  hasApiKey,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs sticky top-0 z-50 px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left: Brand or Back button */}
        {currentView === 'settings' ? (
          <button
            onClick={() => onViewChange('main')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Action HUD</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Orbit className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight text-stone-900 dark:text-white">
                  Career<span className="text-brand-600 dark:text-brand-500">Agent</span>
                </span>
                <span className="text-[9px] font-medium px-1 py-0.2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded border border-brand-200 dark:border-brand-800/40">
                  Companion
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Connection Status & Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Connection status pill */}
          <button
            onClick={() => onViewChange('settings')}
            title={hasApiKey ? 'Connected to CareerAgent' : 'Configure API Key in Settings'}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
              hasApiKey && syncedProfile
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:border-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasApiKey && syncedProfile ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {hasApiKey && syncedProfile
                ? syncedProfile.name.split(' ')[0]
                : 'Set API Key'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Settings button */}
          {currentView !== 'settings' && (
            <button
              onClick={() => onViewChange('settings')}
              className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Extension Settings"
              aria-label="Open settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
