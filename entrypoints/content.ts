import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractJobDetails } from '../src/lib/extractors';
import { executeAutofill } from '../src/lib/autofill';
import { initInlineAIHelper } from '../src/lib/inline';
import { CandidateProfile } from '../src/types';

function debugLog(source: string, msg: string, data: any = {}) {
  try {
    fetch('http://localhost:9999/log', {
      method: 'POST',
      body: JSON.stringify({ source, msg, data, time: new Date().toISOString() })
    }).catch(() => {});
  } catch (e) {}
}

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
    // Web App Bridge: Listen for requests from the static webapp (careeragent.fyi)
    window.addEventListener('message', (event) => {
      // Ensure the message is from our window and is a recognized request
      if (
        event.source === window &&
        event.data &&
        event.data.source === 'CAREERAGENT_WEB' &&
        event.data.type === 'CAREER_AGENT_EXT_REQUEST'
      ) {
        const { messageId, action, payload } = event.data;
        debugLog('CONTENT_SCRIPT', 'Intercepted CAREER_AGENT_EXT_REQUEST', { action, messageId });
        
        // Forward to background script
        chrome.runtime.sendMessage({ type: 'WEB_APP_BRIDGE', action, payload }, (response) => {
          const lastError = chrome.runtime.lastError;
          debugLog('CONTENT_SCRIPT', 'Received response from background script', { 
            messageId, 
            hasResponse: !!response, 
            error: response?.error || lastError?.message 
          });
          
          // Post response back to web app
          window.postMessage({
            type: 'CAREER_AGENT_EXT_RESPONSE',
            messageId,
            payload: response?.data,
            error: response?.error || lastError?.message
          }, '*');
        });
      }
    });

  },
});
