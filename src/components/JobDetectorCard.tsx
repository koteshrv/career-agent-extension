import React, { useState } from 'react';
import { JobDetails } from '../types';
import { AutofillBar } from './AutofillBar';
import { CompanyLogo } from './CompanyLogo';
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Bookmark,
  Check,
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
          <div className="w-10 h-10 rounded-full border-3 border-secondary border-t-primary animate-spin" />
          <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">
            Detecting Job On Active Tab...
          </p>
          <p className="text-[11px] text-muted-foreground">
            Inspecting page for Greenhouse, Lever, Ashby, or LinkedIn.
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 rounded-xl border border-dashed border-border bg-card shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-[260px]">
          <h3 className="text-xs font-bold text-foreground">
            No Job Posting Detected
          </h3>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Navigate to an ATS job posting (Greenhouse, Lever, Ashby) or LinkedIn to use 1-click tools.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Rescan Tab</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Detected Job Main Card matching career-agent-web JobCard */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
        {/* Header row: ATS Badge + Rescan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-secondary text-foreground border border-border">
              {job.atsType}
            </span>
            <span className="text-[11px] text-muted-foreground">• Active Tab</span>
          </div>

          <button
            onClick={onRefresh}
            title="Rescan current page"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Job Title & Company */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-foreground font-semibold shrink-0">
              <CompanyLogo name={job.company} size={16} className="w-4 h-4 min-w-[16px] rounded-xs shrink-0" />
              <span className="truncate max-w-[140px]">{job.company}</span>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
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
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors truncate max-w-full"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{job.url}</span>
            </a>
          </div>
        )}

        <hr className="border-border my-1" />

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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Connect API Key to Enable 1-Click Autofill</span>
          </button>
        )}

        {/* Save to Tracker Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isAlreadyTracked}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isAlreadyTracked
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border bg-card hover:bg-muted text-foreground'
          }`}
        >
          {isAlreadyTracked ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Saved to CareerAgent Board</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isSaving ? 'Saving...' : '📌 Save to CareerAgent (3-Day Reminder)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
