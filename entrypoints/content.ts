import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractJobDetails } from '../src/lib/extractors';
import { executeAutofill } from '../src/lib/autofill';
import { initInlineAIHelper } from '../src/lib/inline';
import { listen } from '../src/lib/messages';

declare global {
  interface Window {
    __careeragentContentLoaded?: boolean;
  }
}

export default defineContentScript({
  // Static injection only on ATS hosts. Everything else (LinkedIn, company career sites)
  // is injected on demand from the popup via activeTab + chrome.scripting.
  matches: ['*://*.greenhouse.io/*', '*://*.lever.co/*', '*://*.ashbyhq.com/*', '*://*.myworkdayjobs.com/*'],
  runAt: 'document_idle',
  main() {
    // The popup may inject this file on demand; never register listeners twice.
    if (window.__careeragentContentLoaded) return;
    window.__careeragentContentLoaded = true;

    try {
      initInlineAIHelper(() => extractJobDetails(window.location.href, document));
    } catch (e) {
      console.warn('[CareerAgent] Failed to initialize inline AI helper:', e);
    }

    listen({
      PING: () => ({ message: 'PONG' }),
      EXTRACT_JOB_DETAILS: () => extractJobDetails(window.location.href, document),
      AUTOFILL_APPLICATION: ({ profile }) => executeAutofill(profile, window.location.href, document),
    });
  },
});
