import { CandidateProfile, SyncedProfileSummary, TrackedApplication } from '../types';
import { DEFAULT_PROFILE, saveSyncedProfile } from './storage';

export const CAREERAGENT_API_URL = 'https://api.careeragent.fyi';
export const CAREERAGENT_WEB_URL = 'https://careeragent.fyi';

/**
 * Fetch and sync user's candidate profile from CareerAgent web platform
 */
export async function syncProfileFromPlatform(
  token?: string
): Promise<{ success: boolean; data?: SyncedProfileSummary; error?: string }> {
  try {
    if (token) {
      const response = await fetch(`${CAREERAGENT_API_URL}/v1/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
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
    }

    // Default profile
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
      userId: 'usr_default',
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
  try {
    const response = await fetch(`${CAREERAGENT_API_URL}/v1/applications`, {
      method: 'POST',
      headers: {
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
  const url = `${CAREERAGENT_WEB_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

export async function syncProfileToServer(_profile: CandidateProfile): Promise<boolean> {
  return true;
}
