import React, { useState } from 'react';
import { JobDetails, ExtensionSettings } from '../types';
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
  settings: ExtensionSettings;
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
  settings,
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

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px] rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="relative">
          <div className="w-9 h-9 rounded-full border-2 border-secondary border-t-primary animate-spin" />
          <Sparkles className="w-3.5 h-3.5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
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
      <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 rounded-xl border border-dashed border-border/80 bg-card shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center text-muted-foreground">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-[260px]">
          <h3 className="text-xs font-bold text-foreground">
            No Job Posting Detected
          </h3>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Navigate to an ATS job posting (Workday, Greenhouse, Lever, Ashby) to use 1-click tools.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-border/80 bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs select-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Rescan Tab</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Detected Job Main Card matching career-agent-web */}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
        {/* Header row: ATS Badge + Rescan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border/80">
              {job.atsType}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">• Active Tab</span>
          </div>

          <button
            onClick={onRefresh}
            title="Rescan current page"
            className="h-7 w-7 rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-all cursor-pointer select-none shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Job Title & Company */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-foreground font-semibold shrink-0 text-xs shadow-2xs">
              <CompanyLogo name={job.company} size={15} className="w-3.5 h-3.5 min-w-[14px] rounded-xs shrink-0" />
              <span className="truncate max-w-[130px]">{job.company}</span>
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

        <hr className="border-border/60 my-1" />

        {/* 1-Click Autofill Button (Always available for instant 0-token autofill) */}
        <AutofillBar
          atsType={job.atsType}
          onAutofill={onTriggerAutofill}
          isAutofilling={isAutofilling}
          statusMessage={autofillStatus.message}
          statusType={autofillStatus.type}
        />

        {/* Save to Tracker Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isAlreadyTracked}
          className={`w-full h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer select-none shadow-2xs ${
            isAlreadyTracked
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'border-border/80 bg-card hover:bg-muted/50 text-foreground'
          }`}
        >
          {isAlreadyTracked ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Saved to Tracker</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isSaving ? 'Saving...' : 'Save to Application Tracker'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
