import { CandidateProfile, AutofillResult } from '../../types';
import { isGreenhousePage } from '../extractors/greenhouse';
import { isLeverPage } from '../extractors/lever';
import { isAshbyPage } from '../extractors/ashby';
import { autofillGreenhouse } from './greenhouse';
import { autofillLever } from './lever';
import { autofillAshby } from './ashby';
import { autofillGeneric } from './generic';

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

  return autofillGeneric(profile, doc);
}
