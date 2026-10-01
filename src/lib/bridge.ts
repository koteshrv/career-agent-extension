/**
 * External bridge: messages from careeragent.fyi via chrome.runtime.sendMessage(extensionId, ...)
 * (externally_connectable). Background worker only. Never returns settings or API keys.
 */
import {
  getProfile,
  saveProfile,
  getApplications,
  upsertApplication,
  deleteApplication,
  getSettings,
} from './storage';
import { parseResumeForFilters } from './ai';
import { BridgeError } from './messages';
import type {
  ApplicationStatus,
  CandidateProfile,
  TrackedApplication,
  WorkAuthorizationStatus,
} from '../types';

const MAX_PDF_B64 = 7 * 1024 * 1024; // ~5 MB PDF
const MAX_STR = 20_000; // resumeText / summary
const RATE_LIMIT_PER_MIN = 30;

export type ExternalRequest =
  | { action: 'ping' }
  | { action: 'get_state' }
  | { action: 'save_profile'; payload: unknown }
  | { action: 'upsert_application'; payload: unknown }
  | { action: 'delete_application'; payload: { id?: unknown } }
  | { action: 'parse_resume_for_filters'; payload: { fileName?: unknown; fileData?: unknown } };

const FALLBACK_PATTERNS = ['https://careeragent.fyi/*', 'https://*.careeragent.fyi/*'];

/** The manifest's externally_connectable.matches is the single source of truth (dev builds add http://localhost/*). */
function manifestPatterns(): string[] {
  try {
    return chrome.runtime.getManifest().externally_connectable?.matches ?? FALLBACK_PATTERNS;
  } catch {
    return FALLBACK_PATTERNS;
  }
}

