import { setNativeValue } from '../autofill/helpers';
import { JobDetails } from '../../types';
import { request, BridgeError } from '../messages';
import { detectQuestionText } from '../autofill/questions';
import type { SavedAnswer } from '../../types';

const MARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="display:block; flex-shrink:0;">
  <rect width="24" height="24" rx="6" fill="#0f1419"/>
  <rect x="6" y="6.5" width="12" height="2.6" rx="1.3" fill="#f5f6f8"/>
  <rect x="6" y="10.7" width="7" height="2.6" rx="1.3" fill="#f5f6f8"/>
  <rect x="14.6" y="10.2" width="3.6" height="3.6" rx="1" fill="#39a7cb"/>
  <rect x="6" y="14.9" width="12" height="2.6" rx="1.3" fill="#f5f6f8"/>
</svg>
`;

/**
 * Injects the CareerAgent inline AI Orbit logo into an individual textarea
 */
function attachOrbitToTextarea(textarea: HTMLTextAreaElement, getJobDetails: () => JobDetails | null): void {
  if (textarea.dataset.careeragentInjected === 'true') return;
  textarea.dataset.careeragentInjected = 'true';

  // Create wrapper or position relatively
  const wrapper = document.createElement('div');
  wrapper.className = 'careeragent-inline-wrapper';
  wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';

  textarea.parentElement?.insertBefore(wrapper, textarea);
  wrapper.appendChild(textarea);

  // Floating CareerAgent Logo Trigger Button
  const triggerBtn = document.createElement('button');
  triggerBtn.type = 'button';
  triggerBtn.title = 'Draft response with CareerAgent AI';
  triggerBtn.style.cssText = `
    position: absolute;
    right: 8px;
    bottom: 8px;
    z-index: 100;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    background: #ffffff;
    border: 1px solid #c7ccd5;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #0f1419;
  `;
  triggerBtn.innerHTML = `
    ${MARK_SVG}
    <span style="font-size: 10px; line-height: 1;">Draft with AI</span>
  `;

  triggerBtn.onmouseenter = () => {
    triggerBtn.style.background = '#e3f1f6';
    triggerBtn.style.borderColor = '#0c6e8c';
    triggerBtn.style.transform = 'translateY(-1px)';
  };
  triggerBtn.onmouseleave = () => {
    triggerBtn.style.background = '#ffffff';
    triggerBtn.style.borderColor = '#c7ccd5';
    triggerBtn.style.transform = 'translateY(0)';
  };

  wrapper.appendChild(triggerBtn);

  // Click handler: opens isolated modal
  triggerBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const question = detectQuestionText(textarea) || 'Job Application Question';
    const job = getJobDetails();

    openAIModal(textarea, question, job);
  });
}

/**
 * Creates and renders the CareerAgent AI draft popover inside a Shadow DOM
 */
function openAIModal(
  textarea: HTMLTextAreaElement,
  question: string,
  job: JobDetails | null
): void {
  // Remove any existing modal
  const existing = document.getElementById('careeragent-ai-modal-host');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'careeragent-ai-modal-host';
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .card {
      width: 500px;
      max-width: 92vw;
      background: #161a20;
      color: #e6e9ee;
      border: 1px solid #262b33;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.96) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #262b33;
      background: #0f1115;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #e6e9ee;
    }
    .brand-highlight { color: #39a7cb; font-weight: 600; }
    .badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 6px;
      background: #1c2128;
      color: #8c94a1;
      border: 1px solid #262b33;
      font-weight: 500;
    }
    .close-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #8c94a1;
      cursor: pointer;
      font-size: 14px;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .close-btn:hover { color: #e6e9ee; background: #1c2128; border-color: #262b33; }
    .body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .question-box {
      background: #1c2128;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #262b33;
      border-left: 3px solid #39a7cb;
    }
    .question-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #5bbbd9;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .question-text {
      font-size: 12px;
      font-weight: 500;
      color: #e6e9ee;
      line-height: 1.4;
    }
    .textarea-preview {
      width: 100%;
      height: 140px;
      background: #0f1115;
      border: 1px solid #262b33;
      border-radius: 8px;
      color: #e6e9ee;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      outline: none;
    }
    .textarea-preview:focus { border-color: #39a7cb; }
    .loading-state {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #0f1115;
      border: 1px dashed #262b33;
      border-radius: 8px;
      color: #8c94a1;
      font-size: 12px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #1c2128;
      border-top-color: #39a7cb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 10px;
      border-radius: 8px;
      color: #fca5a5;
      font-size: 11px;
      line-height: 1.4;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid #262b33;
      background: #0f1115;
    }
    .token-notice {
      font-size: 10px;
      color: #8c94a1;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-secondary {
      background: #1c2128;
      border: 1px solid #262b33;
      color: #e6e9ee;
    }
    .btn-secondary:hover { background: #262b33; }
    .btn-primary {
      background: #39a7cb;
      color: #0b1116;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .btn-primary:hover { background: #5bbbd9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  shadow.appendChild(style);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="header">
      <div class="brand">
        ${MARK_SVG}
        <span>CareerAgent</span>
        <span class="badge">AI Assistant</span>
      </div>
      <button class="close-btn" id="ca-close">✕</button>
    </div>

    <div class="body">
      <div class="question-box">
        <div class="question-title">Target Question</div>
        <div class="question-text">${escapeHtml(question)}</div>
      </div>

      <div id="ca-content-area">
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Drafting answer based on your profile & target role...</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="token-notice">Inserted answers are remembered for this question</div>
      <div class="actions">
        <button class="btn btn-secondary" id="ca-regen" disabled>Regenerate</button>
        <button class="btn btn-primary" id="ca-insert" disabled>Insert into Field</button>
      </div>
    </div>
  `;

  shadow.appendChild(card);
  document.body.appendChild(host);

  // Close handlers
  const closeModal = () => host.remove();
  shadow.getElementById('ca-close')?.addEventListener('click', closeModal);
  host.addEventListener('click', (e) => {
    if (e.target === host) closeModal();
  });

  const contentArea = shadow.getElementById('ca-content-area')!;
  const insertBtn = shadow.getElementById('ca-insert') as HTMLButtonElement;
  const regenBtn = shadow.getElementById('ca-regen') as HTMLButtonElement;

  let currentDraft = '';

  const showDraft = (text: string, note?: string) => {
    currentDraft = text;
    contentArea.innerHTML = `
      ${note ? `<div class="token-notice" style="margin-bottom:6px">${escapeHtml(note)}</div>` : ''}
      <textarea class="textarea-preview" id="ca-result-text">${escapeHtml(text)}</textarea>
    `;
    const textareaEl = shadow.getElementById('ca-result-text') as HTMLTextAreaElement;
    textareaEl?.addEventListener('input', () => {
      currentDraft = textareaEl.value;
    });
    insertBtn.disabled = false;
    regenBtn.disabled = false;
  };

  const runGeneration = async (force = false) => {
    contentArea.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Drafting answer with your profile & target role...</span>
      </div>
    `;
    insertBtn.disabled = true;
    regenBtn.disabled = true;

    if (!force) {
      try {
        const saved = await request<SavedAnswer | null>({ type: 'GET_SAVED_ANSWER', question }, 3000);
        if (saved?.answer) {
          showDraft(saved.answer, `Saved answer from ${new Date(saved.updatedAt).toLocaleDateString()}. Edit it, or generate a fresh one.`);
          regenBtn.textContent = 'Generate with AI';
          return;
        }
      } catch {
        // no saved answer, fall through to AI
      }
    }

    try {
      const { answer } = await request<{ answer: string }>(
        {
          type: 'GENERATE_AI_ANSWER',
          question,
          job: job || {
            title: 'Position',
            company: document.title || 'Company',
            location: 'Remote',
            url: window.location.href,
            atsType: 'generic',
          },
        },
        90_000
      );

      if (answer) {
        showDraft(answer);
        regenBtn.textContent = 'Regenerate';
      } else {
        throw new Error('The AI returned an empty answer. Try regenerating.');
      }
    } catch (err: unknown) {
      const title = err instanceof BridgeError && err.code === 'NO_API_KEY' ? 'Setup needed' : 'Error';
      const message = err instanceof Error ? err.message : 'Connection failed';
      contentArea.innerHTML = `
        <div class="error-box">
          <strong>${title}:</strong> ${escapeHtml(message)}
        </div>
      `;
      regenBtn.disabled = false;
    }
  };

  // Insert button: the approved text is remembered for the next time this question appears.
  insertBtn.addEventListener('click', () => {
    if (currentDraft) {
      setNativeValue(textarea, currentDraft);
      request({ type: 'SAVE_ANSWER', question, answer: currentDraft }, 3000).catch(() => {});
      closeModal();
    }
  });

  // Regenerate button
  regenBtn.addEventListener('click', () => runGeneration(true));

  // Run initial draft
  runGeneration();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initializes inline Orbit triggers on all application textareas across the page
 */
export function initInlineAIHelper(getJobDetails: () => JobDetails | null): void {
  const scanAndAttach = () => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    for (const ta of textareas) {
      // Skip hidden, disabled, or tiny textareas
      if (ta.disabled || ta.readOnly || ta.offsetWidth < 60 || ta.offsetHeight < 30) continue;
      attachOrbitToTextarea(ta, getJobDetails);
    }
  };

  // Initial scan
  scanAndAttach();

  // Observe dynamically loaded textareas (common in Workday, Phenom, React SPAs), debounced.
  let timer: number | undefined;
  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((m) => m.addedNodes.length > 0)) return;
    clearTimeout(timer);
    timer = window.setTimeout(scanAndAttach, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
