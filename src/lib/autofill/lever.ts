import { CandidateProfile, AutofillResult } from '../../types';
import { setNativeValue, setNativeSelect, checkMatchingRadio } from './helpers';

export function autofillLever(profile: CandidateProfile, doc: Document = document): AutofillResult {
  let fieldsFilled = 0;
  const details: Record<string, string> = {};

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  // 1. Full Name
  const nameInput = doc.querySelector<HTMLInputElement>('input[name="name"], input[name="fullName"]');
  if (nameInput && fullName) {
    setNativeValue(nameInput, fullName);
    fieldsFilled++;
    details['Full Name'] = fullName;
  }

  // 2. Email
  const emailInput = doc.querySelector<HTMLInputElement>('input[name="email"]');
  if (emailInput && profile.email) {
    setNativeValue(emailInput, profile.email);
    fieldsFilled++;
    details['Email'] = profile.email;
  }

  // 3. Phone
  const phoneInput = doc.querySelector<HTMLInputElement>('input[name="phone"]');
  if (phoneInput && profile.phone) {
    setNativeValue(phoneInput, profile.phone);
    fieldsFilled++;
    details['Phone'] = profile.phone;
  }

  // 4. LinkedIn URL
  const linkedinInput = doc.querySelector<HTMLInputElement>(
    'input[name="urls[LinkedIn]"], input[name*="linkedin" i]'
  );
  if (linkedinInput && profile.linkedinUrl) {
    setNativeValue(linkedinInput, profile.linkedinUrl);
    fieldsFilled++;
    details['LinkedIn'] = profile.linkedinUrl;
  }

  // 5. GitHub URL
  const githubInput = doc.querySelector<HTMLInputElement>(
    'input[name="urls[GitHub]"], input[name*="github" i]'
  );
  if (githubInput && profile.githubUrl) {
    setNativeValue(githubInput, profile.githubUrl);
    fieldsFilled++;
    details['GitHub'] = profile.githubUrl;
  }

  // 6. Portfolio / Website
  const portfolioInput = doc.querySelector<HTMLInputElement>(
    'input[name="urls[Portfolio]"], input[name="urls[Other]"], input[name*="portfolio" i], input[name*="website" i]'
  );
  if (portfolioInput && profile.portfolioUrl) {
    setNativeValue(portfolioInput, profile.portfolioUrl);
    fieldsFilled++;
    details['Portfolio'] = profile.portfolioUrl;
  }

  // 7. Lever Custom Questions (.application-question)
  const questionDivs = doc.querySelectorAll('.application-question, .custom-question, li[class*="application-question"]');
  questionDivs.forEach((qDiv) => {
    const label = qDiv.querySelector('.application-label, label')?.textContent?.toLowerCase() || '';

    // Work authorization
    if (/authorized to work|legal.*authoriz/i.test(label)) {
      const isAuthorized = profile.workAuthorization !== 'NEED_SPONSORSHIP';
      if (checkMatchingRadio(qDiv, isAuthorized ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Work Authorized'] = isAuthorized ? 'Yes' : 'No';
      }
      const select = qDiv.querySelector<HTMLSelectElement>('select');
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
      if (checkMatchingRadio(qDiv, needsSponsorship ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
      }
      const select = qDiv.querySelector<HTMLSelectElement>('select');
      if (select) {
        if (setNativeSelect(select, (t) => needsSponsorship ? /yes/i.test(t) : /no/i.test(t))) {
          fieldsFilled++;
          details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
        }
      }
    }

    // Check if free text question matches links or location
    const input = qDiv.querySelector<HTMLInputElement>('input[type="text"]');
    if (input && !input.value) {
      if (/location|city/i.test(label) && profile.location) {
        setNativeValue(input, profile.location);
        fieldsFilled++;
        details['Location'] = profile.location;
      }
    }
  });

  return {
    success: fieldsFilled > 0,
    fieldsFilled,
    atsType: 'lever',
    message: fieldsFilled > 0
      ? `Autofilled ${fieldsFilled} fields in Lever application!`
      : 'No compatible Lever form fields found on this page.',
    details,
  };
}
