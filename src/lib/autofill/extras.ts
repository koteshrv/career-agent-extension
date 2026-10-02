import { markFilled } from './report';
import { setNativeValue } from './helpers';
import { detectQuestionText } from './questions';
import { findSavedAnswer } from '../answers';
import type { SavedAnswer, StoredResume } from '../../types';

const isVisible = (el: HTMLElement) => !el.hidden && el.offsetWidth > 0 && el.offsetHeight > 0;

/** Fills empty long-answer fields whose question matches an answer the user approved before. */
export function fillSavedAnswers(doc: Document, answers: Record<string, SavedAnswer>): string[] {
  if (!answers || Object.keys(answers).length === 0) return [];
  const filled: string[] = [];
  for (const ta of Array.from(doc.querySelectorAll('textarea'))) {
    if (ta.disabled || ta.readOnly || ta.value.trim()) continue;
    if (typeof ta.offsetWidth === 'number' && ta.offsetWidth === 0 && ta.offsetHeight === 0 && !isTest(doc)) continue;
    const question = detectQuestionText(ta);
    if (!question) continue;
    const saved = findSavedAnswer(answers, question);
    if (!saved) continue;
    setNativeValue(ta, saved.answer);
    filled.push(question);
  }
  return filled;
}

function isTest(doc: Document): boolean {
  return typeof (doc.defaultView as unknown as { navigator?: { userAgent?: string } })?.navigator?.userAgent === 'string' && /jsdom/i.test((doc.defaultView as unknown as { navigator: { userAgent: string } }).navigator.userAgent);
}

const RESUME_HINT = /resume|résumé|\bcv\b|curriculum/i;

/** Attaches the stored resume to the first file input that asks for one. */
export function attachResume(doc: Document, resume: StoredResume | null | undefined): boolean {
  if (!resume?.data) return false;
  const inputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="file"]')).filter((i) => !i.disabled);
  if (inputs.length === 0) return false;
  const describe = (i: HTMLInputElement) =>
    [i.name, i.id, i.accept, i.getAttribute('aria-label'), i.getAttribute('data-automation-id'), detectQuestionText(i), i.closest('label')?.textContent, i.parentElement?.textContent?.slice(0, 200)]
      .filter(Boolean)
      .join(' ');
  const target = inputs.find((i) => RESUME_HINT.test(describe(i))) ?? (inputs.length === 1 && /pdf|\*|^$/.test(inputs[0].accept) ? inputs[0] : null);
  if (!target || (target.files && target.files.length > 0)) return false;
  try {
    const win = doc.defaultView as (Window & typeof globalThis) | null;
    if (!win || typeof win.DataTransfer !== 'function') return false;
    const bytes = Uint8Array.from(win.atob(resume.data), (c) => c.charCodeAt(0));
    const file = new win.File([bytes], resume.name, { type: resume.type || 'application/pdf' });
    const dt = new win.DataTransfer();
    dt.items.add(file);
    target.files = dt.files;
    target.dispatchEvent(new win.Event('input', { bubbles: true }));
    target.dispatchEvent(new win.Event('change', { bubbles: true }));
    markFilled(target);
    return true;
  } catch {
    return false;
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Which of the candidate's skills the page mentions. No tokens, just text. */
export function matchSkills(doc: Document, skills: string[]): { matched: string[]; missing: string[] } {
  const body = doc.body as HTMLElement | null;
  const text = ((body && 'innerText' in body && body.innerText) || body?.textContent || '').toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const raw of skills) {
    const skill = raw.trim();
    if (!skill) continue;
    const boundary = /^[a-z0-9]/i.test(skill) && /[a-z0-9]$/i.test(skill);
    const re = new RegExp(boundary ? `\\b${escapeRe(skill.toLowerCase())}\\b` : escapeRe(skill.toLowerCase()));
    (re.test(text) ? matched : missing).push(skill);
  }
  return { matched, missing };
}

export { isVisible };
