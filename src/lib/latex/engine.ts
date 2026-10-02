/**
 * Thin client for the SwiftLaTeX pdfTeX worker (public/latex). One worker, compiles serialized.
 * Runs only in an extension page with Worker access (the offscreen document), never the service worker.
 */
export interface CompileResult {
  pdf: Uint8Array | null;
  log: string;
  status: number;
}

const ENGINE_URL = chrome.runtime.getURL('latex/swiftlatexpdftex.js');
// TeX Live files ship with the extension (public/texlive), so compiling needs no network at all.
const TEXLIVE_URL = chrome.runtime.getURL('texlive/');

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function load(): Promise<void> {
  if (ready) return ready;
  ready = new Promise<void>((resolve, reject) => {
    const w = new Worker(ENGINE_URL);
    w.onmessage = (ev: MessageEvent<{ result?: string }>) => {
      if (ev.data?.result === 'ok') {
        w.onmessage = null;
        w.postMessage({ cmd: 'settexliveurl', url: TEXLIVE_URL });
        worker = w;
        resolve();
      } else {
        reject(new Error('LaTeX engine failed to start'));
      }
    };
    w.onerror = (e) => reject(new Error(`LaTeX engine error: ${e.message}`));
  });
  ready.catch(() => {
    ready = null;
    worker = null;
  });
  return ready;
}

export function compileLatex(tex: string): Promise<CompileResult> {
  const run = async (): Promise<CompileResult> => {
    await load();
    const w = worker!;
    w.postMessage({ cmd: 'writefile', url: 'main.tex', src: tex });
    w.postMessage({ cmd: 'setmainfile', url: 'main.tex' });
    return new Promise<CompileResult>((resolve) => {
      w.onmessage = (ev: MessageEvent<{ cmd?: string; result?: string; log?: string; status?: number; pdf?: ArrayBuffer }>) => {
        const d = ev.data;
        if (d?.cmd !== 'compile') return;
        w.onmessage = null;
        resolve({ pdf: d.result === 'ok' && d.pdf ? new Uint8Array(d.pdf) : null, log: d.log ?? '', status: d.status ?? -1 });
      };
      w.postMessage({ cmd: 'compilelatex' });
    });
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
