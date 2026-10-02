import { request, BridgeError } from '../messages';

export interface CompiledPdf {
  /** Base64 PDF, or null when LaTeX failed; `log` then holds the tail of the compiler output. */
  pdf: string | null;
  log: string;
  status: number;
}

const OFFSCREEN_URL = 'offscreen.html';
let creating: Promise<void> | null = null;

async function ensureOffscreen(): Promise<void> {
  if (!chrome.offscreen) throw new BridgeError('NOT_SUPPORTED', 'Compiling LaTeX needs Chrome.');
  const runtime = chrome.runtime as typeof chrome.runtime & {
    getContexts?: (f: { contextTypes: string[]; documentUrls?: string[] }) => Promise<unknown[]>;
  };
  const existing = runtime.getContexts ? await runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)] }) : [];
  if (existing.length > 0) return;
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({ url: OFFSCREEN_URL, reasons: ['WORKERS' as chrome.offscreen.Reason], justification: 'Compiles LaTeX resumes with a WebAssembly pdfTeX, which runs in a Web Worker.' })
      .catch((e: unknown) => {
        if (!String(e).toLowerCase().includes('single offscreen')) throw e;
      })
      .finally(() => {
        creating = null;
      });
  }
  await creating;
}

/** Compiles in the offscreen document; keeps the service worker alive while pdfTeX runs (first run can take ~20s). */
export async function compileLatexInOffscreen(tex: string): Promise<CompiledPdf> {
  await ensureOffscreen();
  const keepalive = setInterval(() => chrome.runtime.getPlatformInfo().catch(() => undefined), 20_000);
  try {
    return await request<CompiledPdf>({ type: 'COMPILE_LATEX', tex }, 240_000);
  } finally {
    clearInterval(keepalive);
  }
}
