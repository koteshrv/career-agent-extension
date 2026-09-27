import { JobDetails } from '../../types';

export function isGreenhousePage(url: string, doc: Document = document): boolean {
  return (
    url.includes('boards.greenhouse.io') ||
    url.includes('gh_jid=') ||
    !!doc.querySelector('#app_body, #grnhse_app, .app-title')
  );
}

export function extractGreenhouse(url: string, doc: Document = document): JobDetails | null {
  if (!isGreenhousePage(url, doc)) return null;

  // Title extraction
  const titleEl =
    doc.querySelector('.app-title') ||
    doc.querySelector('#header h1') ||
    doc.querySelector('h1') ||
    doc.querySelector('[data-qa="job-title"]');
  const title = titleEl?.textContent?.trim() || 'Job Opportunity';

  // Company extraction
  let company = '';
  const companyEl =
    doc.querySelector('.company-name') ||
    doc.querySelector('#header .company-name') ||
    doc.querySelector('.company');
  if (companyEl?.textContent?.trim()) {
    company = companyEl.textContent.trim().replace(/^at\s+/i, '');
  } else {
    // Extract from greenhouse URL: boards.greenhouse.io/:company/jobs/:id
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] && parts[0] !== 'embed') {
        company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } else if (parts[1]) {
        company = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      }
    } catch {
      company = 'Greenhouse Employer';
    }
  }

  // Location extraction
  const locationEl =
    doc.querySelector('.location') ||
    doc.querySelector('#header .location') ||
    doc.querySelector('.body--metadata');
  const location = locationEl?.textContent?.trim() || 'Remote / Unspecified';

  return {
    title,
    company: company || 'Company',
    location,
    url: (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href || url,
    atsType: 'greenhouse',
  };
}
