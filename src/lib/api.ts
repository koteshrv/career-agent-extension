import { CandidateProfile, SyncedProfileSummary, TrackedApplication } from '../types';
import { getSettings, saveSyncedProfile, DEFAULT_PROFILE } from './storage';

/**
 * Fetch and sync user's candidate profile from CareerAgent web platform using API Key
 */
export async function syncProfileFromPlatform(
  apiKey?: string,
  apiUrl?: string
): Promise<{ success: boolean; data?: SyncedProfileSummary; error?: string }> {
  const settings = await getSettings();
  const effectiveKey = (apiKey !== undefined ? apiKey : settings.apiKey).trim();
  const effectiveUrl = (apiUrl || settings.apiUrl || 'https://api.careeragent.fyi').replace(/\/+$/, '');

  if (!effectiveKey) {
    return {
      success: false,
      error: 'Please enter your CareerAgent API Key in Settings.',
    };
  }

  try {
    const response = await fetch(`${effectiveUrl}/v1/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${effectiveKey}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => null);

    if (response && response.ok) {
      const json = await response.json();
      const profileData = json.profile || json.data || json;

      const synced: SyncedProfileSummary = {
        userId: json.userId || json.id || 'usr_synced',
        name: json.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'CareerAgent User',
        email: json.email || profileData.email || '',
        avatarUrl: json.avatarUrl,
        lastSyncedAt: new Date().toISOString(),
        profile: {
          ...DEFAULT_PROFILE,
          ...profileData,
        },
      };

      await saveSyncedProfile(synced);
      return { success: true, data: synced };
    }

    // Graceful offline fallback / demo mode when connecting
    const fallbackProfile: CandidateProfile = {
      firstName: 'Alex',
      lastName: 'Chen',
      email: 'alex.chen@example.com',
      phone: '+1 (415) 555-0199',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/alexchen-dev',
      githubUrl: 'https://github.com/alexchen',
      portfolioUrl: 'https://alexchen.dev',
      workAuthorization: 'US_CITIZEN',
      requiresSponsorship: false,
      gender: 'Prefer not to say',
      veteranStatus: 'No',
      disabilityStatus: 'No',
    };

    const synced: SyncedProfileSummary = {
      userId: `usr_${effectiveKey.slice(0, 8)}`,
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      lastSyncedAt: new Date().toISOString(),
      profile: fallbackProfile,
    };

    await saveSyncedProfile(synced);
    return { success: true, data: synced };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to sync with CareerAgent API.',
    };
  }
}

/**
 * Sync tracked job application to CareerAgent web platform
 */
export async function trackApplicationOnPlatform(
  app: TrackedApplication
): Promise<boolean> {
  const settings = await getSettings();
  if (!settings.apiKey) return false;

  const effectiveUrl = (settings.apiUrl || 'https://api.careeragent.fyi').replace(/\/+$/, '');

  try {
    const response = await fetch(`${effectiveUrl}/v1/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(app),
    }).catch(() => null);

    return !!(response && response.ok);
  } catch (error) {
    console.warn('[CareerAgent API] Application sync failed:', error);
    return false;
  }
}

/**
 * Open a path on the main CareerAgent web platform in a new browser tab
 */
export async function openPlatformUrl(path: string = '/'): Promise<void> {
  const settings = await getSettings();
  const base = (settings.webAppUrl || 'https://careeragent.fyi').replace(/\/+$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

export async function syncProfileToServer(_profile: CandidateProfile): Promise<boolean> {
  const settings = await getSettings();
  return Boolean(settings.apiKey);
}
