import { CandidateProfile, AutofillResult, ATSType } from '../../types';
import { setNativeValue, checkMatchingRadio } from './helpers';

/**
 * Finds an input or textarea element by analyzing human-readable labels,
 * parent containers, and surrounding DOM text (Simplify-style heuristic).
 */
function findInputByLabelPattern(
  doc: Document,
  pattern: RegExp,
  typeFilter: 'input' | 'textarea' | 'any' = 'any'
): HTMLInputElement | HTMLTextAreaElement | null {
  const isEligible = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement => {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return false;
    const input = el as HTMLInputElement;
    if (input.disabled || input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
      return false;
    }
    if (typeFilter === 'input' && tag !== 'input') return false;
    if (typeFilter === 'textarea' && tag !== 'textarea') return false;
    return true;
  };

  // 1. Check all standard <label> elements
  const labels = Array.from(doc.querySelectorAll('label'));
  for (const label of labels) {
    const text = label.textContent?.trim() || '';
    if (pattern.test(text)) {
      // Check for="..."
      const forId = label.getAttribute('for');
      if (forId) {
        const target = doc.getElementById(forId);
        if (isEligible(target) && !target.value) return target;
      }

      // Check nested input
      const nested = label.querySelector('input, textarea');
      if (isEligible(nested) && !nested.value) return nested;

      // Check adjacent/sibling in parent field container
      const parent = label.closest('div[class*="field" i], div[class*="form" i], div[class*="input" i], div[class*="group" i], tr, td') || label.parentElement;
      if (parent) {
        const sibling = parent.querySelector('input:not([type="hidden"]), textarea');
        if (isEligible(sibling) && !sibling.value) return sibling;
      }
    }
  }

  // 2. Check pseudo-labels (e.g. Workday/Phenom <span> or <div> used as form labels)
  const candidates = Array.from(doc.querySelectorAll('span, div, p, legend, strong')).filter((el) => {
    if (el.children.length > 2) return false;
    const t = el.textContent?.trim() || '';
    return t.length > 2 && t.length < 80 && pattern.test(t);
  });

  for (const cand of candidates) {
    const parent = cand.closest('div[class*="field" i], div[class*="form" i], div[class*="input" i], div[class*="group" i], tr, td, section') || cand.parentElement;
    if (parent) {
      const input = parent.querySelector('input:not([type="hidden"]), textarea');
      if (isEligible(input) && !input.value) return input;
    }
  }

  return null;
}

/**
 * Universal heuristic form autofill engine.
 * Supports Workday, Phenom People (Mastercard, etc.), Taleo, iCIMS,
 * SmartRecruiters, Jobvite, and custom career site application forms.
 * Consumes ZERO tokens.
 */
