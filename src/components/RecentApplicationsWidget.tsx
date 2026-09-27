import React from 'react';
import { TrackedApplication } from '../types';
import { openPlatformUrl } from '../lib/api';
import { Briefcase, ExternalLink, Clock, CheckCircle } from 'lucide-react';

interface RecentApplicationsWidgetProps {
  applications: TrackedApplication[];
}

export const RecentApplicationsWidget: React.FC<RecentApplicationsWidgetProps> = ({
  applications,
}) => {
  const recent = applications.slice(0, 2);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isDue = (app: TrackedApplication) => {
    if (app.status === 'REJECTED' || app.status === 'OFFER') return false;
    return Boolean(app.followUpDate && new Date(app.followUpDate) <= new Date());
  };

  return (
    <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
            Recent Applications
          </span>
          <span className="text-[10px] text-stone-400">({applications.length})</span>
        </div>

        <button
          onClick={() => openPlatformUrl('/tracker')}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-500 transition-colors"
        >
          <span>View Kanban</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <p className="text-[11px] text-stone-400 py-1">
          No applications tracked yet. Use "1-Click Autofill Form" to track.
        </p>
      ) : (
        <div className="space-y-1.5">
          {recent.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 text-xs"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-semibold text-stone-900 dark:text-stone-100 truncate text-[11px]">
                  {app.jobTitle}
                </p>
                <p className="text-[10px] text-stone-500 truncate">
                  {app.company} • {formatDate(app.appliedAt)}
                </p>
              </div>

              {isDue(app) ? (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  <Clock className="w-2.5 h-2.5 text-amber-600" /> Due
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                  {app.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
