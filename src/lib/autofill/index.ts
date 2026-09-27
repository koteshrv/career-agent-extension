import { CandidateProfile, AutofillResult, ATSType } from '../../types';
import { isGreenhousePage } from '../extractors/greenhouse';
import { isLeverPage } from '../extractors/lever';
import { isAshbyPage } from '../extractors/ashby';
import { autofillGreenhouse } from './greenhouse';
import { autofillLever } from './lever';
import { autofillAshby } from './ashby';

/**
 * Executes ATS autofill for the current page
 */
export function executeAutofill(
  profile: CandidateProfile,
  url: string = window.location.href,
  doc: Document = document
): AutofillResult {
  if (isGreenhousePage(url, doc)) {
    return autofillGreenhouse(profile, doc);
  }

  if (isLeverPage(url, doc)) {
    return autofillLever(profile, doc);
  }

  if (isAshbyPage(url, doc)) {
    return autofillAshby(profile, doc);
  }

  // Attempt generic fill as fallback
  let filled = 0;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // Try matching standard form inputs
  const nameInputs = doc.querySelectorAll<HTMLInputElement>('input[autocomplete="name"], input[name*="name" i]');
  nameInputs.forEach((el) => {
    if (!el.value && fullName) {
      el.value = fullName;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    }
  });

  const emailInputs = doc.querySelectorAll<HTMLInputElement>('input[type="email"], input[name*="email" i]');
  emailInputs.forEach((el) => {
    if (!el.value && profile.email) {
      el.value = profile.email;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    }
  });

  return {
    success: filled > 0,
    fieldsFilled: filled,
    atsType: 'generic' as ATSType,
    message: filled > 0
      ? `Autofilled ${filled} standard fields on this page.`
      : 'No compatible ATS application form detected.',
  };
}
