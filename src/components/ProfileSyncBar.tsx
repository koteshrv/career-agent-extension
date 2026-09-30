import React from 'react';
import { SyncedProfileSummary, ExtensionSettings } from '../types';
import { openPlatformUrl } from '../lib/api';
import { ExternalLink, Sparkles } from 'lucide-react';

interface ProfileSyncBarProps {
  settings: ExtensionSettings;
  syncedProfile: SyncedProfileSummary | null;
  onOpenSettings: () => void;
}

export const ProfileSyncBar: React.FC<ProfileSyncBarProps> = ({
  settings,
  syncedProfile,
  onOpenSettings,
}) => {
  const hasKey = Boolean(settings.aiApiKey.trim());

  if (!hasKey) {
    return (
      <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">
              Inline AI Writing Assistant
            </h4>
          </div>

          <button
            onClick={onOpenSettings}
            className="h-6 px-2 rounded-md border border-border/60 bg-secondary hover:bg-secondary/80 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer select-none"
          >
            Configure
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-normal">
          Add your free Gemini or OpenAI key to draft custom answers directly on job application textareas.
        </p>

        <div className="flex items-center gap-2 pt-1 border-t border-border/60 text-xs">
          <button
            onClick={() => openPlatformUrl('/profile')}
            className="flex-1 h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer select-none shadow-2xs"
          >
            <span>Candidate Profile</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </button>

          <button
            onClick={() => openPlatformUrl('/tracker')}
            className="flex-1 h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer select-none shadow-2xs"
          >
            <span>Web Tracker</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2 shadow-2xs">
      {/* Model & AI Status Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">
            {syncedProfile?.name || 'Local Candidate Profile'}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            ({settings.aiModel.replace('gemini-3.5-flash-lite', '3.5 Lite')})
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="h-6 px-2 rounded-md border border-border/60 bg-secondary hover:bg-secondary/80 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer select-none shrink-0"
        >
          Change
        </button>
      </div>

      {/* Deep links to web platform */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60 text-xs">
        <button
          onClick={() => openPlatformUrl('/profile')}
          className="flex-1 h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer select-none shadow-2xs"
        >
          <span>Candidate Profile</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>

        <button
          onClick={() => openPlatformUrl('/tracker')}
          className="flex-1 h-7 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer select-none shadow-2xs"
        >
          <span>Web Tracker</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
