import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.linkedin.com/jobs/*', '*://*.naukri.com/job-listings-*', '*://*.indeed.com/viewjob*'],
  runAt: 'document_idle',
  main() {
    // We wait a bit to ensure dynamic content loads.
    setTimeout(async () => {
      try {
        const { config } = await chrome.storage.local.get('config');
        const boards = config?.selectors?.boards;
        if (!boards) return;

        let host = window.location.hostname;
        let boardConfig = null;
        if (host.includes('linkedin.com')) boardConfig = boards.linkedin;
        else if (host.includes('naukri.com')) boardConfig = boards.naukri;
        else if (host.includes('indeed.com')) boardConfig = boards.indeed;

        if (!boardConfig) return;

        const titleEl = document.querySelector(boardConfig.title);
        const companyEl = document.querySelector(boardConfig.company);
        const descriptionEl = document.querySelector(boardConfig.description);

        if (!titleEl || !companyEl || !descriptionEl) return;

        const title = titleEl.textContent?.trim();
        const company = companyEl.textContent?.trim();
        const rawDescription = descriptionEl.innerHTML || '';
        const cleanedDescription = descriptionEl.textContent?.trim() || '';

        // Clean URL to remove tracking
        const urlObj = new URL(window.location.href);
        urlObj.searchParams.delete('refId');
        urlObj.searchParams.delete('trackingId');
        urlObj.searchParams.delete('trk');
        const cleanUrl = urlObj.toString();

        if (title && company && rawDescription) {
          // Push to backend
          await chrome.runtime.sendMessage({
            type: 'CROWDSOURCE_JOB',
            job: {
              title,
              company,
              url: cleanUrl,
              raw_description: rawDescription,
              cleaned_description: cleanedDescription
            }
          });
        }
      } catch (err) {
        console.warn('[CareerAgent] Crowdsourcing passive scan failed:', err);
      }
    }, 3000);
  },
});
