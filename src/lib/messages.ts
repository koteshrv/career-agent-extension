import type { CandidateProfile, JobDetails, SavedAnswer, StoredResume, CompanySignal } from '../types';

/** Every message exchanged between popup, content scripts and the background worker. */
export type Msg =
  | { type: 'PING' }
  | { type: 'EXTRACT_JOB_DETAILS' }
  | { type: 'AUTOFILL_APPLICATION'; profile: CandidateProfile; answers?: Record<string, SavedAnswer>; resume?: StoredResume | null }
  | { type: 'MATCH_SKILLS'; skills: string[] }
  | { type: 'GENERATE_AI_ANSWER'; question: string; job: JobDetails }
  | { type: 'GET_SAVED_ANSWER'; question: string }
  | { type: 'SAVE_ANSWER'; question: string; answer: string }
  | { type: 'APPLICATION_SUBMITTED'; job: JobDetails }
  | { type: 'COMPANY_SIGNAL'; company: string }
  | { type: 'RUN_AUTOFILL_ON_ACTIVE_TAB' };

export type CompanySignalResult = CompanySignal | null;

export type ErrCode =
  | 'NO_API_KEY'
  | 'PROVIDER_ERROR'
  | 'BAD_PAYLOAD'
  | 'UNKNOWN_ACTION'
  | 'RATE_LIMITED'
  | 'TIMEOUT';

export type Res<T> = { ok: true; data: T } | { ok: false; code: ErrCode; message: string };

export class BridgeError extends Error {
  constructor(public code: ErrCode, message: string) {
    super(message);
    this.name = 'BridgeError';
  }
}

export function toErrorRes(e: unknown): Res<never> {
  return {
    ok: false,
    code: e instanceof BridgeError ? e.code : 'PROVIDER_ERROR',
    message: e instanceof Error ? e.message : String(e),
  };
}

type Handlers = {
  [K in Msg['type']]?: (
    msg: Extract<Msg, { type: K }>,
    sender: chrome.runtime.MessageSender
  ) => unknown | Promise<unknown>;
};

/** Registers typed handlers on chrome.runtime.onMessage. Unhandled types are ignored (return false). */
export function listen(handlers: Handlers): void {
  chrome.runtime.onMessage.addListener((msg: Msg, sender, sendResponse) => {
    const handler = handlers[msg?.type] as
      | ((m: Msg, s: chrome.runtime.MessageSender) => unknown)
      | undefined;
    if (!handler) return false;
    Promise.resolve()
      .then(() => handler(msg, sender))
      .then(
        (data) => sendResponse({ ok: true, data } satisfies Res<unknown>),
        (e) => sendResponse(toErrorRes(e))
      );
    return true; // async response
  });
}

/** Sends a message to the background worker and unwraps the Res envelope. */
export function request<T>(msg: Msg, timeoutMs = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new BridgeError('TIMEOUT', 'The extension did not respond in time.')),
      timeoutMs
    );
    chrome.runtime.sendMessage(msg, (res: Res<T> | undefined) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        return reject(new BridgeError('TIMEOUT', chrome.runtime.lastError.message ?? 'No response'));
      }
      if (res?.ok) resolve(res.data);
      else reject(new BridgeError(res?.code ?? 'UNKNOWN_ACTION', res?.message ?? 'Unknown error'));
    });
  });
}

/** Sends a message to a tab's content script, injecting it first if the page has none (activeTab). */
export function requestTab<T>(tabId: number, msg: Msg): Promise<Res<T> | null> {
  const send = () =>
    new Promise<Res<T> | null>((resolve) => {
      chrome.tabs.sendMessage(tabId, msg, (res: Res<T>) => {
        resolve(chrome.runtime.lastError ? null : res ?? null);
      });
    });
  return send().then(async (res) => {
    if (res) return res;
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content-scripts/content.js'] });
      await new Promise((r) => setTimeout(r, 150));
      return await send();
    } catch {
      return null;
    }
  });
}
