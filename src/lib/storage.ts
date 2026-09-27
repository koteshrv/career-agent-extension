import { CandidateProfile, TrackedApplication, AuthUser, ApplicationStatus } from '../types';

export const DEFAULT_PROFILE: CandidateProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  workAuthorization: 'US_CITIZEN',
  requiresSponsorship: false,
  gender: 'Prefer not to say',
  veteranStatus: 'No',
  disabilityStatus: 'No',
};

// Polyfill-safe storage getter
function getStorageAPI(): chrome.storage.StorageArea | null {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  const anyGlobal = globalThis as any;
  if (typeof anyGlobal.browser !== 'undefined' && anyGlobal.browser.storage && anyGlobal.browser.storage.local) {
    return anyGlobal.browser.storage.local;
  }
  return null;
}

// In-memory fallback if storage API is unavailable (e.g. unit tests or standard browser)
const memoryStore = new Map<string, any>();

async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  const storage = getStorageAPI();
  if (!storage) {
    return memoryStore.has(key) ? (memoryStore.get(key) as T) : defaultValue;
  }

  return new Promise((resolve) => {
    storage.get([key], (result) => {
      if (chrome.runtime?.lastError) {
        console.warn(`[CareerAgent Storage] Error reading ${key}:`, chrome.runtime.lastError);
        resolve(defaultValue);
      } else if (result && result[key] !== undefined) {
        resolve(result[key] as T);
      } else {
        resolve(defaultValue);
      }
    });
  });
}

async function setStorageItem<T>(key: string, value: T): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    memoryStore.set(key, value);
    return;
  }

  return new Promise((resolve, reject) => {
    storage.set({ [key]: value }, () => {
      if (chrome.runtime?.lastError) {
        console.error(`[CareerAgent Storage] Error writing ${key}:`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// ==========================================
// Candidate Profile Storage
// ==========================================
export async function getProfile(): Promise<CandidateProfile> {
  const profile = await getStorageItem<CandidateProfile>('careeragent_profile', DEFAULT_PROFILE);
  return { ...DEFAULT_PROFILE, ...profile };
}

export async function saveProfile(profile: CandidateProfile): Promise<void> {
  await setStorageItem('careeragent_profile', profile);
}

// ==========================================
// Tracked Applications Storage
// ==========================================
export function calculateFollowUpDate(days: number = 3): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function getApplications(): Promise<TrackedApplication[]> {
  return await getStorageItem<TrackedApplication[]>('careeragent_applications', []);
}

export async function saveApplications(applications: TrackedApplication[]): Promise<void> {
  await setStorageItem('careeragent_applications', applications);
}

export async function addApplication(appData: {
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
  atsType?: string;
  status?: ApplicationStatus;
  notes?: string;
}): Promise<TrackedApplication> {
  const apps = await getApplications();
  const now = new Date().toISOString();
  const followUp = calculateFollowUpDate(3);

  // Check if job is already tracked by URL or (company + title)
  const existingIndex = apps.findIndex(
    (a) => (appData.jobUrl && a.jobUrl === appData.jobUrl) ||
           (a.company.toLowerCase() === appData.company.toLowerCase() &&
            a.jobTitle.toLowerCase() === appData.jobTitle.toLowerCase())
  );

  const newApp: TrackedApplication = {
    id: existingIndex >= 0 ? apps[existingIndex].id : `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    jobTitle: appData.jobTitle || 'Untitled Role',
    company: appData.company || 'Unknown Company',
    location: appData.location || 'Remote',
    jobUrl: appData.jobUrl || '',
    atsType: appData.atsType || 'generic',
    status: appData.status || 'APPLIED',
    appliedAt: existingIndex >= 0 ? apps[existingIndex].appliedAt : now,
    followUpDate: followUp,
    notes: appData.notes || '',
    syncedWithServer: false,
  };

  if (existingIndex >= 0) {
    apps[existingIndex] = { ...apps[existingIndex], ...newApp };
  } else {
    apps.unshift(newApp);
  }

  await saveApplications(apps);
  return newApp;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const apps = await getApplications();
  const updated = apps.map((app) => (app.id === id ? { ...app, status } : app));
  await saveApplications(updated);
}

export async function deleteApplication(id: string): Promise<void> {
  const apps = await getApplications();
  const filtered = apps.filter((app) => app.id !== id);
  await saveApplications(filtered);
}

// ==========================================
// Authentication Storage
// ==========================================
export async function getAuth(): Promise<AuthUser | null> {
  return await getStorageItem<AuthUser | null>('careeragent_auth', null);
}

export async function saveAuth(user: AuthUser | null): Promise<void> {
  await setStorageItem('careeragent_auth', user);
}

// ==========================================
// Theme Storage
// ==========================================
export async function getTheme(): Promise<'light' | 'dark'> {
  return await getStorageItem<'light' | 'dark'>('careeragent_theme', 'light');
}

export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  await setStorageItem('careeragent_theme', theme);
}
