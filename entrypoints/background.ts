import { defineBackground } from 'wxt/utils/define-background';
import { getApplications, getProfile, saveProfile, DEFAULT_PROFILE } from '../src/lib/storage';

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

  // Initial badge update
  updateBadge();
});
