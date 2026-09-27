import React, { useState } from 'react';
import { SyncedProfileSummary } from '../types';
import { syncProfileFromPlatform, openPlatformUrl } from '../lib/api';
import { RefreshCw, ExternalLink, KeyRound, UserCheck } from 'lucide-react';

interface ProfileSyncBarProps {
  syncedProfile: SyncedProfileSummary | null;
  hasApiKey: boolean;
  onProfileSynced: (profile: SyncedProfileSummary) => void;
  onOpenSettings: () => void;
}

export const ProfileSyncBar: React.FC<ProfileSyncBarProps> = ({
  syncedProfile,
  hasApiKey,
  onProfileSynced,
  onOpenSettings,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncProfileFromPlatform();
      if (res.success && res.data) {
        onProfileSynced(res.data);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (!hasApiKey || !syncedProfile) {
    return (
      <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-2.5 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground">
              Connect to CareerAgent
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Add your API key to sync your candidate profile & enable 1-click ATS autofill.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-2xs cursor-pointer"
        >
          Enter API Key in Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2.5">
      {/* Profile Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            {syncedProfile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">
                {syncedProfile.name}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <UserCheck className="w-3 h-3 mr-0.5" /> Synced
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {syncedProfile.email}
            </p>
          </div>
        </div>

        {/* Resync button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          title="Refresh profile from CareerAgent"
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Deep links to web platform matching career-agent-web buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-border text-xs">
        <button
          onClick={() => openPlatformUrl('/profile')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <span>Edit Profile</span>
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
