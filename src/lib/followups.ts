import type { TrackedApplication, CandidateProfile } from '../types';

const DAY = 24 * 60 * 60 * 1000;

export function daysUntilFollowUp(app: TrackedApplication, now = Date.now()): number {
  const target = app.followUpDate ? new Date(app.followUpDate).getTime() : new Date(app.appliedDate).getTime() + 5 * DAY;
  return Math.round((target - now) / DAY);
}

export function needsFollowUp(app: TrackedApplication): boolean {
  return (app.status === 'APPLIED' || app.status === 'INTERVIEWING') && !app.followedUp;
}

export function dueFollowUps(apps: TrackedApplication[]): TrackedApplication[] {
  return apps.filter((a) => needsFollowUp(a) && daysUntilFollowUp(a) <= 2).sort((a, b) => daysUntilFollowUp(a) - daysUntilFollowUp(b));
}

export function nudgeEmail(app: TrackedApplication, profile: CandidateProfile): string {
  const name = profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : 'Candidate';
  const applied = new Date(app.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `Hi ${app.company} Recruiting Team,

I hope your week is going well. I am writing to follow up on my application for the ${app.title} role submitted on ${applied}.

I remain very interested in ${app.company} and would welcome any update on the timeline or next steps. If additional materials or code samples would help, I am happy to share them.

Thank you for your time,

${name}
${profile.linkedinUrl || profile.portfolioUrl || ''}`.trim();
}
