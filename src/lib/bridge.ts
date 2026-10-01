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
  saveResume,
  getResume,
} from './storage';
import { parseResume } from './ai';
import { sanitizeProfile, sanitizeApplication, str } from './sanitize';
export { sanitizeProfile, sanitizeApplication } from './sanitize';
import { BridgeError } from './messages';

const MAX_PDF_B64 = 7 * 1024 * 1024; // ~5 MB PDF
const RATE_LIMIT_PER_MIN = 30;

export type ExternalRequest =
  | { action: 'ping' }
  | { action: 'get_state' }
  | { action: 'save_profile'; payload: unknown }
  | { action: 'upsert_application'; payload: unknown }
  | { action: 'delete_application'; payload: { id?: unknown } }
  | { action: 'parse_resume_for_filters'; payload: { fileName?: unknown; fileData?: unknown } }
  | { action: 'parse_resume'; payload: { fileName?: unknown; fileData?: unknown } }
  | { action: 'save_resume'; payload: { name?: unknown; type?: unknown; data?: unknown } }
  | { action: 'get_resume_meta' };

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

export async function handleExternal(msg: ExternalRequest): Promise<unknown> {
  switch (msg?.action) {
    case 'ping':
      return {
        status: 'ok',
        version: typeof chrome !== 'undefined' ? chrome.runtime.getManifest().version : 'dev',
      };
    case 'get_state':
      return { profile: await getProfile(), applications: await getApplications() };
    case 'get_resume_meta': {
      const r = await getResume();
      return r ? { name: r.name, size: r.size, updatedAt: r.updatedAt } : null;
    }
    case 'save_resume': {
      const name = str(msg.payload?.name, 256) || 'resume.pdf';
      const data = msg.payload?.data;
      if (typeof data !== 'string' || !data || data.length > MAX_PDF_B64 || !/^[A-Za-z0-9+/=\s]+$/.test(data.slice(0, 2048))) {
        throw new BridgeError('BAD_PAYLOAD', 'data must be a base64 PDF under 5 MB');
      }
      await saveResume({ name, type: 'application/pdf', size: Math.floor((data.length * 3) / 4), data, updatedAt: new Date().toISOString() });
      return { saved: true };
    }
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
    case 'parse_resume_for_filters':
    case 'parse_resume': {
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
      const parsed = await parseResume(fileName, fileData, settings.aiProvider, settings.aiApiKey, settings.aiModel);
      return msg.action === 'parse_resume' ? parsed : { filters: parsed.filters };
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
