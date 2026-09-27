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
      <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-2.5 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground">
              Add Your AI API Key
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Bring your own free Gemini, OpenAI, Claude, or Groq API key to power 1-click ATS application autofill.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-2xs cursor-pointer"
        >
          Select Model & Enter Key in Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2.5">
      {/* Model & AI Status Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">
                {syncedProfile?.name || 'AI Assistant Active'}
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
          className="px-2 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* Deep links to web platform */}
      <div className="flex items-center gap-2 pt-1 border-t border-border text-xs">
        <button
          onClick={() => openPlatformUrl('/profile')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <span>Edit Profile on Web</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>

        <button
          onClick={() => openPlatformUrl('/tracker')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <span>Full Board</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
