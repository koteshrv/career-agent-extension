import React from 'react';
import { RefreshCw, ExternalLink, Bookmark, Zap, Sparkles, Keyboard } from 'lucide-react';
import { JobDetails, TrackedApplication, ApplicationStatus, ExtensionSettings, CompanySignal } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { Button, Chip, Empty, IconButton } from './ui';
import { STATUS_LABELS } from '../lib/status';

interface JobViewProps {
  job: JobDetails | null;
  loading: boolean;
  onRescan: () => void;
  tracked: TrackedApplication | null;
  onSave: () => Promise<void>;
  onStatusChange: (status: ApplicationStatus) => Promise<void>;
  onAutofill: () => Promise<void>;
  autofill: { busy: boolean; message: string | null; tone: 'success' | 'error' | 'idle' };
  skills: { matched: string[]; missing: string[] } | null;
  signal: CompanySignal | null;
  settings: ExtensionSettings;
  onOpenSettings: () => void;
}

export const JobView: React.FC<JobViewProps> = ({ job, loading, onRescan, tracked, onSave, onStatusChange, onAutofill, autofill, skills, signal, settings, onOpenSettings }) => {
  const [saving, setSaving] = React.useState(false);
  const hasKey = Boolean(settings.aiApiKey.trim());

  if (loading) {
    return (
      <div className="space-y-3 p-1" aria-busy="true" aria-label="Reading this page">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-9 w-full animate-pulse rounded-sm bg-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <Empty
        icon={<Zap />}
        title="No job posting on this tab"
        body="Open a posting on Greenhouse, Lever, Ashby, Workday, LinkedIn or a company careers page."
        action={
          <Button size="sm" onClick={onRescan}>
            <RefreshCw />
            Scan again
          </Button>
        }
      />
    );
  }

  const total = skills ? skills.matched.length + skills.missing.length : 0;

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-card p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CompanyLogo name={job.company} size={28} className="rounded-md border border-border" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{job.company}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {job.location}
                {job.atsType !== 'generic' && <> · via {job.atsType}</>}
              </p>
            </div>
          </div>
          <IconButton label="Scan this page again" onClick={onRescan}>
            <RefreshCw />
          </IconButton>
        </div>
        <h2 className="mt-2.5 text-[15px] font-medium leading-snug text-foreground line-clamp-2">{job.title}</h2>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{job.url.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {skills && total > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {skills.matched.length} of {total}
              </span>{' '}
              of your skills appear on this page
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {skills.matched.slice(0, 8).map((s) => (
                <Chip key={s} tone="good">
                  {s}
                </Chip>
              ))}
              {skills.missing.slice(0, 4).map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        )}

        {signal && (
          <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
            From {signal.total_applications} tracked applicants: {signal.median_response_days !== null ? `replies in about ${Math.round(signal.median_response_days)} days` : 'no reply times yet'}
            {signal.ghost_score >= 0.5 ? ', most never hear back' : signal.interview_rate >= 0.2 ? `, ${Math.round(signal.interview_rate * 100)}% get an interview` : ''}.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <Button variant="primary" full onClick={onAutofill} disabled={autofill.busy}>
          <Zap className={autofill.busy ? 'animate-pulse' : ''} />
          {autofill.busy ? 'Filling the form' : 'Autofill this application'}
        </Button>
        {autofill.message && (
          <p role="status" className={`rounded-sm border px-2.5 py-2 text-xs ${autofill.tone === 'success' ? 'border-transparent bg-[#d9f7e6] text-foreground dark:bg-[#0f2a1c]' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
            {autofill.message}
          </p>
        )}

        {tracked ? (
          <label className="flex h-9 items-center justify-between rounded-lg border border-border bg-card px-3.5 text-[13px]">
            <span className="text-muted-foreground">In your pipeline</span>
            <select value={tracked.status} onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)} aria-label="Stage" className="cursor-pointer bg-transparent font-medium text-foreground outline-none">
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Button
            full
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave();
              } finally {
                setSaving(false);
              }
            }}
          >
            <Bookmark />
            {saving ? 'Saving' : 'Save to pipeline'}
          </Button>
        )}

        <div className="flex items-start gap-2 px-0.5 pt-1 text-[11px] text-muted-foreground">
          <Keyboard className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Alt+Shift+F autofills without opening this popup.{' '}
            {hasKey ? (
              <>
                <Sparkles className="inline size-3 align-[-2px]" /> The CareerAgent icon beside any question drafts an answer.
              </>
            ) : (
              <button type="button" onClick={onOpenSettings} className="font-medium text-primary hover:underline cursor-pointer">
                Add an AI key to draft answers.
              </button>
            )}
          </span>
        </div>
      </section>
    </div>
  );
};
