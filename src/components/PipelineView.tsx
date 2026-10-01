import React, { useMemo, useState } from 'react';
import { Mail, Check, Copy, ExternalLink, Trash2, KanbanSquare } from 'lucide-react';
import { TrackedApplication, ApplicationStatus, CandidateProfile } from '../types';
import { Button, Empty, IconButton } from './ui';
import { STATUS_LABELS, STATUS_DOT } from '../lib/status';
import { dueFollowUps, daysUntilFollowUp, nudgeEmail } from '../lib/followups';
import { openPlatformUrl } from '../lib/api';

interface PipelineViewProps {
  apps: TrackedApplication[];
  profile: CandidateProfile;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onFollowedUp: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const PipelineView: React.FC<PipelineViewProps> = ({ apps, profile, onStatusChange, onFollowedUp, onDelete }) => {
  const due = useMemo(() => dueFollowUps(apps), [apps]);
  const recent = useMemo(() => [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12), [apps]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (app: TrackedApplication) => {
    try {
      await navigator.clipboard.writeText(nudgeEmail(app, profile));
      setCopied(app.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  if (apps.length === 0) {
    return (
      <Empty
        icon={<KanbanSquare />}
        title="Nothing in your pipeline yet"
        body="Save a posting from the This job tab, or just apply: submitted applications are added automatically."
        action={
          <Button size="sm" onClick={() => openPlatformUrl('/pipeline')}>
            Open the dashboard
            <ExternalLink />
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {due.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-[11px] font-medium text-muted-foreground">Follow-ups due</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {due.map((app) => {
              const d = daysUntilFollowUp(app);
              return (
                <li key={app.id} className="p-3">
                  <p className="truncate text-[13px] font-medium text-foreground">{app.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {app.company} · {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'due today' : `due in ${d}d`}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" onClick={() => copy(app)}>
                      {copied === app.id ? <Check className="text-status-interviewing" /> : <Copy />}
                      {copied === app.id ? 'Copied' : 'Copy email'}
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => onFollowedUp(app.id)}>
                      <Mail />
                      Followed up
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-[11px] font-medium text-muted-foreground">Recent</h2>
          <button type="button" onClick={() => openPlatformUrl('/pipeline')} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer">
            Full pipeline
            <ExternalLink className="size-3" />
          </button>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {recent.map((app) => (
            <li key={app.id} className="flex items-center gap-2 p-2.5">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${STATUS_DOT[app.status]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{app.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {app.company} · {fmt(app.appliedDate)}
                </p>
              </div>
              <select value={app.status} onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)} aria-label={`Stage of ${app.title}`} className="h-7 cursor-pointer rounded-sm border border-transparent bg-transparent text-[12px] font-medium text-foreground hover:border-input">
                {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <IconButton label={`Remove ${app.title}`} onClick={() => onDelete(app.id)} className="h-7 w-7 hover:text-destructive">
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
