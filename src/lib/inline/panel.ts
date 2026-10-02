import { request } from '../messages';
import type { AutofillResult, JobDetails } from '../../types';

/**
 * A small corner control on application pages: autofill with its fill report, the resume that will be attached,
 * save to pipeline, open the dashboard. Shadow DOM so host CSS cannot touch it; dismissable for the tab session.
 */
const HIDE_KEY = 'careeragent_panel_hidden';
const MARK = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" fill="#171717"/><path d="M7.5 12.5 12 8l4.5 4.5M7.5 17.5 12 13l4.5 4.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function looksLikeApplicationPage(doc: Document): boolean {
  return Boolean(doc.querySelector('form input[type="file"], form input[type="email"], form textarea, input[type="file"]'));
}

export function initPanel(getJob: () => JobDetails | null) {
  if (!looksLikeApplicationPage(document)) return;
  try { if (sessionStorage.getItem(HIDE_KEY) === '1') return; } catch {}
  if (document.getElementById('careeragent-panel-host')) return;

  const host = document.createElement('div');
  host.id = 'careeragent-panel-host';
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: 'Google Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
      .fab { display:flex; align-items:center; gap:8px; height:40px; padding:0 14px 0 10px; border-radius:999px; border:1px solid #d0d0d0; background:#fff; color:#171717; font:500 13px/1 inherit; cursor:pointer; box-shadow:0 8px 24px -8px rgba(0,0,0,.35); }
      .fab:hover { background:#f4f4f4; }
      .panel { display:none; width:320px; margin-bottom:10px; border:1px solid #e9e9e9; border-radius:14px; background:#fff; color:#171717; box-shadow:0 16px 40px -12px rgba(0,0,0,.35); overflow:hidden; }
      .panel.open { display:block; }
      .head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid #e9e9e9; }
      .title { font-size:13px; font-weight:500; line-height:1.3; }
      .sub { font-size:12px; color:#707070; margin-top:2px; }
      .x { border:0; background:none; color:#707070; cursor:pointer; font-size:16px; line-height:1; padding:2px 4px; }
      .body { padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
      .btn { display:flex; align-items:center; justify-content:center; gap:6px; height:36px; width:100%; border-radius:8px; border:1px solid #d0d0d0; background:#fff; color:#171717; font:500 13px/1 inherit; cursor:pointer; }
      .btn.primary { background:#171717; color:#fff; border-color:#171717; }
      .btn:disabled { opacity:.5; cursor:default; }
      .line { font-size:12px; color:#707070; }
      .line b { color:#171717; font-weight:500; }
      .report { border:1px solid #e9e9e9; border-radius:8px; padding:8px 10px; font-size:12px; max-height:180px; overflow:auto; }
      .report h4 { margin:0 0 4px; font-size:12px; font-weight:500; }
      .report ul { margin:0 0 6px; padding-left:16px; color:#444; }
      .report li { margin:1px 0; }
      .ok { color:#15803d; } .warn { color:#b45309; }
      .foot { display:flex; justify-content:space-between; align-items:center; padding:8px 14px 10px; font-size:11px; color:#707070; }
      .foot a { color:#171717; text-decoration:none; font-weight:500; }
      kbd { font-family: ui-monospace, Menlo, monospace; font-size:10px; border:1px solid #d0d0d0; border-radius:4px; padding:1px 4px; }
    </style>
    <div class="panel" role="dialog" aria-label="CareerAgent">
      <div class="head">
        <div><div class="title"></div><div class="sub"></div></div>
        <button class="x" aria-label="Hide for this tab" title="Hide for this tab">×</button>
      </div>
      <div class="body">
        <button class="btn primary autofill">Autofill this application</button>
        <div class="line resume">Checking the resume for uploads…</div>
        <div class="report" hidden></div>
        <button class="btn save">Save to pipeline</button>
      </div>
      <div class="foot"><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> also fills</span><a href="https://careeragent.fyi" target="_blank" rel="noreferrer">Open dashboard</a></div>
    </div>
    <button class="fab" aria-expanded="false">${MARK}<span>CareerAgent</span></button>
  `;
  document.body.appendChild(host);

  const $ = <T extends Element>(sel: string) => shadow.querySelector(sel) as T;
  const panel = $<HTMLDivElement>('.panel');
  const fab = $<HTMLButtonElement>('.fab');
  const title = $<HTMLDivElement>('.title');
  const sub = $<HTMLDivElement>('.sub');
  const autofillBtn = $<HTMLButtonElement>('.autofill');
  const saveBtn = $<HTMLButtonElement>('.save');
  const resumeLine = $<HTMLDivElement>('.resume');
  const report = $<HTMLDivElement>('.report');

  const refreshJob = () => {
    const job = getJob();
    title.textContent = job?.title || 'This application';
    sub.textContent = job?.company ? `${job.company}${job.location ? ` · ${job.location}` : ''}` : window.location.hostname;
  };

  const refreshResume = () => {
    request<{ name: string } | null>({ type: 'GET_UPLOAD_RESUME' })
      .then((r) => { resumeLine.innerHTML = r ? `Resume for uploads: <b></b>` : 'No resume set for uploads. Add one in the extension popup or the dashboard.'; if (r) resumeLine.querySelector('b')!.textContent = r.name; })
      .catch(() => { resumeLine.textContent = ''; });
  };

  fab.addEventListener('click', () => {
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    if (open) { refreshJob(); refreshResume(); }
  });
  $<HTMLButtonElement>('.x').addEventListener('click', () => {
    try { sessionStorage.setItem(HIDE_KEY, '1'); } catch {}
    host.remove();
  });

  autofillBtn.addEventListener('click', async () => {
    autofillBtn.disabled = true;
    autofillBtn.textContent = 'Filling…';
    report.hidden = true;
    try {
      const r = await request<AutofillResult & { tracked?: boolean }>({ type: 'RUN_AUTOFILL_ON_ACTIVE_TAB' }, 30_000);
      const rep = r.report ?? { filled: [], empty: [] };
      const li = (items: string[]) => items.map((t) => `<li></li>`).join('');
      report.innerHTML = `
        <h4><span class="ok">${rep.filled.length} filled</span>${rep.empty.length ? ` · <span class="warn">${rep.empty.length} required still empty</span>` : ''}${r.tracked ? ' · added to pipeline' : ''}</h4>
        ${rep.empty.length ? `<ul class="empty">${li(rep.empty)}</ul>` : ''}
        ${rep.filled.length ? `<ul class="filled">${li(rep.filled.map((f) => f.label))}</ul>` : '<div>Nothing recognised on this page.</div>'}`;
      report.querySelectorAll('.empty li').forEach((el, i) => { el.textContent = rep.empty[i]; (el as HTMLElement).className = 'warn'; });
      report.querySelectorAll('.filled li').forEach((el, i) => { el.textContent = `${rep.filled[i].label}: ${rep.filled[i].value}`; });
      report.hidden = false;
    } catch (e: unknown) {
      report.textContent = e instanceof Error ? e.message : String(e);
      report.hidden = false;
    } finally {
      autofillBtn.disabled = false;
      autofillBtn.textContent = 'Autofill again';
    }
  });

  saveBtn.addEventListener('click', async () => {
    const job = getJob();
    if (!job) { saveBtn.textContent = 'No posting details on this page'; return; }
    saveBtn.disabled = true;
    try {
      await request<{ saved: boolean }>({ type: 'SAVE_JOB', job });
      saveBtn.textContent = 'In pipeline';
    } catch (e: unknown) {
      saveBtn.disabled = false;
      saveBtn.textContent = e instanceof Error ? e.message : 'Could not save';
    }
  });
}
