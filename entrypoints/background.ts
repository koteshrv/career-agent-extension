import { defineBackground } from 'wxt/utils/define-background';
import { getApplications, getProfile, getSettings, saveProfile, DEFAULT_PROFILE } from '../src/lib/storage';
import { generateAnswerForATSQuestion, parseResumeForFilters } from '../src/lib/ai';

function debugLog(source: string, msg: string, data: any = {}) {
  try {
    fetch('http://localhost:9999/log', {
      method: 'POST',
      body: JSON.stringify({ source, msg, data, time: new Date().toISOString() })
    }).catch(() => {});
  } catch (e) {}
}

export default defineBackground(() => {
  // Update badge for follow-up reminders
  async function updateBadge() {
    try {
      const apps = await getApplications();
      const now = new Date();
      const dueCount = apps.filter((app) => {
        if (app.status === 'REJECTED' || app.status === 'OFFER') return false;
        if (!app.followUpDate) return false;
        return new Date(app.followUpDate) <= now;
      }).length;

      if (typeof chrome !== 'undefined' && chrome.action) {
        if (dueCount > 0) {
          chrome.action.setBadgeText({ text: dueCount.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#ea580c' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      }
    } catch (e) {
      console.warn('[CareerAgent Background] Failed to update badge:', e);
    }
  }

  // Extension installed/updated lifecycle
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[CareerAgent] Extension installed/updated successfully');
    const existingProfile = await getProfile();
    if (!existingProfile.email) {
      await saveProfile(DEFAULT_PROFILE);
    }
    await updateBadge();
  });

  // Listen for storage changes to update badge
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.careeragent_applications) {
        updateBadge();
      }
    });
  }

  // Handle on-demand AI answer generation for inline textareas
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GENERATE_AI_ANSWER') {
      (async () => {
        try {
          const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
          if (!settings.aiApiKey.trim()) {
            sendResponse({
              success: false,
              error: 'AI API Key not configured. Click the CareerAgent extension icon -> Settings to add your key.',
            });
            return;
          }

          const answer = await generateAnswerForATSQuestion(
            message.question,
            message.job,
            profile,
            settings.aiProvider,
            settings.aiApiKey,
            settings.aiModel
          );

          sendResponse({ success: true, answer });
        } catch (err: any) {
          sendResponse({ success: false, error: err?.message || 'Failed to generate answer.' });
        }
      })();
      return true; // Keep message channel open for async response
    }

    if (message.type === 'WEB_APP_BRIDGE') {
      debugLog('BACKGROUND', 'Received WEB_APP_BRIDGE message', { action: message.action });
      
      if (message.action === 'ping') {
        sendResponse({ data: { status: 'ok' } });
        return false;
      }
      
      if (message.action === 'parse_resume_for_filters') {
        (async () => {
          try {
            const { fileName, fileData } = message.payload;
            const settings = await getSettings();
            
            debugLog('BACKGROUND', 'Starting parseResumeForFilters', { fileName, provider: settings.aiProvider });

            if (!settings.aiApiKey.trim()) {
              debugLog('BACKGROUND', 'No API key configured');
              sendResponse({ error: 'AI API Key not configured in Extension Settings.' });
              return;
            }

            const filters = await parseResumeForFilters(
              fileName, 
              fileData, 
              settings.aiProvider, 
              settings.aiApiKey, 
              settings.aiModel
            );

            debugLog('BACKGROUND', 'Successfully parsed resume', { filters });
            sendResponse({ data: { filters } });
          } catch (err: any) {
            console.error('[CareerAgent] Resume parse error:', err);
            debugLog('BACKGROUND', 'Error parsing resume', { error: err?.message });
            sendResponse({ error: err?.message || 'Failed to parse resume.' });
          }
        })();
        return true;
      }
    }
    return false;
  });

  // Initial badge update
  updateBadge();
});
