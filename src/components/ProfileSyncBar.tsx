import React, { useState } from 'react';
import { SyncedProfileSummary } from '../types';
import { syncProfileFromPlatform, openPlatformUrl } from '../lib/api';
import { RefreshCw, ExternalLink, KeyRound, UserCheck, Sparkles } from 'lucide-react';

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
      <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Connect to CareerAgent
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
              Add your API key to sync your profile & enable 1-click ATS autofill.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 transition-colors shadow-xs"
        >
          Enter API Key in Settings
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-2.5">
      {/* Profile Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800/60">
            {syncedProfile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {syncedProfile.name}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <UserCheck className="w-3 h-3 mr-0.5" /> Synced
              </span>
            </div>
            <p className="text-[10px] text-stone-400 truncate">
              {syncedProfile.email}
            </p>
          </div>
        </div>

        {/* Resync button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          title="Refresh profile from CareerAgent"
          className="p-1.5 text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
        </button>
      </div>

      {/* Deep links to web platform */}
      <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80 text-[11px]">
        <button
          onClick={() => openPlatformUrl('/profile')}
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
        >
          <span>Edit Profile</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </button>

        <button
          onClick={() => openPlatformUrl('/tracker')}
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition-colors"
        >
          <span>Full Board</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </button>
      </div>
    </div>
  );
};
