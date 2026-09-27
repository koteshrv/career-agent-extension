import React, { useState } from 'react';
import { JobDetails } from '../types';
import { AutofillBar } from './AutofillBar';
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Bookmark,
  Check,
  Building2,
  RefreshCw,
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface JobDetectorCardProps {
  job: JobDetails | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSaveToTracker: (job: JobDetails, status?: 'SAVED' | 'APPLIED') => Promise<void>;
  onTriggerAutofill: () => Promise<void>;
  isAutofilling: boolean;
  autofillStatus: {
    message: string | null;
    type: 'success' | 'error' | 'idle';
  };
  isAlreadyTracked: boolean;
  hasSyncedProfile: boolean;
  onOpenSettings: () => void;
}

export const JobDetectorCard: React.FC<JobDetectorCardProps> = ({
  job,
  isLoading,
  onRefresh,
  onSaveToTracker,
  onTriggerAutofill,
  isAutofilling,
  autofillStatus,
  isAlreadyTracked,
  hasSyncedProfile,
  onOpenSettings,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!job) return;
    setIsSaving(true);
    try {
      await onSaveToTracker(job, 'SAVED');
    } finally {
      setIsSaving(false);
    }
  };

  const isATS = job && ['greenhouse', 'lever', 'ashby'].includes(job.atsType);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-3 border-brand-200 dark:border-brand-900 border-t-brand-600 animate-spin" />
          <Sparkles className="w-4 h-4 text-brand-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
            Detecting Job On Active Tab...
          </p>
          <p className="text-[10px] text-stone-400">
            Inspecting page for Greenhouse, Lever, Ashby, or LinkedIn.
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-[260px]">
          <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
            No Job Posting Detected
          </h3>
          <p className="text-[11px] text-stone-400 leading-tight">
            Navigate to an ATS job posting (Greenhouse, Lever, Ashby) or LinkedIn to use 1-click tools.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Rescan Tab
        </button>
      </div>
    );
  }

  const atsBadgeColors: Record<string, string> = {
    greenhouse: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    lever: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    ashby: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    linkedin: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    indeed: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    generic: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
  };

  return (
    <div className="space-y-3">
      {/* Detected Job Main Card */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 shadow-2xs space-y-3">
        {/* Header row: ATS Badge + Rescan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                atsBadgeColors[job.atsType] || atsBadgeColors.generic
              }`}
            >
              {job.atsType}
            </span>
            <span className="text-[10px] text-stone-400">• Active Tab</span>
          </div>

          <button
            onClick={onRefresh}
            title="Rescan current page"
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Job Title & Company */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug line-clamp-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
              <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate max-w-[140px]">{job.company}</span>
            </div>

            <div className="flex items-center gap-1 text-stone-500 text-[11px]">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </div>
          </div>
        </div>

        {/* Canonical link */}
        {job.url && (
          <div className="pt-0.5">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-full"
            >
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{job.url}</span>
            </a>
          </div>
        )}

        <hr className="border-stone-100 dark:border-stone-800/80 my-1" />

        {/* 1-Click Autofill Button */}
        {hasSyncedProfile ? (
          <AutofillBar
            atsType={job.atsType}
            onAutofill={onTriggerAutofill}
            isAutofilling={isAutofilling}
            statusMessage={autofillStatus.message}
            statusType={autofillStatus.type}
            isSupportedATS={Boolean(isATS)}
          />
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Connect API Key to Enable 1-Click Autofill</span>
          </button>
        )}

        {/* Save to Tracker Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isAlreadyTracked}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
            isAlreadyTracked
              ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-200'
          }`}
        >
          {isAlreadyTracked ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Saved to CareerAgent Board</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-stone-500" />
              <span>{isSaving ? 'Saving...' : '📌 Save to CareerAgent (3-Day Reminder)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
