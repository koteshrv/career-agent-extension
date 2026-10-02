import { defineConfig } from 'wxt';
import pkg from './package.json';

const AI_HOSTS = [
  'https://generativelanguage.googleapis.com',
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://api.groq.com',
];
const API_HOST = 'https://api.careeragent.fyi';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser, mode }) => ({
    name: 'CareerAgent - 1-Click ATS Autofill & Tracker',
    description: '1-click ATS application autofill and automatic job tracking for Greenhouse, Lever, Ashby, and LinkedIn.',
    version: pkg.version,
    // Public half of the signing key (private half lives outside the repo). It pins the extension id to
    // plkniphjimejobodnkckdjndalimcicp for every unpacked install and for the Web Store listing, so the dashboard can
    // address the extension without per-machine setup.
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8l46eeN5/i8eCSTB+lmI0e6ra1rjjOEXqd0ItoELDGaYkwi8SEw2ljZYaL9jGJd0piVHnhrJ2KsXw6Dl4eYrZCoUHmhBuudF6LHM+5MmXWTEsYxxNZIfXbQ2OhbFlpe601bM0flVWdFhGopCTnwETu4QOHpZSuFZR3wrm/kM41ZaiU1nvSsBcI5xa5nc8eSai64SlmytNM269sTUnrp6uv8clvSOyhcVLj2k4k0xmjcFglk37hiw+Fnkyea31O05Ja+0Mqj5YTvkgQ7dYP3rJYlU2KXCGsAx3fts2mT4TWjpfb7ofXo2axe43dwl2cXizyMZ0Jk0+tK8eiY986V4dQIDAQAB',
    // activeTab covers the active tab's URL/title in the popup and on-demand injection, so no `tabs`.
    // offscreen: the LaTeX engine runs in a Web Worker, which a service worker cannot spawn.
    permissions: ['storage', 'activeTab', 'scripting', 'unlimitedStorage', 'offscreen'],
    host_permissions: [
      '*://*.greenhouse.io/*',
      '*://*.lever.co/*',
      '*://*.ashbyhq.com/*',
      '*://*.myworkdayjobs.com/*',
      `${API_HOST}/*`,
      ...AI_HOSTS.map((h) => `${h}/*`),
    ],
    commands: {
      autofill: {
        suggested_key: { default: 'Alt+Shift+F' },
        description: 'Autofill the application form on this page',
      },
    },
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    action: {
      default_title: 'CareerAgent Assistant',
      default_icon: {
        16: 'icon-16.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
    // Only careeragent.fyi may message the extension (chrome.runtime.sendMessage(extensionId, ...)).
    ...(browser === 'chrome'
      ? {
          externally_connectable: {
            matches: [
              'https://careeragent.fyi/*',
              'https://*.careeragent.fyi/*',
              ...(mode === 'development' ? ['http://localhost/*'] : []),
            ],
          },
        }
      : {}),
    // Lock extension pages to known hosts. 'wasm-unsafe-eval' is for the pdfTeX engine; connect-src 'self' lets its
    // worker read the bundled TeX Live files. Dev adds WXT's HMR origin.
    content_security_policy: {
      extension_pages: [
        `script-src 'self' 'wasm-unsafe-eval'${mode === 'development' ? ' http://localhost:3000' : ''}`,
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        `connect-src 'self' ${[API_HOST, ...AI_HOSTS].join(' ')}${mode === 'development' ? ' ws://localhost:3000 http://localhost:3000' : ''}`,
      ].join('; '),
    },
    browser_specific_settings: {
      gecko: {
        id: 'extension@careeragent.fyi',
        strict_min_version: '109.0',
      },
    },
  }),
});
