import { defineBackground } from 'wxt/utils/define-background';
import { getApplications, getProfile, getSettings, migrateLegacyData } from '../src/lib/storage';
import { generateAnswerForATSQuestion } from '../src/lib/ai';
import { listen, BridgeError } from '../src/lib/messages';
import { listenExternal, withKeepalive } from '../src/lib/bridge';

export default defineBackground(() => {
  // Badge: count of follow-ups due (respects the notifications setting)
  async function updateBadge() {
    try {
      const [apps, settings] = await Promise.all([getApplications(), getSettings()]);
      const now = new Date();
      const dueCount = settings.notificationsEnabled
        ? apps.filter((app) => {
            if (app.status === 'ARCHIVED' || app.status === 'OFFER') return false;
            if (!app.followUpDate) return false;
            return new Date(app.followUpDate) <= now;
          }).length
        : 0;

      if (dueCount > 0) {
        chrome.action.setBadgeText({ text: dueCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#ea580c' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (e) {
      console.warn('[CareerAgent Background] Failed to update badge:', e);
    }
  }

  chrome.runtime.onInstalled.addListener(async () => {
    await migrateLegacyData();
    await updateBadge();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.careeragent_applications || changes.careeragent_settings)) {
      updateBadge();
    }
  });

  // Messages from our own popup and content scripts
  listen({
    GENERATE_AI_ANSWER: async ({ question, job }) => {
      const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
      if (!settings.aiApiKey.trim()) {
        throw new BridgeError(
          'NO_API_KEY',
          'AI API Key not configured. Click the CareerAgent extension icon → Settings to add your key.'
        );
      }
      const answer = await withKeepalive(
        generateAnswerForATSQuestion(
          String(question ?? '').slice(0, 2000),
          job,
          profile,
          settings.aiProvider,
          settings.aiApiKey,
          settings.aiModel
        )
      );
      return { answer };
    },
  });

  // Messages from careeragent.fyi (externally_connectable; origin-checked, rate-limited)
  listenExternal();

  updateBadge();
});
