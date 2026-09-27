import { JobDetails } from '../../types';

export function isLinkedInJobsPage(url: string): boolean {
  return url.includes('linkedin.com/jobs');
}

export function extractLinkedIn(url: string, doc: Document = document): JobDetails | null {
  if (!isLinkedInJobsPage(url)) return null;

  // Title extraction
  const titleEl =
    doc.querySelector('.job-details-jobs-unified-top-card__job-title') ||
    doc.querySelector('.jobs-unified-top-card__job-title') ||
    doc.querySelector('.top-card-layout__title') ||
    doc.querySelector('h1.t-24') ||
    doc.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'LinkedIn Job';

  // Company extraction
  const companyEl =
    doc.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
    doc.querySelector('.job-details-jobs-unified-top-card__company-name') ||
    doc.querySelector('.jobs-unified-top-card__company-name') ||
    doc.querySelector('.topcard__org-name-link') ||
    doc.querySelector('a.topcard__org-name-link');
  const company = companyEl?.textContent?.trim() || 'LinkedIn Recruiter';

  // Location extraction
  const locationEl =
    doc.querySelector('.job-details-jobs-unified-top-card__bullet') ||
    doc.querySelector('.jobs-unified-top-card__bullet') ||
    doc.querySelector('.topcard__flavor--bullet') ||
    doc.querySelector('.job-details-jobs-unified-top-card__workplace-type');
  const location = locationEl?.textContent?.trim() || 'Location via LinkedIn';

  return {
    title,
    company,
    location,
    url: (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href || url,
    atsType: 'linkedin',
  };
}
