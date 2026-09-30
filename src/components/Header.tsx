import React from 'react';
import { ExtensionView, ExtensionSettings } from '../types';
import { Orbit, Settings, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  currentView: ExtensionView;
  onViewChange: (view: ExtensionView) => void;
  settings: ExtensionSettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  settings,
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
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-xs shadow-2xs px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left: Brand or Back button */}
        {currentView === 'settings' ? (
          <button
            onClick={() => onViewChange('main')}
            className="h-7 px-2.5 rounded-lg border border-border/60 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-primary hover:opacity-90 transition-opacity flex items-center shrink-0">
              <Orbit className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-base tracking-tight text-foreground">
                careeragent<span className="text-primary font-semibold">.fyi</span>
              </span>
            </div>
          </div>
        )}

        {/* Right: AI Key Status & Settings */}
        <div className="flex items-center gap-1.5">
          {/* AI Model Status Pill */}
          <button
            onClick={() => onViewChange('settings')}
            title={hasKey ? `Active Model: ${settings.aiModel}` : 'Configure AI API Key in Settings'}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium border border-border/80 transition-all cursor-pointer shadow-2xs select-none ${
              hasKey
                ? 'bg-card text-foreground hover:bg-muted/50 hover:border-border'
                : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-primary'
              }`}
            />
            <span className="truncate max-w-[110px] text-[11px] font-semibold">
              {hasKey ? modelShortName : 'Set AI Key'}
            </span>
          </button>

          {/* Settings button */}
          {currentView !== 'settings' && (
            <button
              onClick={() => onViewChange('settings')}
              className="h-7 w-7 rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-all cursor-pointer select-none shadow-2xs"
              title="Configure AI Key & Model"
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
