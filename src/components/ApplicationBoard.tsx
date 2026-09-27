import React, { useState } from 'react';
import { TrackedApplication, ApplicationStatus } from '../types';
import { updateApplicationStatus, deleteApplication } from '../lib/storage';
import {
  Briefcase,
  Calendar,
  ExternalLink,
  Trash2,
  Clock,
  Search,
  Filter,
  CheckCircle,
  Building,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

interface ApplicationBoardProps {
  applications: TrackedApplication[];
  onRefreshApplications: () => Promise<void>;
  onAddNewManual: () => void;
}

export const ApplicationBoard: React.FC<ApplicationBoardProps> = ({
  applications,
  onRefreshApplications,
  onAddNewManual,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();

  // Helper to format date
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to check if follow-up is due or overdue
  const isFollowUpDue = (app: TrackedApplication) => {
    if (app.status === 'REJECTED' || app.status === 'OFFER') return false;
    if (!app.followUpDate) return false;
    return new Date(app.followUpDate) <= now;
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    await updateApplicationStatus(id, newStatus);
    await onRefreshApplications();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteApplication(id);
      await onRefreshApplications();
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & search
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'FOLLOW_UP_DUE') return isFollowUpDue(app);
    return app.status === filterStatus;
  });

  const statusColors: Record<ApplicationStatus, string> = {
    SAVED: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    APPLIED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    INTERVIEWING: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    OFFER: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const dueCount = applications.filter(isFollowUpDue).length;

  return (
    <div className="p-4 space-y-3">
      {/* Top Header & Quick Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <span>Tracked Applications</span>
            <span className="text-xs font-normal text-stone-500">
              ({applications.length})
            </span>
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Auto-logged upon autofill with 3-day reminder.
          </p>
        </div>

        <button
          onClick={onAddNewManual}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors"
          title="Add application manually"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Follow-up Due Banner if any */}
      {dueCount > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">
              {dueCount} application{dueCount > 1 ? 's' : ''} require follow-up!
            </span>
          </div>
          <button
            onClick={() => setFilterStatus(filterStatus === 'FOLLOW_UP_DUE' ? 'ALL' : 'FOLLOW_UP_DUE')}
            className="text-[11px] font-semibold underline text-amber-700 dark:text-amber-300"
          >
            {filterStatus === 'FOLLOW_UP_DUE' ? 'Show all' : 'View due'}
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role or company..."
            className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter applications by status"
          className="px-2 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="ALL">All ({applications.length})</option>
          <option value="APPLIED">Applied</option>
          <option value="INTERVIEWING">Interviewing</option>
          <option value="OFFER">Offer</option>
          <option value="SAVED">Saved</option>
          <option value="FOLLOW_UP_DUE">Due Follow-up</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="space-y-2.5 pt-1">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
            <Briefcase className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              No applications tracked yet
            </p>
            <p className="text-[11px] text-stone-400">
              Use "1-Click Autofill Form" on any ATS page or click "+ Add" to track a job.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const due = isFollowUpDue(app);
            return (
              <div
                key={app.id}
                className={`p-3 rounded-lg border bg-white dark:bg-stone-900 shadow-2xs space-y-2 transition-all ${
                  due
                    ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-300/50'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Header row: Job Title + Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {app.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                      <Building className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {app.company}
                      </span>
                      <span>•</span>
                      <span className="truncate">{app.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deletingId === app.id}
                    title="Remove application"
                    className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status + Follow-up row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center gap-1.5">
                    {/* Status Select */}
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatus)
                      }
                      aria-label="Application status"
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                        statusColors[app.status] || statusColors.APPLIED
                      }`}
                    >
                      <option value="SAVED">Saved</option>
                      <option value="APPLIED">Applied</option>
                      <option value="INTERVIEWING">Interviewing</option>
                      <option value="OFFER">Offer</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Follow-up Due Badge */}
                    {due && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Follow-up Due!
                      </span>
                    )}
                  </div>

                  {/* Dates / Link */}
                  <div className="flex items-center gap-2 text-[10px] text-stone-400">
                    <span title={`Applied on ${formatDate(app.appliedAt)}`}>
                      {formatDate(app.appliedAt)}
                    </span>

                    {app.jobUrl && (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Open job link"
                        className="hover:text-brand-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
