import { compileLatex } from '../../src/lib/latex/engine';

/** Base64 in chunks: spreading a 150 KB PDF into String.fromCharCode overflows the call stack. */
function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}

// The background worker cannot spawn Web Workers, so LaTeX compiles here, in an offscreen document it opens on demand.
chrome.runtime.onMessage.addListener((msg: { type?: string; tex?: string }, _sender, sendResponse) => {
  if (msg?.type !== 'COMPILE_LATEX') return false;
  compileLatex(String(msg.tex ?? '')).then(
    (r) => sendResponse({ ok: true, data: { pdf: r.pdf ? toBase64(r.pdf) : null, log: r.log.slice(-6000), status: r.status } }),
    (e: unknown) => sendResponse({ ok: false, code: 'LATEX_FAILED', message: e instanceof Error ? e.message : String(e) })
  );
  return true;
});
