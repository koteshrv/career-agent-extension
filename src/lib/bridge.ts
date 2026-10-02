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
  listResumes,
  listResumeMetas,
  addResume,
  removeResume,
  setUploadResume,
} from './storage';
import { parseResume, generateMaterial, evaluateJobs, materialSystemPrompt, EVALUATE_SYSTEM, type MaterialKind } from './ai';
import { resumeBodyFromModel, wrapResume, isFullDocument, sanitizeDocument } from './latex/template';
import { compileLatexInOffscreen } from './latex/compile';
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
  | { action: 'get_resume_meta' }
  | { action: 'generate_material'; payload: { kind?: unknown; baseResumeId?: unknown; job?: { title?: unknown; company?: unknown; description?: unknown } } }
  | { action: 'list_resumes' }
  | { action: 'add_resume'; payload: { name?: unknown; kind?: unknown; data?: unknown; text?: unknown } }
  | { action: 'get_resume'; payload: { id?: unknown } }
  | { action: 'delete_resume'; payload: { id?: unknown } }
  | { action: 'set_upload_resume'; payload: { id?: unknown } }
  | { action: 'evaluate_jobs'; payload: { jobs?: unknown } }
  | { action: 'compile_latex'; payload: { tex?: unknown } };

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
    case 'list_resumes':
      return listResumeMetas();
    case 'add_resume': {
      const name = str(msg.payload?.name, 256) || 'resume';
      const kind = str(msg.payload?.kind, 4);
      if (kind === 'pdf') {
        const data = msg.payload?.data;
        if (typeof data !== 'string' || !data || data.length > MAX_PDF_B64 || !/^[A-Za-z0-9+/=\s]+$/.test(data.slice(0, 2048))) {
          throw new BridgeError('BAD_PAYLOAD', 'data must be a base64 PDF under 5 MB');
        }
        return addResume({ name, type: 'application/pdf', kind, size: Math.floor((data.length * 3) / 4), data, updatedAt: new Date().toISOString() });
      }
      if (kind !== 'tex' && kind !== 'md' && kind !== 'txt') throw new BridgeError('BAD_PAYLOAD', 'kind must be pdf, tex, md or txt');
      const text = str(msg.payload?.text, 400_000);
      if (!text) throw new BridgeError('BAD_PAYLOAD', 'text is required for a text resume');
      return addResume({ name, type: 'text/plain', kind, size: text.length, data: '', text, updatedAt: new Date().toISOString() });
    }
    case 'get_resume': {
      const id = str(msg.payload?.id, 64);
      const r = (await listResumes()).find((x) => x.id === id);
      if (!r) throw new BridgeError('BAD_PAYLOAD', 'No resume with that id');
      // Text sources only; the PDF bytes stay in the extension.
      return { id: r.id, name: r.name, kind: r.kind ?? 'pdf', text: r.kind && r.kind !== 'pdf' ? r.text ?? '' : undefined };
    }
    case 'delete_resume': {
      const id = str(msg.payload?.id, 64);
      if (!id) throw new BridgeError('BAD_PAYLOAD', 'id is required');
      return removeResume(id);
    }
    case 'set_upload_resume': {
      const id = str(msg.payload?.id, 64);
      if (!id) throw new BridgeError('BAD_PAYLOAD', 'id is required');
      return setUploadResume(id);
    }
    case 'evaluate_jobs': {
      const raw = Array.isArray(msg.payload?.jobs) ? (msg.payload.jobs as unknown[]).slice(0, 15) : [];
      const jobs = raw
        .map((j) => {
          const o = (j ?? {}) as Record<string, unknown>;
          return { id: str(o.id, 64), title: str(o.title, 200), company: str(o.company, 200), location: str(o.location, 120) || undefined, description: str(o.description, 6000) };
        })
        .filter((j) => j.id && j.title && j.description);
      if (jobs.length === 0) throw new BridgeError('BAD_PAYLOAD', 'jobs must list 1-15 postings with id, title and description');
      const settings = await getSettings();
      if (!settings.aiApiKey.trim()) throw new BridgeError('NO_API_KEY', 'AI API Key not configured. Open the CareerAgent extension → Settings to add your key.');
      const started = Date.now();
      const results = await evaluateJobs(jobs, await getProfile(), settings.aiProvider, settings.aiApiKey, settings.aiModel);
      return { results, meta: { provider: settings.aiProvider, model: settings.aiModel, durationMs: Date.now() - started, systemPrompt: EVALUATE_SYSTEM } };
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
      const started = Date.now();
      const parsed = await parseResume(fileName, fileData, settings.aiProvider, settings.aiApiKey, settings.aiModel);
      const meta = { provider: settings.aiProvider, model: settings.aiModel, durationMs: Date.now() - started };
      return msg.action === 'parse_resume' ? { ...parsed, meta } : { filters: parsed.filters, meta };
    }
    case 'generate_material': {
      const kind = str(msg.payload?.kind, 20) as MaterialKind;
      if (!['resume', 'cover_letter', 'cold_email'].includes(kind)) throw new BridgeError('BAD_PAYLOAD', 'kind must be resume, cover_letter or cold_email');
      const job = { title: str(msg.payload?.job?.title, 200), company: str(msg.payload?.job?.company, 200), description: str(msg.payload?.job?.description, 12_000) };
      if (!job.description) throw new BridgeError('BAD_PAYLOAD', 'job.description is required');
      const settings = await getSettings();
      if (!settings.aiApiKey.trim()) throw new BridgeError('NO_API_KEY', 'AI API Key not configured. Open the CareerAgent extension → Settings to add your key.');
      const started = Date.now();
      const baseId = str(msg.payload?.baseResumeId, 64);
      const baseStored = baseId ? (await listResumes()).find((r) => r.id === baseId && r.text) : undefined;
      const base = baseStored && baseStored.kind && baseStored.kind !== 'pdf' ? { kind: baseStored.kind, name: baseStored.name, text: baseStored.text! } : undefined;
      const out = await generateMaterial(kind, job, await getProfile(), settings.aiProvider, settings.aiApiKey, settings.aiModel, base);
      const raw = out.text;
      const meta = { provider: settings.aiProvider, model: settings.aiModel, durationMs: Date.now() - started, systemPrompt: materialSystemPrompt(kind, base?.kind === 'tex') };
      if (kind !== 'resume') return { text: raw, meta };
      // Our template: the model writes the body and the preamble is ours. The user's own .tex: the model returns the whole document.
      const tex = base?.kind === 'tex' ? sanitizeDocument(raw) : wrapResume(resumeBodyFromModel(raw));
      const compiled = await compileLatexInOffscreen(tex);
      return { text: tex, pdf: compiled.pdf, log: compiled.pdf ? undefined : compiled.log, changes: out.changes, meta: { ...meta, durationMs: Date.now() - started } };
    }
    case 'compile_latex': {
      const tex = str(msg.payload?.tex, 200_000);
      if (!tex) throw new BridgeError('BAD_PAYLOAD', 'tex is required');
      const compiled = await compileLatexInOffscreen(isFullDocument(tex) ? sanitizeDocument(tex) : wrapResume(resumeBodyFromModel(tex)));
      return { pdf: compiled.pdf, log: compiled.pdf ? undefined : compiled.log };
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
