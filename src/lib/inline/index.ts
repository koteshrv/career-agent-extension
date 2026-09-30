import { setNativeValue } from '../autofill/helpers';
import { JobDetails } from '../../types';

const ORBIT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block; flex-shrink:0;">
  <circle cx="12" cy="12" r="3"/>
  <circle cx="19" cy="5" r="2"/>
  <circle cx="5" cy="19" r="2"/>
  <path d="M10.4 21.9a10 10 0 0 0 9.94-8.4"/>
  <path d="M13.6 2.1a10 10 0 0 0-9.94 8.4"/>
</svg>
`;

/**
 * Detects the question prompt associated with a textarea
 */
function detectQuestionText(textarea: HTMLTextAreaElement): string {
  // 1. Associated <label for="...">
  if (textarea.id) {
    const label = document.querySelector(`label[for="${textarea.id}"]`);
    if (label?.textContent?.trim()) {
      return label.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  // 2. Parent or closest label
  const parentLabel = textarea.closest('label');
  if (parentLabel?.textContent?.trim()) {
    return parentLabel.textContent.trim().replace(/\s+/g, ' ');
  }

  // 3. Preceding heading, paragraph, or container label
  const container = textarea.closest('div, section, fieldset, tr, td');
  if (container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, legend, label, p, strong');
    for (const h of Array.from(headings)) {
      const text = h.textContent?.trim() || '';
      if (text.length > 5 && text.length < 200 && !text.toLowerCase().includes('characters remaining')) {
        return text.replace(/\s+/g, ' ');
      }
    }
  }

  // 4. Placeholder or aria-label fallback
  if (textarea.placeholder && textarea.placeholder.length > 5) {
    return textarea.placeholder.trim();
  }
  if (textarea.getAttribute('aria-label')) {
    return textarea.getAttribute('aria-label')!.trim();
  }

  return 'Job Application Question';
}

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
    border: 1px solid #fed7aa;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #ea580c;
  `;
  triggerBtn.innerHTML = `
    ${ORBIT_SVG}
    <span style="font-size: 10px; line-height: 1;">Draft with AI</span>
  `;

  triggerBtn.onmouseenter = () => {
    triggerBtn.style.background = '#fff7ed';
    triggerBtn.style.borderColor = '#ea580c';
    triggerBtn.style.transform = 'translateY(-1px)';
  };
  triggerBtn.onmouseleave = () => {
    triggerBtn.style.background = '#ffffff';
    triggerBtn.style.borderColor = '#fed7aa';
    triggerBtn.style.transform = 'translateY(0)';
  };

  wrapper.appendChild(triggerBtn);

  // Click handler: opens isolated modal
  triggerBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const question = detectQuestionText(textarea);
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
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Google Sans', 'Product Sans', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .card {
      width: 500px;
      max-width: 92vw;
      background: #16181D;
      color: #F2F3F5;
      border: 1px solid #25272D;
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
      border-bottom: 1px solid #25272D;
      background: #121316;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #F2F3F5;
    }
    .brand-highlight { color: #ea580c; font-weight: 600; }
    .badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 6px;
      background: #202228;
      color: #8A8F98;
      border: 1px solid #25272D;
      font-weight: 500;
    }
    .close-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #8A8F98;
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
    .close-btn:hover { color: #F2F3F5; background: #202228; border-color: #25272D; }
    .body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .question-box {
      background: #202228;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #25272D;
      border-left: 3px solid #ea580c;
    }
    .question-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #ea580c;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .question-text {
      font-size: 12px;
      font-weight: 500;
      color: #F2F3F5;
      line-height: 1.4;
    }
    .textarea-preview {
      width: 100%;
      height: 140px;
      background: #121316;
      border: 1px solid #25272D;
      border-radius: 8px;
      color: #F2F3F5;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      outline: none;
    }
    .textarea-preview:focus { border-color: #ea580c; }
    .loading-state {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #121316;
      border: 1px dashed #25272D;
      border-radius: 8px;
      color: #8A8F98;
      font-size: 12px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #202228;
      border-top-color: #ea580c;
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
      border-top: 1px solid #25272D;
      background: #121316;
    }
    .token-notice {
      font-size: 10px;
      color: #8A8F98;
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
      background: #202228;
      border: 1px solid #25272D;
      color: #F2F3F5;
    }
    .btn-secondary:hover { background: #25272D; }
    .btn-primary {
      background: #ea580c;
      color: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .btn-primary:hover { background: #f97316; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  shadow.appendChild(style);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="header">
      <div class="brand">
        ${ORBIT_SVG}
        <span>careeragent<span class="brand-highlight">.fyi</span></span>
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
      <div class="token-notice">Tokens used only on demand</div>
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

  const runGeneration = async () => {
    contentArea.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Drafting answer with your profile & target role...</span>
      </div>
    `;
    insertBtn.disabled = true;
    regenBtn.disabled = true;

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
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
          (res) => resolve(res)
        );
      });

      if (response && response.success && response.answer) {
        currentDraft = response.answer;
        contentArea.innerHTML = `
          <textarea class="textarea-preview" id="ca-result-text">${escapeHtml(currentDraft)}</textarea>
        `;

        const textareaEl = shadow.getElementById('ca-result-text') as HTMLTextAreaElement;
        textareaEl?.addEventListener('input', () => {
          currentDraft = textareaEl.value;
        });

        insertBtn.disabled = false;
        regenBtn.disabled = false;
      } else {
        const errorMsg =
          response?.error || 'Failed to generate answer. Please ensure your AI API Key is configured in settings.';
        contentArea.innerHTML = `
          <div class="error-box">
            <strong>Generation Notice:</strong><br/>
            ${escapeHtml(errorMsg)}
          </div>
        `;
        regenBtn.disabled = false;
      }
    } catch (err: any) {
      contentArea.innerHTML = `
        <div class="error-box">
          <strong>Error:</strong> ${escapeHtml(err?.message || 'Connection failed')}
        </div>
      `;
      regenBtn.disabled = false;
    }
  };

  // Insert button
  insertBtn.addEventListener('click', () => {
    if (currentDraft) {
      setNativeValue(textarea, currentDraft);
      closeModal();
    }
  });

  // Regenerate button
  regenBtn.addEventListener('click', runGeneration);

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

  // Observe dynamically loaded textareas (common in Workday, Phenom, React SPAs)
  const observer = new MutationObserver(() => {
    scanAndAttach();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