/** Chrome already filters onMessageExternal by these patterns; this re-checks them in code as defence in depth. */
export function isAllowedOrigin(origin: string | undefined, patterns: string[] = manifestPatterns()): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  return patterns.some((pattern) => {
    const m = /^(\*|https?):\/\/(\*|(?:\*\.)?[^/*:]+)(?::\d+)?\/.*$/.exec(pattern);
    if (!m) return false;
    const [, scheme, host] = m;
    if (scheme !== '*' && `${scheme}:` !== url.protocol) return false;
    if (host === '*') return true;
    if (host.startsWith('*.')) {
      const base = host.slice(2);
      return url.hostname === base || url.hostname.endsWith(`.${base}`);
    }
    return url.hostname === host;
  });
}

// ponytail: one global bucket; per-action buckets if the web app ever needs more than 30 calls/min
const bucket = { count: 0, windowStart: 0 };
function takeToken(now = Date.now()): boolean {
  if (now - bucket.windowStart > 60_000) {
    bucket.windowStart = now;
    bucket.count = 0;
  }
  return ++bucket.count <= RATE_LIMIT_PER_MIN;
}

/** Deep-clamps a JSON value: strings, arrays and depth capped; functions and prototypes dropped. */
function clamp(v: unknown, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (typeof v === 'string') return v.slice(0, MAX_STR);
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) {
    return v.slice(0, 200).map((x) => clamp(x, depth + 1)).filter((x) => x !== undefined);
  }
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>).slice(0, 64)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      const c = clamp(x, depth + 1);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return undefined;
}

const str = (v: unknown, max = 512): string => (typeof v === 'string' ? v.slice(0, max) : '');
const strArr = (v: unknown, max = 100): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : undefined;
const isoOr = (v: unknown, fallback?: string): string | undefined =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : fallback;

const WORK_AUTH: ReadonlySet<string> = new Set<WorkAuthorizationStatus>([
  'US_CITIZEN',
  'GREEN_CARD',
  'PERMANENT_RESIDENT',
  'NEED_SPONSORSHIP',
  'STUDENT_VISA',
  'OTHER',
]);
const STATUSES: ReadonlySet<string> = new Set<ApplicationStatus>([
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'ARCHIVED',
]);

export function sanitizeProfile(input: unknown): CandidateProfile {
  const p = clamp(input) as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object') throw new BridgeError('BAD_PAYLOAD', 'profile must be an object');
  const auth = str(p.workAuthorization, 32);
  const profile: CandidateProfile = {
    firstName: str(p.firstName),
    lastName: str(p.lastName),
    email: str(p.email),
    phone: str(p.phone, 64),
    location: str(p.location),
    linkedinUrl: str(p.linkedinUrl, 2048),
    githubUrl: str(p.githubUrl, 2048),
    portfolioUrl: str(p.portfolioUrl, 2048),
    workAuthorization: WORK_AUTH.has(auth) ? (auth as WorkAuthorizationStatus) : 'OTHER',
    requiresSponsorship: p.requiresSponsorship === true,
    gender: str(p.gender, 64) || undefined,
    veteranStatus: str(p.veteranStatus, 64) || undefined,
    disabilityStatus: str(p.disabilityStatus, 64) || undefined,
    headline: str(p.headline) || undefined,
    summary: str(p.summary, MAX_STR) || undefined,
    skills: strArr(p.skills),
    keyAccomplishments: strArr(p.keyAccomplishments),
    experiences: Array.isArray(p.experiences) ? (p.experiences as CandidateProfile['experiences']) : undefined,
    education: Array.isArray(p.education) ? (p.education as CandidateProfile['education']) : undefined,
    resumeFileName: str(p.resumeFileName, 256) || undefined,
    resumeText: str(p.resumeText, MAX_STR) || undefined,
    updatedAt: isoOr(p.updatedAt, new Date().toISOString()),
  };
  return profile;
}

export function sanitizeApplication(input: unknown): TrackedApplication {
  const a = clamp(input) as Record<string, unknown> | undefined;
  if (!a || typeof a !== 'object') throw new BridgeError('BAD_PAYLOAD', 'application must be an object');
  const id = str(a.id, 64);
  const title = str(a.title);
  const company = str(a.company);
  const url = str(a.url, 2048);
  if (!id || !title || !company) throw new BridgeError('BAD_PAYLOAD', 'id, title and company are required');
  if (url && !/^https?:\/\//i.test(url)) throw new BridgeError('BAD_PAYLOAD', 'url must be http(s)');
  const status = str(a.status, 32);
  const now = new Date().toISOString();
  return {
    id,
    title,
    company,
    url,
    location: str(a.location) || undefined,
    salary: str(a.salary, 128) || undefined,
    status: STATUSES.has(status) ? (status as ApplicationStatus) : 'APPLIED',
    appliedDate: isoOr(a.appliedDate, now)!,
    followUpDate: isoOr(a.followUpDate),
    followedUp: a.followedUp === true,
    notes: str(a.notes, 5000) || undefined,
    contactName: str(a.contactName) || undefined,
    contactEmail: str(a.contactEmail) || undefined,
    atsProvider: str(a.atsProvider, 32) || undefined,
    updatedAt: isoOr(a.updatedAt, now)!,
  };
}

export async function handleExternal(msg: ExternalRequest): Promise<unknown> {
  switch (msg?.action) {
    case 'ping':
      return {
        status: 'ok',
        version: typeof chrome !== 'undefined' ? chrome.runtime.getManifest().version : 'dev',
      };
    case 'get_state':
      return { profile: await getProfile(), applications: await getApplications() };
    case 'save_profile':
      await saveProfile(sanitizeProfile(msg.payload));
      return { saved: true };
    case 'upsert_application':
      await upsertApplication(sanitizeApplication(msg.payload));
      return { saved: true };
    case 'delete_application': {
      const id = str(msg.payload?.id, 64);
      if (!id) throw new BridgeError('BAD_PAYLOAD', 'id is required');
      await deleteApplication(id);
      return { deleted: true };
    }
    case 'parse_resume_for_filters': {
      const fileName = str(msg.payload?.fileName, 256) || 'resume.pdf';
      const fileData = msg.payload?.fileData;
      if (
        typeof fileData !== 'string' ||
        !fileData ||
        fileData.length > MAX_PDF_B64 ||
        !/^[A-Za-z0-9+/=\s]+$/.test(fileData.slice(0, 2048))
      ) {
        throw new BridgeError('BAD_PAYLOAD', 'fileData must be a base64 PDF under 5 MB');
      }
      const settings = await getSettings();
      if (!settings.aiApiKey.trim()) {
        throw new BridgeError(
          'NO_API_KEY',
          'AI API Key not configured. Open the CareerAgent extension → Settings to add your key.'
        );
      }
      const filters = await parseResumeForFilters(
        fileName,
        fileData,
        settings.aiProvider,
        settings.aiApiKey,
        settings.aiModel
      );
      return { filters };
    }
    default:
      throw new BridgeError('UNKNOWN_ACTION', `Unknown action: ${String((msg as { action?: unknown })?.action)}`);
  }
}

/** Keeps the MV3 service worker alive during long awaits (AI calls can take 30–60 s). */
export function withKeepalive<T>(p: Promise<T>): Promise<T> {
  const timer = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
  }, 20_000);
  return p.finally(() => clearInterval(timer));
}

export function listenExternal(): void {
  chrome.runtime.onMessageExternal.addListener((msg: ExternalRequest, sender, sendResponse) => {
    const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : undefined);
    if (!isAllowedOrigin(origin)) return false; // drop silently
    if (!takeToken()) {
      sendResponse({ error: 'Too many requests to the extension. Try again in a minute.', code: 'RATE_LIMITED' });
      return false;
    }
    withKeepalive(handleExternal(msg)).then(
      (data) => sendResponse({ data }),
      (e: unknown) =>
        sendResponse({
          error: e instanceof Error ? e.message : String(e),
          code: e instanceof BridgeError ? e.code : 'PROVIDER_ERROR',
        })
    );
    return true;
  });
}
