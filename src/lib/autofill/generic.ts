import { CandidateProfile, AutofillResult, ATSType } from '../../types';
import { setNativeValue, setNativeSelect, checkMatchingRadio } from './helpers';

/**
 * Universal heuristic form autofill engine.
 * Supports Workday, Phenom People (e.g. Mastercard, Microsoft), Taleo, iCIMS,
 * SmartRecruiters, Jobvite, and custom career site application forms.
 */
export function autofillGeneric(
  profile: CandidateProfile,
  doc: Document = document
): AutofillResult {
  let fieldsFilled = 0;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // Helper to query element by multiple candidate selectors
  const fillFirstAvailable = (
    selectors: string[],
    value: string
  ): boolean => {
    if (!value) return false;
    for (const selector of selectors) {
      const el = doc.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
      if (el && !el.value && !el.disabled && el.type !== 'hidden') {
        setNativeValue(el, value);
        fieldsFilled++;
        return true;
      }
    }
    return false;
  };

  // 1. First Name
  const filledFirst = fillFirstAvailable(
    [
      'input[autocomplete="given-name"]',
      'input[name*="firstName" i]',
      'input[name*="first_name" i]',
      'input[name*="fname" i]',
      'input[id*="firstName" i]',
      'input[id*="first_name" i]',
      'input[aria-label*="first name" i]',
      'input[placeholder*="first name" i]',
      'input[data-automation-id*="firstName" i]',
      'input[data-ph-id*="firstName" i]',
      'input[name="first"]',
    ],
    profile.firstName
  );

  // 2. Last Name
  const filledLast = fillFirstAvailable(
    [
      'input[autocomplete="family-name"]',
      'input[name*="lastName" i]',
      'input[name*="last_name" i]',
      'input[name*="lname" i]',
      'input[id*="lastName" i]',
      'input[id*="last_name" i]',
      'input[aria-label*="last name" i]',
      'input[placeholder*="last name" i]',
      'input[data-automation-id*="lastName" i]',
      'input[data-ph-id*="lastName" i]',
      'input[name="last"]',
    ],
    profile.lastName
  );

  // 3. Full Name (if separate first/last name wasn't matched)
  if (!filledFirst && !filledLast) {
    fillFirstAvailable(
      [
        'input[autocomplete="name"]',
        'input[name="name" i]',
        'input[name*="fullName" i]',
        'input[name*="full_name" i]',
        'input[id*="fullName" i]',
        'input[id*="full_name" i]',
        'input[placeholder*="full name" i]',
        'input[aria-label*="full name" i]',
        'input[data-automation-id*="fullName" i]',
      ],
      fullName
    );
  }

  // 4. Email Address
  fillFirstAvailable(
    [
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[aria-label*="email" i]',
      'input[placeholder*="email" i]',
      'input[data-automation-id*="email" i]',
      'input[data-ph-id*="email" i]',
    ],
    profile.email
  );

  // 5. Phone Number
  fillFirstAvailable(
    [
      'input[type="tel"]',
      'input[autocomplete="tel"]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[name*="mobile" i]',
      'input[aria-label*="phone" i]',
      'input[placeholder*="phone" i]',
      'input[data-automation-id*="phone" i]',
      'input[data-ph-id*="phone" i]',
    ],
    profile.phone
  );

  // 6. Location / City / Address
  if (profile.location) {
    fillFirstAvailable(
      [
        'input[autocomplete="address-level2"]',
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[name*="location" i]',
        'input[id*="location" i]',
        'input[placeholder*="city" i]',
        'input[placeholder*="location" i]',
        'input[aria-label*="city" i]',
        'input[aria-label*="location" i]',
        'input[data-automation-id*="city" i]',
      ],
      profile.location
    );
  }

  // 7. LinkedIn URL
  if (profile.linkedinUrl) {
    fillFirstAvailable(
      [
        'input[name*="linkedin" i]',
        'input[id*="linkedin" i]',
        'input[aria-label*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
        'input[data-automation-id*="linkedin" i]',
        'input[data-ph-id*="linkedin" i]',
      ],
      profile.linkedinUrl
    );
  }

  // 8. GitHub URL
  if (profile.githubUrl) {
    fillFirstAvailable(
      [
        'input[name*="github" i]',
        'input[id*="github" i]',
        'input[aria-label*="github" i]',
        'input[placeholder*="github" i]',
        'input[data-automation-id*="github" i]',
      ],
      profile.githubUrl
    );
  }

  // 9. Portfolio / Personal Website
  if (profile.portfolioUrl) {
    fillFirstAvailable(
      [
        'input[name*="portfolio" i]',
        'input[name*="website" i]',
        'input[id*="portfolio" i]',
        'input[id*="website" i]',
        'input[aria-label*="portfolio" i]',
        'input[aria-label*="website" i]',
        'input[placeholder*="portfolio" i]',
        'input[placeholder*="website" i]',
        'input[data-automation-id*="website" i]',
      ],
      profile.portfolioUrl
    );
  }

  // 10. Work Authorization & Sponsorship Radios / Selects
  try {
    if (profile.requiresSponsorship) {
      checkMatchingRadio(doc, /yes/i, 'sponsor');
    } else {
      checkMatchingRadio(doc, /no/i, 'sponsor');
    }

    if (profile.workAuthorization === 'US_CITIZEN' || profile.workAuthorization === 'GREEN_CARD') {
      checkMatchingRadio(doc, /yes/i, 'authorize');
      checkMatchingRadio(doc, /yes/i, 'legally');
    }
  } catch {
    // Ignore optional radio matching failures
  }

  return {
    success: fieldsFilled > 0,
    fieldsFilled,
    atsType: 'generic' as ATSType,
    message:
      fieldsFilled > 0
        ? `Autofilled ${fieldsFilled} fields on this application form!`
        : 'Found form page, but inputs were already filled or use unsupported selectors.',
  };
}
