import type { FillReport } from '../../types';
import { detectQuestionText } from './questions';

/**
 * What autofill did, made visible: every field it set is marked and outlined, every required field still empty is
 * outlined in amber, and the popup or in-page panel gets the lists. The marks are plain attributes and one stylesheet,
 * removed on the next run.
 */
const ATTR = 'data-careeragent-filled';
const STYLE_ID = 'careeragent-autofill-style';

function ensureStyle(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    [${ATTR}] { outline: 2px solid rgba(34, 197, 94, 0.75) !important; outline-offset: 2px !important; transition: outline-color .6s; }
    [data-careeragent-attention] { outline: 2px solid rgba(245, 158, 11, 0.85) !important; outline-offset: 2px !important; }
  `;
  (doc.head || doc.documentElement).appendChild(style);
}

export function markFilled(el: Element) {
  try {
    ensureStyle(el.ownerDocument);
    el.setAttribute(ATTR, '1');
  } catch {}
}

export function clearMarks(doc: Document) {
  for (const el of Array.from(doc.querySelectorAll(`[${ATTR}], [data-careeragent-attention]`))) {
    el.removeAttribute(ATTR);
    el.removeAttribute('data-careeragent-attention');
  }
}

function labelFor(el: Element): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const q = detectQuestionText(el);
    if (q) return q;
  }
  const id = el.getAttribute('id');
  const doc = el.ownerDocument;
  const byFor = id ? doc.querySelector(`label[for="${CSS_escape(id)}"]`) : null;
  const text = (byFor?.textContent || el.closest('label')?.textContent || el.getAttribute('aria-label') || el.getAttribute('name') || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 80) || (el instanceof HTMLInputElement && el.type === 'file' ? 'File upload' : el.tagName.toLowerCase());
}

function CSS_escape(s: string): string {
  return s.replace(/["\\]/g, '\\$&');
}

function isVisible(el: Element): boolean {
  const he = el as HTMLElement;
  if (he.hidden || he.getAttribute('aria-hidden') === 'true') return false;
  const view = el.ownerDocument.defaultView;
  if (!view) return true;
  const cs = view.getComputedStyle(he);
  return cs.display !== 'none' && cs.visibility !== 'hidden';
}

function isEmpty(el: Element): boolean {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      const name = el.name;
      const group = name ? Array.from(el.ownerDocument.querySelectorAll<HTMLInputElement>(`input[type="${el.type}"][name="${CSS_escape(name)}"]`)) : [el];
      return !group.some((g) => g.checked);
    }
    if (el.type === 'file') return !el.files || el.files.length === 0;
    return el.value.trim() === '';
  }
  if (el instanceof HTMLTextAreaElement) return el.value.trim() === '';
  if (el instanceof HTMLSelectElement) return el.value === '' || el.selectedIndex < 0;
  return false;
}

export function buildFillReport(doc: Document): FillReport {
  const filled: FillReport['filled'] = [];
  for (const el of Array.from(doc.querySelectorAll(`[${ATTR}]`))) {
    const value = el instanceof HTMLInputElement && el.type === 'file' ? el.files?.[0]?.name || 'file' : el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') ? (el.labels?.[0]?.textContent || 'selected').trim() : (el as HTMLInputElement).value ?? '';
    filled.push({ label: labelFor(el), value: String(value).slice(0, 120) });
  }
  const seen = new Set<string>();
  const empty: string[] = [];
  const candidates = Array.from(doc.querySelectorAll<Element>('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
  for (const el of candidates) {
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';
    if (!required || !isVisible(el) || !isEmpty(el) || el.hasAttribute(ATTR)) continue;
    const label = labelFor(el);
    const key = `${(el as HTMLInputElement).name || ''}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    empty.push(label);
    try { el.setAttribute('data-careeragent-attention', '1'); } catch {}
  }
  return { filled, empty };
}
