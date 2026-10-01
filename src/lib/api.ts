export const CAREERAGENT_WEB_URL = 'https://careeragent.fyi';

/**
 * Open a path on the CareerAgent web dashboard in a new browser tab
 */
export async function openPlatformUrl(path: string = '/'): Promise<void> {
  const url = `${CAREERAGENT_WEB_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}
