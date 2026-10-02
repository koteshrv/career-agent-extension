import {
  CandidateProfile,
  TrackedApplication,
  ExtensionSettings,
  ApplicationStatus,
  SavedAnswer,
  StoredResume,
} from '../types';
import { normalizeQuestion } from './answers';
export { normalizeQuestion, findSavedAnswer } from './answers';

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

export const DEFAULT_SETTINGS: ExtensionSettings = {
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: 'gemini-3.5-flash-lite',
  autoTrackOnAutofill: false,
  autoTrackOnSubmit: true,
  notificationsEnabled: true,
  followUpDays: 3,
};

const KEYS = {
  settings: 'careeragent_settings',
  profile: 'careeragent_profile',
  applications: 'careeragent_applications',
  theme: 'careeragent_theme',
  answers: 'careeragent_answers',
  resume: 'careeragent_resume',
} as const;
const LEGACY_SYNCED_PROFILE_KEY = 'careeragent_synced_profile';

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
// Settings Storage
// ==========================================
export async function getSettings(): Promise<ExtensionSettings> {
  const settings = await getStorageItem<ExtensionSettings>(KEYS.settings, DEFAULT_SETTINGS);
  const resolved = { ...DEFAULT_SETTINGS, ...settings };
  if (
    resolved.aiProvider === 'gemini' &&
    (resolved.aiModel === 'gemini-1.5-flash' ||
      resolved.aiModel === 'gemini-2.5-flash' ||
      !resolved.aiModel)
  ) {
    resolved.aiModel = 'gemini-3.5-flash-lite';
  }
  return resolved;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await setStorageItem(KEYS.settings, settings);
}

// ==========================================
// Candidate Profile Storage (single source of truth; the web dashboard syncs through the bridge)
// ==========================================
export async function getProfile(): Promise<CandidateProfile> {
  const profile = await getStorageItem<CandidateProfile>(KEYS.profile, DEFAULT_PROFILE);
  return { ...DEFAULT_PROFILE, ...profile };
}

export async function saveProfile(profile: CandidateProfile): Promise<void> {
  await setStorageItem(KEYS.profile, { ...profile, updatedAt: profile.updatedAt ?? new Date().toISOString() });
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
  return await getStorageItem<TrackedApplication[]>(KEYS.applications, []);
}

export async function saveApplications(applications: TrackedApplication[]): Promise<void> {
  await setStorageItem(KEYS.applications, applications);
}

const newId = () => `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

function sameJob(a: TrackedApplication, b: { url?: string; company: string; title: string }): boolean {
  return (
    (!!b.url && a.url === b.url) ||
    (a.company.toLowerCase() === b.company.toLowerCase() && a.title.toLowerCase() === b.title.toLowerCase())
  );
}

export async function addApplication(appData: {
  title: string;
  company: string;
  location?: string;
  url?: string;
  atsProvider?: string;
  status?: ApplicationStatus;
  notes?: string;
  followUpDays?: number;
}): Promise<TrackedApplication> {
  const apps = await getApplications();
  const now = new Date().toISOString();
  const existing = apps.find((a) => sameJob(a, appData));

  const app: TrackedApplication = {
    id: existing?.id ?? newId(),
    title: appData.title || 'Untitled Role',
    company: appData.company || 'Unknown Company',
    location: appData.location || 'Remote',
    url: appData.url || '',
    atsProvider: appData.atsProvider || 'generic',
    status: appData.status || 'APPLIED',
    appliedDate: existing?.appliedDate ?? now,
    followUpDate: calculateFollowUpDate(appData.followUpDays ?? 3),
    notes: appData.notes || existing?.notes || '',
    updatedAt: now,
  };

  await upsertApplication(app);
  return app;
}

/** Inserts or replaces by id. A record with a different id but the same job URL is replaced too, so both stores converge on one record. */
export async function upsertApplication(app: TrackedApplication): Promise<void> {
  const apps = await getApplications();
  const idx = apps.findIndex((a) => a.id === app.id || (!!app.url && a.url === app.url));
  if (idx >= 0) apps[idx] = app;
  else apps.unshift(app);
  await saveApplications(apps);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const apps = await getApplications();
  const now = new Date().toISOString();
  await saveApplications(apps.map((app) => (app.id === id ? { ...app, status, updatedAt: now } : app)));
}

export async function deleteApplication(id: string): Promise<void> {
  const apps = await getApplications();
  await saveApplications(apps.filter((app) => app.id !== id));
}

export async function clearApplications(): Promise<void> {
  await saveApplications([]);
}

/** One-time upgrade of records written by v1.0 (jobTitle/jobUrl/appliedAt/REJECTED) and removal of the fake "synced profile". */
export async function migrateLegacyData(): Promise<void> {
  const raw = await getStorageItem<any[]>(KEYS.applications, []);
  if (raw.some((a) => a && typeof a === 'object' && 'jobTitle' in a)) {
    const now = new Date().toISOString();
    await saveApplications(
      raw.map((a) =>
        'jobTitle' in a
          ? ({
              id: a.id,
              title: a.jobTitle,
              company: a.company,
              location: a.location,
              url: a.jobUrl || '',
              atsProvider: a.atsType,
              status: a.status === 'REJECTED' ? 'ARCHIVED' : a.status,
              appliedDate: a.appliedAt || now,
              followUpDate: a.followUpDate,
              notes: a.notes,
              updatedAt: a.appliedAt || now,
            } satisfies TrackedApplication)
          : a
      )
    );
  }
  getStorageAPI()?.remove(LEGACY_SYNCED_PROFILE_KEY, () => void chrome.runtime?.lastError);
}

// ==========================================
// Saved answers (question → approved answer)
// ==========================================
export async function getAnswers(): Promise<Record<string, SavedAnswer>> {
  return await getStorageItem<Record<string, SavedAnswer>>(KEYS.answers, {});
}

export async function saveAnswer(question: string, answer: string): Promise<void> {
  const key = normalizeQuestion(question);
  if (!key || !answer.trim()) return;
  const all = await getAnswers();
  all[key] = { question: question.trim().slice(0, 300), answer: answer.trim().slice(0, 5000), updatedAt: new Date().toISOString() };
  // ponytail: cap at 200 answers, oldest dropped; a UI to manage them can come later
  const entries = Object.entries(all).sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).slice(0, 200);
  await setStorageItem(KEYS.answers, Object.fromEntries(entries));
}

export async function deleteAnswer(question: string): Promise<void> {
  const all = await getAnswers();
  delete all[normalizeQuestion(question)];
  await setStorageItem(KEYS.answers, all);
}

// ==========================================
// Resume file
// ==========================================
export async function getResume(): Promise<StoredResume | null> {
  return await getStorageItem<StoredResume | null>(KEYS.resume, null);
}

export async function saveResume(resume: StoredResume | null): Promise<void> {
  await setStorageItem(KEYS.resume, resume);
}

// ==========================================
// Theme Storage
// ==========================================
export async function getTheme(): Promise<'light' | 'dark'> {
  return await getStorageItem<'light' | 'dark'>(KEYS.theme, 'light');
}

export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  await setStorageItem(KEYS.theme, theme);
}
