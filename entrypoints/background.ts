import { defineBackground } from 'wxt/utils/define-background';
import { getApplications, getProfile, getSettings, saveProfile, DEFAULT_PROFILE } from '../src/lib/storage';
import { generateAnswerForATSQuestion } from '../src/lib/ai';

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
    return false;
  });

  // Initial badge update
  updateBadge();
});
