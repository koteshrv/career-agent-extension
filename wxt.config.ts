import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'CareerAgent - 1-Click ATS Autofill & Tracker',
    description: '1-click ATS application autofill and automatic job tracking for Greenhouse, Lever, Ashby, and LinkedIn.',
    version: '1.0.0',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'tabs',
    ],
    host_permissions: [
      '*://*.greenhouse.io/*',
      '*://*.lever.co/*',
      '*://*.ashbyhq.com/*',
      '*://*.linkedin.com/*',
      '*://*.indeed.com/*',
      'https://api.careeragent.fyi/*',
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
    browser_specific_settings: {
      gecko: {
        id: 'extension@careeragent.fyi',
        strict_min_version: '109.0',
      },
    },
  },
});
