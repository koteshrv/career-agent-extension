import { JobDetails } from '../../types';
import { extractGreenhouse, isGreenhousePage } from './greenhouse';
import { extractLever, isLeverPage } from './lever';
import { extractAshby, isAshbyPage } from './ashby';
import { extractLinkedIn, isLinkedInJobsPage } from './linkedin';
import { extractGeneric } from './generic';

/**
 * Detects ATS / Job Board and extracts job details from the current document
 */
export function extractJobDetails(url: string, doc: Document = document): JobDetails {
  if (isGreenhousePage(url, doc)) {
    const gh = extractGreenhouse(url, doc);
    if (gh) return gh;
  }

  if (isLeverPage(url, doc)) {
    const lever = extractLever(url, doc);
    if (lever) return lever;
  }

  if (isAshbyPage(url, doc)) {
    const ashby = extractAshby(url, doc);
    if (ashby) return ashby;
  }

  if (isLinkedInJobsPage(url)) {
    const li = extractLinkedIn(url, doc);
    if (li) return li;
  }

  return extractGeneric(url, doc);
}
