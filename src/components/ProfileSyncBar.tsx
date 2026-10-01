import React from 'react';
import { SyncedProfileSummary, ExtensionSettings } from '../types';
import { openPlatformUrl } from '../lib/api';
import { ExternalLink, Sparkles, UserCheck, KeyRound } from 'lucide-react';

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
      <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-card space-y-2.5 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground">
              Inline AI Writing Assistant
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Add your free Gemini or OpenAI key to unlock 1-click custom answers on tricky application questions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <button
            onClick={onOpenSettings}
            className="flex-1 h-7.5 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-2xs cursor-pointer select-none"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup AI Assistant</span>
          </button>
          <button
            onClick={() => openPlatformUrl('/profile')}
            className="h-7.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all select-none shadow-2xs"
            title="Edit Profile on Web"
          >
            <span>Profile</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-2.5">
      {/* Model & AI Status Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">
                {syncedProfile?.name || 'Local Candidate Profile'}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <UserCheck className="w-3 h-3 mr-0.5" /> Ready
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              {settings.aiModel}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="h-6 px-2 rounded-md border border-border/60 bg-secondary hover:bg-secondary/80 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer select-none"
        >
          Change
        </button>
      </div>

      {/* Deep links to web platform */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
        <button
          onClick={() => openPlatformUrl('/profile')}
          className="flex-1 h-7.5 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-all cursor-pointer shadow-2xs select-none"
        >
          <span>Edit Profile</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>

        <button
          onClick={() => openPlatformUrl('/tracker')}
          className="flex-1 h-7.5 flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-all cursor-pointer shadow-2xs select-none"
        >
          <span>Web Tracker</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
