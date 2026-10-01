import type { ApplicationStatus } from '../types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  ARCHIVED: 'Archived',
};

export const STATUS_DOT: Record<ApplicationStatus, string> = {
  SAVED: 'bg-muted-foreground',
  APPLIED: 'bg-primary',
  INTERVIEWING: 'bg-status-interviewing',
  OFFER: 'bg-status-interviewing ring-2 ring-status-interviewing/30',
  ARCHIVED: 'bg-border',
};
