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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs shadow-2xs px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left: Brand or Back button */}
        {currentView === 'settings' ? (
          <button
            onClick={() => onViewChange('main')}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Action HUD</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-primary hover:opacity-90 transition-opacity flex items-center">
              <Orbit className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                Career<span className="text-primary">Agent</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-secondary text-foreground rounded-full border border-border shadow-2xs">
                Companion
              </span>
            </div>
          </div>
        )}

        {/* Right: Connection Status & Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Connection status pill */}
          <button
            onClick={() => onViewChange('settings')}
            title={hasApiKey ? 'Connected to CareerAgent' : 'Configure API Key in Settings'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              hasApiKey && syncedProfile
                ? 'bg-secondary text-foreground border-border hover:border-primary/40'
                : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasApiKey && syncedProfile ? 'bg-emerald-500 animate-pulse' : 'bg-primary'
              }`}
            />
            <span>
              {hasApiKey && syncedProfile
                ? syncedProfile.name.split(' ')[0]
                : 'Connect'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          {currentView !== 'settings' && (
            <button
              onClick={() => onViewChange('settings')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Extension Settings"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
