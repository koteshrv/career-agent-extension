# CareerAgent Extension (v1.0 MVP)

> Cross-browser extension (Chrome & Firefox) using Manifest V3 that powers 1-click ATS application autofill and automatic application tracking for the CareerAgent platform.

---

## ⚡ Core Design Principles

1. **Zero Fragile DOM Buttons**: Does NOT inject permanent buttons or modify the DOM of third-party sites like LinkedIn or Naukri. When the user opens the extension popup, it automatically extracts the active tab's job details.
2. **Signed-In Flow**: Users sign in via Google OAuth or email/password against `api.careeragent.fyi`.
3. **Double Value Loop**: When a user clicks "1-Click Autofill Form" on Greenhouse, Lever, or Ashby, the extension populates the form AND immediately logs that job to the user's application tracking board with a 3-day follow-up reminder.

---

## 🛠 Tech Stack

* **Framework**: [WXT](https://wxt.dev/) (Vite-based Next-gen WebExtension framework for React + TypeScript)
* **UI**: React 18, Tailwind CSS, Lucide React icons
* **Storage**: `chrome.storage.local` with fallback to `browser.storage.local`
* **Targets**:
  * Chrome: `npm run build` (Manifest V3)
  * Firefox: `npm run build:firefox` (Manifest V3)

---

## 📂 Project Structure

```
career-agent-extension/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html           # Popup HTML shell
│   │   ├── main.tsx             # React mount
│   │   ├── App.tsx              # Main popup state & navigation
│   │   └── style.css            # Tailwind directives & theme
│   ├── background.ts            # Service worker & follow-up badge counter
│   └── content.ts               # Injected on-demand for ATS autofill
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Brand logo (Orbit) + Auth state + Dark mode
│   │   ├── JobDetectorCard.tsx  # Shows detected job on active tab
│   │   ├── ProfileForm.tsx      # Contact, LinkedIn, Resume, Work Auth
│   │   ├── ApplicationBoard.tsx # Mini Kanban tracker (Applied, Interview, etc.)
│   │   ├── AutofillBar.tsx      # Trigger autofill on active ATS
│   │   ├── ManualAddModal.tsx   # Manually add job to tracker
│   │   └── Icons.tsx            # Custom brand SVG icons
│   ├── lib/
│   │   ├── extractors/          # DOM parsing logic
│   │   │   ├── greenhouse.ts
│   │   │   ├── lever.ts
│   │   │   ├── ashby.ts
│   │   │   ├── linkedin.ts
│   │   │   ├── generic.ts
│   │   │   └── index.ts
│   │   ├── autofill/            # ATS form mapping engine
│   │   │   ├── helpers.ts       # Native React/Vue event dispatchers
│   │   │   ├── greenhouse.ts
│   │   │   ├── lever.ts
│   │   │   ├── ashby.ts
│   │   │   └── index.ts
│   │   ├── api.ts               # Communication with api.careeragent.fyi
│   │   └── storage.ts           # Type-safe chrome.storage helpers
│   └── types/
│       └── index.ts             # CandidateProfile, JobDetails, etc.
├── tests/
│   └── ats.test.ts              # Test suite for extractors & autofill
├── wxt.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Typecheck & Tests
```bash
npm run compile
npm test
```

### 3. Build for Production

#### Chrome (Manifest V3)
```bash
npm run build
```
The output directory will be `.output/chrome-mv3`.

#### Firefox (Manifest V3)
```bash
npm run build:firefox
```
The output directory will be `.output/firefox-mv3`.

---

## 🔌 Loading into Browsers

### Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the folder for the build you want:
   * `npm run dev` / `wxt build --mode development` → `.output/chrome-mv3-dev` (allows the dashboard on `http://localhost:*` to reach the extension, no CSP).
   * `npm run build` → `.output/chrome-mv3` (production manifest: only `https://careeragent.fyi` may talk to the extension).
5. Copy the extension **ID** shown on the card. The web dashboard needs it (`VITE_EXTENSION_ID`, or the Extension ID field on its Settings page). Each folder gets a different id, and the id changes if the folder moves.

### Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `.output/firefox-mv3/manifest.json`.

---

## 🎯 Supported ATS Platforms in v1.0

| ATS / Board | Detection | 1-Click Autofill | Auto Tracking |
|---|---|---|---|
| **Greenhouse** | ✅ Yes | ✅ Yes (Fields, custom Qs, Work Auth) | ✅ Yes (3-day follow-up) |
| **Lever** | ✅ Yes | ✅ Yes (Cards, URLs, Work Auth) | ✅ Yes (3-day follow-up) |
| **Ashby** | ✅ Yes | ✅ Yes (Name, URLs, Work Auth) | ✅ Yes (3-day follow-up) |
| **LinkedIn Jobs** | ✅ Yes | 📌 Track Only (Zero fragile DOM) | ✅ Yes (3-day follow-up) |
| **Indeed / Generic** | ✅ Yes (JSON-LD) | Standard Fields | ✅ Yes (3-day follow-up) |
