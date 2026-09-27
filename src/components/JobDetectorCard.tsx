import React, { useState } from 'react';
import { JobDetails, CandidateProfile } from '../types';
import { AutofillBar } from './AutofillBar';
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Bookmark,
  Check,
  Building2,
  AlertCircle,
  RefreshCw,
  Sparkles,
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
  profile: CandidateProfile;
  onGoToProfile: () => void;
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
  profile,
  onGoToProfile,
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

  const isProfileIncomplete = !profile.firstName || !profile.email;

  const isATS = job && ['greenhouse', 'lever', 'ashby'].includes(job.atsType);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-brand-200 dark:border-brand-900 border-t-brand-600 animate-spin" />
          <Sparkles className="w-5 h-5 text-brand-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
            Detecting Job On Active Tab...
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-[240px]">
            Inspecting page structure for Greenhouse, Lever, Ashby, or job board details.
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px]">
        <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
          <Briefcase className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-[280px]">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No Active Job Page Detected
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Navigate to an ATS job posting on Greenhouse, Lever, Ashby, or a job board like LinkedIn/Indeed to use 1-click tools.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
    <div className="p-4 space-y-4">
      {/* Profile completion notice if fields are missing */}
      {isProfileIncomplete && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Candidate Profile Incomplete: </span>
            <span>Add your name and email to enable automatic autofill.</span>
          </div>
          <button
            onClick={onGoToProfile}
            className="text-[11px] underline font-semibold text-brand-600 dark:text-brand-400 shrink-0"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Detected Job Main Card */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs space-y-3">
        {/* Header row: ATS Badge + Rescan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                atsBadgeColors[job.atsType] || atsBadgeColors.generic
              }`}
            >
              {job.atsType}
            </span>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">• Detected</span>
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
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-50 leading-snug line-clamp-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-600 dark:text-stone-400 pt-0.5">
            <div className="flex items-center gap-1 font-medium text-stone-800 dark:text-stone-200">
              <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate max-w-[140px]">{job.company}</span>
            </div>

            <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </div>
          </div>
        </div>

        {/* Canonical link */}
        {job.url && (
          <div className="pt-1">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-full"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{job.url}</span>
            </a>
          </div>
        )}

        <hr className="border-stone-100 dark:border-stone-800/80 my-1" />

        {/* 1-Click Autofill Bar (Double Value Loop: autofill + auto-log to tracker with 3-day reminder) */}
        <AutofillBar
          atsType={job.atsType}
          onAutofill={onTriggerAutofill}
          isAutofilling={isAutofilling}
          statusMessage={autofillStatus.message}
          statusType={autofillStatus.type}
          isSupportedATS={Boolean(isATS)}
        />

        {/* Secondary Action: Save to Tracker without autofill */}
        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={isSaving || isAlreadyTracked}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
              isAlreadyTracked
                ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-200'
            }`}
          >
            {isAlreadyTracked ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Saved to Applications Tracker</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>{isSaving ? 'Saving...' : '📌 Save to Tracker (3-Day Reminder)'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
