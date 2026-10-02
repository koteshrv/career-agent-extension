import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractJobDetails } from '../src/lib/extractors';
import { executeAutofill } from '../src/lib/autofill';
import { matchSkills } from '../src/lib/autofill/extras';
import { initInlineAIHelper } from '../src/lib/inline';
import { listen, request } from '../src/lib/messages';
import type { JobDetails } from '../src/types';

declare global {
  interface Window {
    __careeragentContentLoaded?: boolean;
  }
}

const MARK = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#0f1419"/><rect x="6" y="6.5" width="12" height="2.6" rx="1.3" fill="#f5f6f8"/><rect x="6" y="10.7" width="7" height="2.6" rx="1.3" fill="#f5f6f8"/><rect x="14.6" y="10.2" width="3.6" height="3.6" rx="1" fill="#39a7cb"/><rect x="6" y="14.9" width="12" height="2.6" rx="1.3" fill="#f5f6f8"/></svg>`;

function showToast(text: string) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .t { display:flex; align-items:center; gap:10px; background:#161a20; color:#e6e9ee; border:1px solid #262b33; border-radius:10px; padding:10px 14px; font: 500 13px/1.3 'Google Sans', system-ui, sans-serif; box-shadow: 0 12px 32px -8px rgba(15,20,25,.4); max-width: 320px; }
      .t span { color:#8c94a1; font-weight:400; display:block; margin-top:2px; }
    </style>
    <div class="t">${MARK}<div>Added to your pipeline<span></span></div></div>`;
  shadow.querySelector('span')!.textContent = text;
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 4500);
}

/** Watches for an application being submitted and tells the background worker, which decides whether to track it. */
function initSubmitWatch(getJob: () => JobDetails | null) {
  let lastSent = 0;
  const looksLikeApplication = (form: HTMLFormElement | null) => !!form?.querySelector('input[type="email"], input[type="file"], textarea');
  const maybeTrack = () => {
    if (Date.now() - lastSent < 15_000) return;
    lastSent = Date.now();
    const job = getJob();
    if (!job) return;
    request<{ tracked: boolean }>({ type: 'APPLICATION_SUBMITTED', job })
      .then((r) => r.tracked && showToast(`${job.title} at ${job.company}`))
      .catch(() => {});
  };
  document.addEventListener('submit', (e) => { if (looksLikeApplication(e.target as HTMLFormElement)) maybeTrack(); }, true);
  document.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as Element | null)?.closest('button, input[type="submit"], a[role="button"]');
      if (!btn) return;
      const text = (btn.textContent || (btn as HTMLInputElement).value || '').trim();
      if (!/^(submit( application)?|apply( now)?|send application|complete application)$/i.test(text)) return;
      const form = btn.closest('form');
      if (form && !looksLikeApplication(form)) return;
      maybeTrack();
    },
    true
  );
}

export default defineContentScript({
  // Static injection only on ATS hosts. Everything else (LinkedIn, company career sites)
  // is injected on demand from the popup via activeTab + chrome.scripting.
  matches: ['*://*.greenhouse.io/*', '*://*.lever.co/*', '*://*.ashbyhq.com/*', '*://*.myworkdayjobs.com/*'],
  runAt: 'document_idle',
  main() {
    // The popup may inject this file on demand; never register listeners twice.
    if (window.__careeragentContentLoaded) return;
    window.__careeragentContentLoaded = true;

    const getJob = () => extractJobDetails(window.location.href, document);

    try {
      initInlineAIHelper(getJob);
      initSubmitWatch(getJob);
    } catch (e) {
      console.warn('[CareerAgent] Failed to initialize page helpers:', e);
    }

    listen({
      PING: () => ({ message: 'PONG' }),
      EXTRACT_JOB_DETAILS: () => getJob(),
      AUTOFILL_APPLICATION: ({ profile, answers, resume }) => executeAutofill(profile, window.location.href, document, { answers, resume }),
      MATCH_SKILLS: ({ skills }) => matchSkills(document, skills),
    });
  },
});
