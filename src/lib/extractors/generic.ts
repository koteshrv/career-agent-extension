import { JobDetails } from '../../types';

export function extractGeneric(url: string, doc: Document = document): JobDetails | null {
  let title = '';
  let company = '';
  let location = '';
  let hasJobPostingSchema = false;

  // 1. Try Schema.org JSON-LD JobPosting
  try {
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(jsonLdScripts)) {
      try {
        const data = JSON.parse(script.textContent || '{}');
        const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            hasJobPostingSchema = true;
            title = item.title || item.name || '';
            if (typeof item.hiringOrganization === 'string') {
              company = item.hiringOrganization;
            } else if (item.hiringOrganization?.name) {
              company = item.hiringOrganization.name;
            }
            if (item.jobLocation?.address) {
              const addr = item.jobLocation.address;
              location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                .filter(Boolean)
                .join(', ');
            }
            break;
          }
        }
      } catch {
        // Skip invalid JSON-LD
      }
      if (title && company) break;
    }
  } catch {
    // Continue fallback
  }

  const isJobBoard = /indeed\.com|glassdoor\.com|wellfound\.com|builtin\.com|naukri\.com|ziprecruiter\.com|dice\.com/i.test(url);
  const hasJobPath = /\/(job|jobs|careers|positions|openings|roles|apply)\b/i.test(url);

  // If this is neither a job board, nor has job posting schema, nor has a career/job URL path, do NOT invent a job
  if (!hasJobPostingSchema && !isJobBoard && !hasJobPath) {
    return null;
  }

  // 2. OpenGraph & Meta tag extraction
  if (!title) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) {
      const parts = ogTitle.split(/ at | - | \| /i);
      title = parts[0]?.trim() || '';
      if (!company && parts[1]) {
        company = parts[1]?.trim() || '';
      }
    }
  }

  if (!title) {
    const h1 = doc.querySelector('h1');
    if (h1?.textContent?.trim()) {
      title = h1.textContent.trim();
    } else {
      title = doc.title ? doc.title.split(/ - | \| /)[0].trim() : 'Position';
    }
  }

  if (!company) {
    const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
    if (siteName) {
      company = siteName.trim();
    } else {
      try {
        const parsed = new URL(url);
        const hostParts = parsed.hostname.replace(/^www\./, '').split('.');
        company = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
      } catch {
        company = 'Company';
      }
    }
  }

  if (!location) {
    const locMeta = doc.querySelector('meta[name="geo.placename"]')?.getAttribute('content');
    location = locMeta || 'Remote / Listed in Job Details';
  }

  const atsType = url.includes('indeed.com')
    ? 'indeed'
    : url.includes('linkedin.com')
    ? 'linkedin'
    : 'generic';

  return {
    title,
    company,
    location,
    url: (doc.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href || url,
    atsType,
  };
}
