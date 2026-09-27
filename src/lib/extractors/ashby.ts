import { JobDetails } from '../../types';

export function isAshbyPage(url: string, doc: Document = document): boolean {
  return (
    url.includes('jobs.ashbyhq.com') ||
    !!doc.querySelector('[data-qa="job-title"], [data-ashby-job-title], div[class*="JobPosting_title"]')
  );
}

export function extractAshby(url: string, doc: Document = document): JobDetails | null {
  if (!isAshbyPage(url, doc)) return null;

  // Title extraction: Ashby has data-qa="job-title" or main header
  const titleEl =
    doc.querySelector('[data-qa="job-title"]') ||
    doc.querySelector('[data-ashby-job-title]') ||
    doc.querySelector('div[class*="JobPosting_title"]') ||
    doc.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Job Opportunity';

  // Company extraction: Ashby URL is jobs.ashbyhq.com/:company/:jobId
  let company = '';
  const logoEl = doc.querySelector('header img[alt], [data-qa="company-logo"]') as HTMLImageElement;
  if (logoEl && logoEl.alt) {
    company = logoEl.alt.replace(/ logo/i, '').trim();
  }

  if (!company) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0]) {
        company = decodeURIComponent(parts[0]).charAt(0).toUpperCase() + decodeURIComponent(parts[0]).slice(1);
      }
    } catch {
      company = 'Ashby Employer';
    }
  }

  // Location extraction
  const locationEl =
    doc.querySelector('[data-qa="job-location"]') ||
    doc.querySelector('div[class*="JobPosting_location"]') ||
    doc.querySelector('header span[class*="location"]');
  const location = locationEl?.textContent?.trim() || 'Remote / Unspecified';

  return {
    title,
    company: company || 'Company',
    location,
    url: (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href || url,
    atsType: 'ashby',
  };
}
