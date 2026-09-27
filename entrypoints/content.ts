import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractJobDetails } from '../src/lib/extractors';
import { executeAutofill } from '../src/lib/autofill';
import { initInlineAIHelper } from '../src/lib/inline';
import { CandidateProfile } from '../src/types';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    // Initialize inline CareerAgent Orbit logo helper on form textareas
    try {
      initInlineAIHelper(() => extractJobDetails(window.location.href, document));
    } catch (e) {
      console.warn('[CareerAgent] Failed to initialize inline AI helper:', e);
    }

    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      try {
        if (message.type === 'EXTRACT_JOB_DETAILS') {
          const details = extractJobDetails(window.location.href, document);
          sendResponse({ success: true, data: details });
          return true;
        }

        if (message.type === 'AUTOFILL_APPLICATION') {
          const profile: CandidateProfile = message.profile;
          const result = executeAutofill(profile, window.location.href, document);
          sendResponse({ success: true, data: result });
          return true;
        }

        if (message.type === 'PING') {
          sendResponse({ success: true, message: 'PONG' });
          return true;
        }
      } catch (err: any) {
        console.error('[CareerAgent Content Script] Error processing message:', err);
        sendResponse({ success: false, error: err?.message || 'Unknown error' });
      }
      return true;
    });
  },
});
