import React from 'react';
import { TrackedApplication } from '../types';
import { openPlatformUrl } from '../lib/api';
import { Briefcase, ExternalLink, Clock, Trash2, X } from 'lucide-react';

interface RecentApplicationsWidgetProps {
  applications: TrackedApplication[];
  onDeleteApplication?: (id: string) => Promise<void>;
  onClearApplications?: () => Promise<void>;
}

export const RecentApplicationsWidget: React.FC<RecentApplicationsWidgetProps> = ({
  applications,
  onDeleteApplication,
  onClearApplications,
}) => {
  const recent = applications.slice(0, 3);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isDue = (app: TrackedApplication) => {
    if (app.status === 'ARCHIVED' || app.status === 'OFFER') return false;
    return Boolean(app.followUpDate && new Date(app.followUpDate) <= new Date());
  };

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">
            Recent Applications
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">({applications.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {applications.length > 0 && onClearApplications && (
            <button
              onClick={onClearApplications}
              title="Clear all local tracked jobs"
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => openPlatformUrl('/tracker')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>View Kanban</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-[11px] text-muted-foreground py-1">
          No applications tracked yet. Use "1-Click Autofill Form" to track.
        </p>
      ) : (
        <div className="space-y-1.5">
          {recent.map((app) => (
            <div
              key={app.id}
              className="group flex items-center justify-between p-2.5 rounded-lg bg-secondary text-foreground text-xs"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-semibold text-foreground truncate text-xs">
                  {app.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {app.company} • {formatDate(app.appliedDate)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isDue(app) ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Clock className="w-2.5 h-2.5 text-amber-600" /> Due
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-card text-foreground border border-border">
                    {app.status}
                  </span>
                )}

                {onDeleteApplication && (
                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    title="Remove from local tracker"
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-card/80 rounded transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
