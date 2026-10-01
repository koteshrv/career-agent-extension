import { CandidateProfile, AutofillResult, SavedAnswer, StoredResume } from '../../types';
import { fillSavedAnswers, attachResume } from './extras';
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
export interface AutofillExtras {
  answers?: Record<string, SavedAnswer>;
  resume?: StoredResume | null;
}

export function executeAutofill(
  profile: CandidateProfile,
  url: string = window.location.href,
  doc: Document = document,
  extras: AutofillExtras = {}
): AutofillResult {
  const base = isGreenhousePage(url, doc)
    ? autofillGreenhouse(profile, doc)
    : isLeverPage(url, doc)
    ? autofillLever(profile, doc)
    : isAshbyPage(url, doc)
    ? autofillAshby(profile, doc)
    : autofillGeneric(profile, doc);

  // Everything the ATS-specific pass does not know about: approved answers and the resume file.
  const answered = extras.answers ? fillSavedAnswers(doc, extras.answers) : [];
  const attached = attachResume(doc, extras.resume);
  const fieldsFilled = base.fieldsFilled + answered.length + (attached ? 1 : 0);
  const details = { ...(base.details || {}) };
  for (const q of answered) details[q.slice(0, 60)] = 'Saved answer';
  if (attached) details['Resume'] = extras.resume?.name || 'attached';

  return {
    ...base,
    success: fieldsFilled > 0,
    fieldsFilled,
    details,
    message:
      fieldsFilled > 0
        ? `Filled ${fieldsFilled} ${fieldsFilled === 1 ? 'field' : 'fields'}${answered.length ? `, ${answered.length} from saved answers` : ''}${attached ? ', resume attached' : ''}.`
        : base.message,
  };
}
