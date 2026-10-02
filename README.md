# CareerAgent Extension

The browser half of [CareerAgent](https://careeragent.fyi): autofills ATS application forms from your profile, tracks what you applied to, and runs every AI feature the dashboard offers with your own API key. It also typesets LaTeX resumes locally with a bundled pdfTeX. Manifest V3, built with [WXT](https://wxt.dev).

Architecture for the whole product: [career-agent-web/docs/ARCHITECTURE.md](https://github.com/koteshrv/career-agent-web/blob/main/docs/ARCHITECTURE.md).

## What it does

- **Autofill** on Greenhouse, Lever, Ashby and Workday from the stored profile, including the resume PDF; saved answers are reused and new questions can be drafted with AI. `Alt+Shift+F` fills without opening the popup.
- **Tracking**: a submitted application is added to the pipeline with a follow-up reminder; the toolbar badge counts follow-ups due.
- **AI, with your key**: Gemini, OpenAI, Anthropic or Groq. Models are listed from the provider once a key is entered. Used for resume parsing, tailored resumes, cover letters, cold emails and batch job triage.
- **LaTeX**: resumes are compiled inside the extension by a WebAssembly pdfTeX with a static TeX Live subset, so no network is needed and nothing leaves the browser.
- **Bridge** to the dashboard over `externally_connectable`, restricted to `careeragent.fyi`, origin-checked, rate-limited and payload-clamped.

No accounts, no CareerAgent servers in the loop: profile, pipeline, resumes and keys live in `chrome.storage.local`.

## Layout

```text
entrypoints/
  background.ts        service worker: badge, autofill shortcut, popup/content messages, dashboard bridge
  content.ts           injected on ATS pages: extraction, autofill, submit watch, inline AI helper
  offscreen/           hidden page hosting the pdfTeX Web Worker (service workers cannot spawn workers)
  popup/               React popup: This job, Pipeline, Profile, Settings
src/
  lib/bridge.ts        actions the dashboard may call, with origin and payload checks
  lib/messages.ts      typed internal message bus
  lib/sanitize.ts      deep clamps for everything that crosses a boundary
  lib/ai/              provider calls, resume parsing, playbooks (career-ops prompts), triage, model listing
  lib/latex/           template, renderer (latex.md JSON → LaTeX), engine client, offscreen compile
  lib/autofill/        field matching, saved answers, resume attachment
  lib/storage.ts       chrome.storage.local access, several resumes with one upload PDF
prompts/               vendored career-ops playbooks (see prompts/README.md)
public/latex/          pdfTeX engine (SwiftLaTeX, EPL-2.0)
public/texlive/        static TeX Live subset (see public/texlive/README.md)
tests/                 node:test suites
```

## Develop

```bash
npm install
npm run dev          # writes .output/chrome-mv3-dev with HMR; load it unpacked at chrome://extensions
npm run build        # production build in .output/chrome-mv3
npm test             # node:test suites
```

Pairing a dev build with the dashboard: the dev build has its own extension id. Paste it into the dashboard's Settings → Extension ID (or set `VITE_EXTENSION_ID` in the dashboard's `.env.local`). Dev builds also accept messages from `http://localhost/*`.

Reload the extension at chrome://extensions after a build; Chrome caches the manifest and icons until you do.

## Prompts

AI calls use the career-ops playbooks in `prompts/` verbatim, composed the way the career-agent backend composes them (playbook, then the target job, then the candidate context) and parsed as the JSON their output schema specifies. The exact prompt sent is visible in the dashboard's Settings → AI activity.

## Permissions

`storage`, `unlimitedStorage` (resumes and the TeX bundle cache), `activeTab`, `scripting` (on-demand injection on ATS hosts), `offscreen` (LaTeX worker). Host permissions cover the four ATS families, the job index API and the four AI providers. The content security policy allows WebAssembly for pdfTeX and nothing else beyond self.

## License

MIT for this repository's code. Vendored components keep their own licenses: SwiftLaTeX pdfTeX (EPL-2.0), TeX Live files (their respective free licenses, listed upstream), career-ops prompts (see career-ops.org).
