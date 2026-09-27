import { CandidateProfile, AutofillResult } from '../../types';
import { setNativeValue, setNativeSelect, checkMatchingRadio } from './helpers';

export function autofillAshby(profile: CandidateProfile, doc: Document = document): AutofillResult {
  let fieldsFilled = 0;
  const details: Record<string, string> = {};

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // 1. Name: Check separate first/last or single full name
  const firstNameInput = doc.querySelector<HTMLInputElement>(
    'input[name="firstName"], input[data-qa="first-name-field"]'
  );
  const lastNameInput = doc.querySelector<HTMLInputElement>(
    'input[name="lastName"], input[data-qa="last-name-field"]'
  );

  if (firstNameInput && profile.firstName) {
    setNativeValue(firstNameInput, profile.firstName);
    fieldsFilled++;
    details['First Name'] = profile.firstName;
  }
  if (lastNameInput && profile.lastName) {
    setNativeValue(lastNameInput, profile.lastName);
    fieldsFilled++;
    details['Last Name'] = profile.lastName;
  }

  // If single Name field
  if (!firstNameInput && !lastNameInput) {
    const nameInput = doc.querySelector<HTMLInputElement>(
      'input[name="name"], input[data-qa="name-field"], input[placeholder*="Name" i]'
    );
    if (nameInput && fullName) {
      setNativeValue(nameInput, fullName);
      fieldsFilled++;
      details['Full Name'] = fullName;
    }
  }

  // 2. Email
  const emailInput = doc.querySelector<HTMLInputElement>(
    'input[name="email"], input[data-qa="email-field"], input[type="email"]'
  );
  if (emailInput && profile.email) {
    setNativeValue(emailInput, profile.email);
    fieldsFilled++;
    details['Email'] = profile.email;
  }

  // 3. Phone
  const phoneInput = doc.querySelector<HTMLInputElement>(
    'input[name="phoneNumber"], input[name="phone"], input[data-qa="phone-field"], input[type="tel"]'
  );
  if (phoneInput && profile.phone) {
    setNativeValue(phoneInput, profile.phone);
    fieldsFilled++;
    details['Phone'] = profile.phone;
  }

  // 4. Location
  const locationInput = doc.querySelector<HTMLInputElement>(
    'input[name="location"], input[data-qa="location-field"], input[placeholder*="Location" i]'
  );
  if (locationInput && profile.location) {
    setNativeValue(locationInput, profile.location);
    fieldsFilled++;
    details['Location'] = profile.location;
  }

  // 5. LinkedIn
  const linkedinInput = doc.querySelector<HTMLInputElement>(
    'input[name*="linkedin" i], input[data-qa*="linkedin" i], input[placeholder*="linkedin.com" i]'
  );
  if (linkedinInput && profile.linkedinUrl) {
    setNativeValue(linkedinInput, profile.linkedinUrl);
    fieldsFilled++;
    details['LinkedIn'] = profile.linkedinUrl;
  }

  // 6. GitHub
  const githubInput = doc.querySelector<HTMLInputElement>(
    'input[name*="github" i], input[data-qa*="github" i], input[placeholder*="github.com" i]'
  );
  if (githubInput && profile.githubUrl) {
    setNativeValue(githubInput, profile.githubUrl);
    fieldsFilled++;
    details['GitHub'] = profile.githubUrl;
  }

  // 7. Portfolio / Website
  const websiteInput = doc.querySelector<HTMLInputElement>(
    'input[name*="website" i], input[name*="portfolio" i], input[data-qa*="website" i], input[data-qa*="portfolio" i]'
  );
  if (websiteInput && profile.portfolioUrl) {
    setNativeValue(websiteInput, profile.portfolioUrl);
    fieldsFilled++;
    details['Portfolio'] = profile.portfolioUrl;
  }

  // 8. Custom questions & Work authorization
  const formGroups = doc.querySelectorAll('div[class*="FormEntry"], div[class*="FormField"], [data-qa*="custom-question"]');
  formGroups.forEach((group) => {
    const label = group.querySelector('label, [class*="label"]')?.textContent?.toLowerCase() || '';

    // Work authorization
    if (/authorized to work|legal.*authoriz/i.test(label)) {
      const isAuthorized = profile.workAuthorization !== 'NEED_SPONSORSHIP';
      if (checkMatchingRadio(group, isAuthorized ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Work Authorized'] = isAuthorized ? 'Yes' : 'No';
      }
      const select = group.querySelector<HTMLSelectElement>('select');
      if (select) {
        if (setNativeSelect(select, (t) => isAuthorized ? /yes/i.test(t) : /no/i.test(t))) {
          fieldsFilled++;
          details['Work Authorized'] = isAuthorized ? 'Yes' : 'No';
        }
      }
    }

    // Sponsorship
    if (/sponsorship|sponsor/i.test(label)) {
      const needsSponsorship = profile.requiresSponsorship;
      if (checkMatchingRadio(group, needsSponsorship ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
      }
      const select = group.querySelector<HTMLSelectElement>('select');
      if (select) {
        if (setNativeSelect(select, (t) => needsSponsorship ? /yes/i.test(t) : /no/i.test(t))) {
          fieldsFilled++;
          details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
        }
      }
    }
  });

  return {
    success: fieldsFilled > 0,
    fieldsFilled,
    atsType: 'ashby',
    message: fieldsFilled > 0
      ? `Autofilled ${fieldsFilled} fields in Ashby application!`
      : 'No compatible Ashby form fields found on this page.',
    details,
  };
}
