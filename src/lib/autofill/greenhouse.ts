import { CandidateProfile, AutofillResult } from '../../types';
import { setNativeValue, setNativeSelect, checkMatchingRadio } from './helpers';

export function autofillGreenhouse(profile: CandidateProfile, doc: Document = document): AutofillResult {
  let fieldsFilled = 0;
  const details: Record<string, string> = {};

  // 1. First Name
  const firstNameInput = doc.querySelector<HTMLInputElement>(
    '#first_name, input[name="job_application[first_name]"], input[autocomplete="given-name"]'
  );
  if (firstNameInput && profile.firstName) {
    setNativeValue(firstNameInput, profile.firstName);
    fieldsFilled++;
    details['First Name'] = profile.firstName;
  }

  // 2. Last Name
  const lastNameInput = doc.querySelector<HTMLInputElement>(
    '#last_name, input[name="job_application[last_name]"], input[autocomplete="family-name"]'
  );
  if (lastNameInput && profile.lastName) {
    setNativeValue(lastNameInput, profile.lastName);
    fieldsFilled++;
    details['Last Name'] = profile.lastName;
  }

  // 3. Email
  const emailInput = doc.querySelector<HTMLInputElement>(
    '#email, input[name="job_application[email]"], input[type="email"]'
  );
  if (emailInput && profile.email) {
    setNativeValue(emailInput, profile.email);
    fieldsFilled++;
    details['Email'] = profile.email;
  }

  // 4. Phone
  const phoneInput = doc.querySelector<HTMLInputElement>(
    '#phone, input[name="job_application[phone]"], input[type="tel"]'
  );
  if (phoneInput && profile.phone) {
    setNativeValue(phoneInput, profile.phone);
    fieldsFilled++;
    details['Phone'] = profile.phone;
  }

  // 5. Location
  const locationInput = doc.querySelector<HTMLInputElement>(
    '#job_application_location, input[name="job_application[location]"]'
  );
  if (locationInput && profile.location) {
    setNativeValue(locationInput, profile.location);
    fieldsFilled++;
    details['Location'] = profile.location;
  }

  // 6. Custom Questions & Links (LinkedIn, GitHub, Portfolio)
  const allFieldDivs = doc.querySelectorAll('.field, .custom-question, [class*="field-"]');
  allFieldDivs.forEach((field) => {
    const label = field.querySelector('label')?.textContent?.toLowerCase() || '';
    const textInput = field.querySelector<HTMLInputElement>('input[type="text"], input[type="url"]');
    const select = field.querySelector<HTMLSelectElement>('select');

    if (textInput) {
      if (/linkedin/i.test(label) && profile.linkedinUrl && !textInput.value) {
        setNativeValue(textInput, profile.linkedinUrl);
        fieldsFilled++;
        details['LinkedIn'] = profile.linkedinUrl;
      } else if (/github/i.test(label) && profile.githubUrl && !textInput.value) {
        setNativeValue(textInput, profile.githubUrl);
        fieldsFilled++;
        details['GitHub'] = profile.githubUrl;
      } else if (/(website|portfolio|personal url)/i.test(label) && profile.portfolioUrl && !textInput.value) {
        setNativeValue(textInput, profile.portfolioUrl);
        fieldsFilled++;
        details['Portfolio'] = profile.portfolioUrl;
      }
    }

    // Work Authorization Selects
    if (select) {
      if (/authorized to work|legal.*authoriz/i.test(label)) {
        const isAuthorized = profile.workAuthorization !== 'NEED_SPONSORSHIP';
        const changed = setNativeSelect(select, (t, v) =>
          isAuthorized ? /yes|authorized/i.test(t) || /yes/i.test(v) : /no|not authorized/i.test(t)
        );
        if (changed) {
          fieldsFilled++;
          details['Work Authorized'] = isAuthorized ? 'Yes' : 'No';
        }
      } else if (/sponsorship|sponsor/i.test(label)) {
        const needsSponsorship = profile.requiresSponsorship;
        const changed = setNativeSelect(select, (t, v) =>
          needsSponsorship ? /yes/i.test(t) || /yes/i.test(v) : /no/i.test(t) || /no/i.test(v)
        );
        if (changed) {
          fieldsFilled++;
          details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
        }
      }
    }

    // Work authorization radios in Greenhouse
    if (/authorized to work|legal.*authoriz/i.test(label)) {
      const isAuthorized = profile.workAuthorization !== 'NEED_SPONSORSHIP';
      if (checkMatchingRadio(field, isAuthorized ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Work Authorized'] = isAuthorized ? 'Yes' : 'No';
      }
    } else if (/sponsorship|sponsor/i.test(label)) {
      const needsSponsorship = profile.requiresSponsorship;
      if (checkMatchingRadio(field, needsSponsorship ? /^yes/i : /^no/i)) {
        fieldsFilled++;
        details['Requires Sponsorship'] = needsSponsorship ? 'Yes' : 'No';
      }
    }
  });

  return {
    success: fieldsFilled > 0,
    fieldsFilled,
    atsType: 'greenhouse',
    message: fieldsFilled > 0
      ? `Autofilled ${fieldsFilled} fields in Greenhouse application!`
      : 'No compatible Greenhouse form fields found on this page.',
    details,
  };
}
