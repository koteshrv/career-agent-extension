import { JobDetails } from '../../types';

export function isLeverPage(url: string, doc: Document = document): boolean {
  return (
    url.includes('jobs.lever.co') ||
    !!doc.querySelector('.posting-headline, .lever-job-details')
  );
}

export function extractLever(url: string, doc: Document = document): JobDetails | null {
  if (!isLeverPage(url, doc)) return null;

  // Title extraction: Lever uses .posting-headline h2
  const titleEl =
    doc.querySelector('.posting-headline h2') ||
    doc.querySelector('.posting-headline') ||
    doc.querySelector('h2') ||
    doc.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Job Opportunity';

  // Company extraction: Lever URL is jobs.lever.co/:company/:id
  let company = '';
  const logoEl = doc.querySelector('.main-header-logo img') as HTMLImageElement;
  if (logoEl && logoEl.alt) {
    company = logoEl.alt.replace(/ logo/i, '').trim();
  }

  if (!company) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0]) {
        company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    } catch {
      company = 'Lever Employer';
    }
  }

  // Location extraction: Lever uses .posting-categories .location or .workplaceTypes
  const locationEl =
    doc.querySelector('.posting-categories .location') ||
    doc.querySelector('.posting-categories .workplaceTypes') ||
    doc.querySelector('.posting-categories');
  const location = locationEl?.textContent?.trim() || 'Remote / Unspecified';

  return {
    title,
    company: company || 'Company',
    location,
    url: (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href || url,
    atsType: 'lever',
  };
}
