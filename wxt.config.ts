import { defineConfig } from 'wxt';

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
    version: '1.0.0',
    // activeTab covers the active tab's URL/title in the popup and on-demand injection, so no `tabs`.
    permissions: ['storage', 'activeTab', 'scripting', 'unlimitedStorage'],
    host_permissions: [
      '*://*.greenhouse.io/*',
      '*://*.lever.co/*',
      '*://*.ashbyhq.com/*',
      '*://*.myworkdayjobs.com/*',
      `${API_HOST}/*`,
      ...AI_HOSTS.map((h) => `${h}/*`),
    ],
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
    // Lock the service worker and popup to known hosts. Skipped in dev so WXT's HMR socket works.
    ...(mode === 'development'
      ? {}
      : {
          content_security_policy: {
            extension_pages: [
              "script-src 'self'",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'none'",
              `connect-src ${[API_HOST, ...AI_HOSTS].join(' ')}`,
            ].join('; '),
          },
        }),
    browser_specific_settings: {
      gecko: {
        id: 'extension@careeragent.fyi',
        strict_min_version: '109.0',
      },
    },
  }),
});
