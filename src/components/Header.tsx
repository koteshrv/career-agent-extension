import React from 'react';
import { ExtensionView, ExtensionSettings } from '../types';
import { Orbit, Settings, ArrowLeft, Sun, Moon, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: ExtensionView;
  onViewChange: (view: ExtensionView) => void;
  settings: ExtensionSettings;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  settings,
  theme,
  onThemeToggle,
}) => {
  const hasKey = Boolean(settings.aiApiKey.trim());

  // Clean model display name
  const modelShortName = settings.aiModel
    .replace('gemini-3.5-flash-lite', 'Gemini 3.5 Lite')
    .replace('gemini-3.1-flash-lite', 'Gemini 3.1 Lite')
    .replace('gemini-3.8-flash', 'Gemini 3.8')
    .replace('gemini-3.7-flash', 'Gemini 3.7')
    .replace('gemini-3.6-flash', 'Gemini 3.6')
    .replace('gemini-3.5-flash', 'Gemini 3.5')
    .replace('gemini-3-flash', 'Gemini 3')
    .replace('gemini-2.5-flash-lite', 'Gemini 2.5 Lite')
    .replace('gemini-2.5-', 'Gemini 2.5 ')
    .replace('gemini-2.0-', 'Gemini 2.0 ')
    .replace('gpt-4o-mini', 'GPT-4o mini')
    .replace('gpt-4o', 'GPT-4o')
    .replace('claude-3-5-sonnet-20241022', 'Claude Sonnet')
    .replace('claude-3-5-haiku-20241022', 'Claude Haiku')
    .replace('llama-3.3-70b-versatile', 'Llama 3.3');

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
            <div className="flex items-center">
              <span className="font-bold text-base tracking-tight text-foreground">
                Career<span className="text-primary">Agent</span>
              </span>
            </div>
          </div>
        )}

        {/* Right: AI Key Status & Controls */}
        <div className="flex items-center gap-2">
          {/* AI Model Status Pill */}
          <button
            onClick={() => onViewChange('settings')}
            title={hasKey ? `Active Model: ${settings.aiModel}` : 'Configure AI API Key in Settings'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              hasKey
                ? 'bg-secondary text-foreground border-border hover:border-primary/40'
                : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-primary'
              }`}
            />
            <span className="truncate max-w-[110px]">
              {hasKey ? modelShortName : 'Set AI Key'}
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
              title="Configure AI Key & Model"
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
