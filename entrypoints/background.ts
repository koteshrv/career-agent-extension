import { defineBackground } from 'wxt/utils/define-background';
import {
  getApplications,
  getProfile,
  getSettings,
  getAnswers,
  saveAnswer,
  findSavedAnswer,
  getResume,
  addApplication,
  migrateLegacyData,
} from '../src/lib/storage';
import { generateAnswerForATSQuestion } from '../src/lib/ai';
import { listen, request as _request, requestTab, BridgeError } from '../src/lib/messages';
import { listenExternal, withKeepalive } from '../src/lib/bridge';
import type { AutofillResult, CompanySignal, JobDetails } from '../src/types';

void _request;

const API = 'https://api.careeragent.fyi';
const signalCache = new Map<string, { at: number; value: CompanySignal | null }>();

/** Community signal for a company: response times and ghosting, from anonymous telemetry. Cached an hour. */
async function companySignal(company: string): Promise<CompanySignal | null> {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return null;
  const hit = signalCache.get(slug);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.value;
  let value: CompanySignal | null = null;
  try {
    const res = await fetch(`${API}/v1/intelligence/company/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = await res.json();
      const i = data?.intelligence;
      if (i && typeof i.total_applications === 'number' && i.total_applications >= 3) {
        value = {
          company_slug: i.company_slug,
          total_applications: i.total_applications,
          interview_rate: Number(i.interview_rate) || 0,
          ghost_score: Number(i.ghost_score) || 0,
          median_response_days: i.median_response_days === null ? null : Number(i.median_response_days),
        };
      }
    }
  } catch {
    value = null;
  }
  signalCache.set(slug, { at: Date.now(), value });
  return value;
}

/** Autofills the active tab with profile, saved answers and resume. Used by the popup and the keyboard shortcut. */
async function runAutofillOnActiveTab(): Promise<AutofillResult & { tracked?: boolean }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new BridgeError('BAD_PAYLOAD', 'No active tab');
  const [profile, answers, resume, settings] = await Promise.all([getProfile(), getAnswers(), getResume(), getSettings()]);
  const res = await requestTab<AutofillResult>(tab.id, { type: 'AUTOFILL_APPLICATION', profile, answers, resume });
  if (!res) throw new BridgeError('PROVIDER_ERROR', 'This page did not respond. Reload it and try again.');
  if (!res.ok) throw new BridgeError(res.code, res.message);
  let tracked = false;
  if (res.data.success && settings.autoTrackOnAutofill) {
    const job = await requestTab<JobDetails | null>(tab.id, { type: 'EXTRACT_JOB_DETAILS' });
    if (job?.ok && job.data) {
      await addApplication({ title: job.data.title, company: job.data.company, location: job.data.location, url: job.data.url, atsProvider: job.data.atsType, status: 'APPLIED', followUpDays: settings.followUpDays });
      tracked = true;
    }
  }
  return { ...res.data, tracked };
}

export default defineBackground(() => {
  // Badge: count of follow-ups due (respects the notifications setting)
  async function updateBadge() {
    try {
      const [apps, settings] = await Promise.all([getApplications(), getSettings()]);
      const now = new Date();
      const dueCount = settings.notificationsEnabled
        ? apps.filter((app) => {
            if (app.status === 'ARCHIVED' || app.status === 'OFFER') return false;
            if (!app.followUpDate || app.followedUp) return false;
            return new Date(app.followUpDate) <= now;
          }).length
        : 0;
      if (dueCount > 0) {
        chrome.action.setBadgeText({ text: dueCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#0c6e8c' });
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
    if (area === 'local' && (changes.careeragent_applications || changes.careeragent_settings)) updateBadge();
  });

  chrome.commands?.onCommand.addListener((command) => {
    if (command === 'autofill') runAutofillOnActiveTab().catch((e) => console.warn('[CareerAgent] Shortcut autofill failed:', e));
  });

  // Messages from our own popup and content scripts
  listen({
    GENERATE_AI_ANSWER: async ({ question, job }) => {
      const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
      if (!settings.aiApiKey.trim()) {
        throw new BridgeError('NO_API_KEY', 'AI API Key not configured. Click the CareerAgent extension icon → Settings to add your key.');
      }
      const answer = await withKeepalive(
        generateAnswerForATSQuestion(String(question ?? '').slice(0, 2000), job, profile, settings.aiProvider, settings.aiApiKey, settings.aiModel)
      );
      return { answer };
    },
    GET_SAVED_ANSWER: async ({ question }) => findSavedAnswer(await getAnswers(), String(question ?? '')),
    SAVE_ANSWER: async ({ question, answer }) => {
      await saveAnswer(String(question ?? ''), String(answer ?? ''));
      return { saved: true };
    },
    APPLICATION_SUBMITTED: async ({ job }) => {
      const settings = await getSettings();
      if (!settings.autoTrackOnSubmit || !job?.title) return { tracked: false };
      await addApplication({ title: job.title, company: job.company, location: job.location, url: job.url, atsProvider: job.atsType, status: 'APPLIED', followUpDays: settings.followUpDays });
      return { tracked: true };
    },
    COMPANY_SIGNAL: async ({ company }) => companySignal(String(company ?? '')),
    SAVE_JOB: async ({ job }) => {
      if (!job?.title) throw new BridgeError('BAD_PAYLOAD', 'No posting details on this page');
      const settings = await getSettings();
      await addApplication({ title: job.title, company: job.company, location: job.location, url: job.url, atsProvider: job.atsType, status: 'SAVED', followUpDays: settings.followUpDays });
      return { saved: true };
    },
    GET_UPLOAD_RESUME: async () => {
      const r = await getResume();
      return r ? { name: r.name } : null;
    },
    RUN_AUTOFILL_ON_ACTIVE_TAB: () => runAutofillOnActiveTab(),
  });

  // Messages from careeragent.fyi (externally_connectable; origin-checked, rate-limited)
  listenExternal();

  updateBadge();
});