export function autofillGeneric(
  profile: CandidateProfile,
  doc: Document = document
): AutofillResult {
  let fieldsFilled = 0;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // Helper to fill element and track count
  const fillIfEmpty = (el: HTMLInputElement | HTMLTextAreaElement | null, value: string): boolean => {
    if (!el || !value || el.value) return false;
    setNativeValue(el, value);
    fieldsFilled++;
    return true;
  };

  // Helper to query element by multiple candidate selectors
  const fillFirstSelector = (selectors: string[], value: string): boolean => {
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

  // 1. First Name (Selectors -> Heuristic Label Match)
  const filledFirst =
    fillFirstSelector(
      [
        'input[autocomplete="given-name"]',
        'input[data-automation-id*="firstName" i]',
        'input[data-ph-id*="firstName" i]',
        'input[name*="firstName" i]',
        'input[name*="first_name" i]',
        'input[name*="fname" i]',
        'input[id*="firstName" i]',
        'input[id*="first_name" i]',
        'input[aria-label*="first name" i]',
        'input[placeholder*="first name" i]',
        'input[name="first"]',
      ],
      profile.firstName
    ) ||
    fillIfEmpty(
      findInputByLabelPattern(doc, /\b(first\s*name|given\s*name|legal\s*first\s*name|forename|fname)\b/i, 'input'),
      profile.firstName
    );

  // 2. Last Name
  const filledLast =
    fillFirstSelector(
      [
        'input[autocomplete="family-name"]',
        'input[data-automation-id*="lastName" i]',
        'input[data-ph-id*="lastName" i]',
        'input[name*="lastName" i]',
        'input[name*="last_name" i]',
        'input[name*="lname" i]',
        'input[id*="lastName" i]',
        'input[id*="last_name" i]',
        'input[aria-label*="last name" i]',
        'input[placeholder*="last name" i]',
        'input[name="last"]',
      ],
      profile.lastName
    ) ||
    fillIfEmpty(
      findInputByLabelPattern(doc, /\b(last\s*name|family\s*name|legal\s*last\s*name|surname|lname)\b/i, 'input'),
      profile.lastName
    );

  // 3. Full Name (if separate first/last name wasn't matched)
  if (!filledFirst && !filledLast) {
    fillFirstSelector(
      [
        'input[autocomplete="name"]',
        'input[data-automation-id*="fullName" i]',
        'input[name*="fullName" i]',
        'input[name*="full_name" i]',
        'input[name="name" i]',
        'input[id*="fullName" i]',
        'input[id*="full_name" i]',
        'input[placeholder*="full name" i]',
        'input[aria-label*="full name" i]',
      ],
      fullName
    ) ||
      fillIfEmpty(
        findInputByLabelPattern(doc, /\b(full\s*name|legal\s*name|your\s*name|candidate\s*name)\b/i, 'input'),
        fullName
      );
  }

  // 4. Email Address
  fillFirstSelector(
    [
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[data-automation-id*="email" i]',
      'input[data-ph-id*="email" i]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[aria-label*="email" i]',
      'input[placeholder*="email" i]',
    ],
    profile.email
  ) ||
    fillIfEmpty(
      findInputByLabelPattern(doc, /\b(e-?mail|email\s*address)\b/i, 'input'),
      profile.email
    );

  // 5. Phone Number
  fillFirstSelector(
    [
      'input[type="tel"]',
      'input[autocomplete="tel"]',
      'input[data-automation-id*="phone" i]',
      'input[data-ph-id*="phone" i]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[name*="mobile" i]',
      'input[aria-label*="phone" i]',
      'input[placeholder*="phone" i]',
    ],
    profile.phone
  ) ||
    fillIfEmpty(
      findInputByLabelPattern(doc, /\b(phone|mobile|cell|telephone|contact\s*number)\b/i, 'input'),
      profile.phone
    );

  // 6. Location / City / Address
  if (profile.location) {
    fillFirstSelector(
      [
        'input[autocomplete="address-level2"]',
        'input[data-automation-id*="city" i]',
        'input[data-ph-id*="city" i]',
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[name*="location" i]',
        'input[id*="location" i]',
        'input[placeholder*="city" i]',
        'input[placeholder*="location" i]',
        'input[aria-label*="city" i]',
      ],
      profile.location
    ) ||
      fillIfEmpty(
        findInputByLabelPattern(doc, /\b(city|current\s*city|location|address)\b/i, 'input'),
        profile.location
      );
  }

  // 7. LinkedIn URL
  if (profile.linkedinUrl) {
    fillFirstSelector(
      [
        'input[data-automation-id*="linkedin" i]',
        'input[data-ph-id*="linkedin" i]',
        'input[name*="linkedin" i]',
        'input[id*="linkedin" i]',
        'input[aria-label*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
      ],
      profile.linkedinUrl
    ) ||
      fillIfEmpty(
        findInputByLabelPattern(doc, /\b(linkedin|linkedin\s*url|linkedin\s*profile)\b/i, 'any'),
        profile.linkedinUrl
      );
  }

  // 8. GitHub URL
  if (profile.githubUrl) {
    fillFirstSelector(
      [
        'input[data-automation-id*="github" i]',
        'input[name*="github" i]',
        'input[id*="github" i]',
        'input[aria-label*="github" i]',
        'input[placeholder*="github" i]',
      ],
      profile.githubUrl
    ) ||
      fillIfEmpty(
        findInputByLabelPattern(doc, /\b(github|github\s*url|github\s*profile)\b/i, 'any'),
        profile.githubUrl
      );
  }

  // 9. Portfolio / Personal Website
  if (profile.portfolioUrl) {
    fillFirstSelector(
      [
        'input[data-automation-id*="website" i]',
        'input[name*="portfolio" i]',
        'input[name*="website" i]',
        'input[id*="portfolio" i]',
        'input[id*="website" i]',
        'input[aria-label*="portfolio" i]',
        'input[aria-label*="website" i]',
        'input[placeholder*="portfolio" i]',
        'input[placeholder*="website" i]',
      ],
      profile.portfolioUrl
    ) ||
      fillIfEmpty(
        findInputByLabelPattern(doc, /\b(portfolio|website|personal\s*website|personal\s*site)\b/i, 'any'),
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

    if (['US_CITIZEN', 'GREEN_CARD', 'PERMANENT_RESIDENT'].includes(profile.workAuthorization)) {
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
        ? `Autofilled ${fieldsFilled} fields with 0 tokens consumed!`
        : 'Found form page, but inputs were already filled or use unsupported custom structures.',
  };
}
