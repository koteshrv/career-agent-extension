import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

import { CandidateProfile } from '../src/types';
import { extractGreenhouse } from '../src/lib/extractors/greenhouse';
import { extractLever } from '../src/lib/extractors/lever';
import { extractAshby } from '../src/lib/extractors/ashby';
import { extractLinkedIn } from '../src/lib/extractors/linkedin';
import { autofillGreenhouse } from '../src/lib/autofill/greenhouse';
import { autofillLever } from '../src/lib/autofill/lever';
import { autofillAshby } from '../src/lib/autofill/ashby';
import { calculateFollowUpDate } from '../src/lib/storage';

const testProfile: CandidateProfile = {
  firstName: 'Sarah',
  lastName: 'Connor',
  email: 'sarah.connor@example.com',
  phone: '4155552671',
  location: 'San Francisco, CA',
  linkedinUrl: 'https://linkedin.com/in/sarah-connor',
  githubUrl: 'https://github.com/sarah-connor',
  portfolioUrl: 'https://sarahconnor.dev',
  workAuthorization: 'US_CITIZEN',
  requiresSponsorship: false,
};

describe('Greenhouse Extractor & Autofill Engine', () => {
  it('correctly extracts Greenhouse job details from DOM', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="header">
            <h1 class="app-title">Staff Distributed Systems Engineer</h1>
            <span class="company-name">at Stripe</span>
            <div class="location">San Francisco, CA (Hybrid)</div>
          </div>
          <div id="app_body"></div>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://boards.greenhouse.io/stripe/jobs/4982734' });
    const job = extractGreenhouse(dom.window.location.href, dom.window.document);

    assert.ok(job);
    assert.strictEqual(job.title, 'Staff Distributed Systems Engineer');
    assert.strictEqual(job.company, 'Stripe');
    assert.strictEqual(job.location, 'San Francisco, CA (Hybrid)');
    assert.strictEqual(job.atsType, 'greenhouse');
  });

  it('correctly autofills Greenhouse application form fields', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <form id="application_form">
            <input id="first_name" name="job_application[first_name]" type="text" />
            <input id="last_name" name="job_application[last_name]" type="text" />
            <input id="email" name="job_application[email]" type="email" />
            <input id="phone" name="job_application[phone]" type="tel" />
            <input id="job_application_location" name="job_application[location]" type="text" />
            <div class="field">
              <label>LinkedIn Profile URL</label>
              <input type="text" />
            </div>
            <div class="field">
              <label>GitHub Profile</label>
              <input type="text" />
            </div>
            <div class="field">
              <label>Personal Website or Portfolio</label>
              <input type="text" />
            </div>
            <div class="field">
              <label>Are you legally authorized to work in the United States?</label>
              <select>
                <option value="">-- Select --</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </form>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://boards.greenhouse.io/stripe/jobs/4982734' });
    const doc = dom.window.document;

    const result = autofillGreenhouse(testProfile, doc);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.atsType, 'greenhouse');
    assert.ok(result.fieldsFilled >= 8);

    assert.strictEqual((doc.querySelector('#first_name') as HTMLInputElement).value, 'Sarah');
    assert.strictEqual((doc.querySelector('#last_name') as HTMLInputElement).value, 'Connor');
    assert.strictEqual((doc.querySelector('#email') as HTMLInputElement).value, 'sarah.connor@example.com');
    assert.strictEqual((doc.querySelector('#phone') as HTMLInputElement).value, '4155552671');
    assert.strictEqual((doc.querySelector('#job_application_location') as HTMLInputElement).value, 'San Francisco, CA');
  });
});

describe('Lever Extractor & Autofill Engine', () => {
  it('correctly extracts Lever job details from DOM', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="main-header-logo">
            <img src="/logo.png" alt="Figma logo" />
          </div>
          <div class="posting-headline">
            <h2>Product Designer, Systems</h2>
          </div>
          <div class="posting-categories">
            <div class="location">New York, NY / Remote</div>
          </div>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://jobs.lever.co/figma/11223344' });
    const job = extractLever(dom.window.location.href, dom.window.document);

    assert.ok(job);
    assert.strictEqual(job.title, 'Product Designer, Systems');
    assert.strictEqual(job.company, 'Figma');
    assert.strictEqual(job.location, 'New York, NY / Remote');
    assert.strictEqual(job.atsType, 'lever');
  });

  it('correctly autofills Lever application form', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <form id="application-form">
            <input name="name" type="text" />
            <input name="email" type="email" />
            <input name="phone" type="tel" />
            <input name="urls[LinkedIn]" type="text" />
            <input name="urls[GitHub]" type="text" />
            <input name="urls[Portfolio]" type="text" />
            <ul class="application-questions">
              <li class="application-question">
                <div class="application-label">Are you authorized to work in the United States?</div>
                <label><input type="radio" name="cards[work_auth]" value="yes" /> Yes</label>
                <label><input type="radio" name="cards[work_auth]" value="no" /> No</label>
              </li>
            </ul>
          </form>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://jobs.lever.co/figma/11223344' });
    const doc = dom.window.document;

    const result = autofillLever(testProfile, doc);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.atsType, 'lever');
    assert.ok(result.fieldsFilled >= 6);

    assert.strictEqual((doc.querySelector('input[name="name"]') as HTMLInputElement).value, 'Sarah Connor');
    assert.strictEqual((doc.querySelector('input[name="email"]') as HTMLInputElement).value, 'sarah.connor@example.com');
    assert.strictEqual((doc.querySelector('input[name="phone"]') as HTMLInputElement).value, '4155552671');
    assert.strictEqual((doc.querySelector('input[name="urls[LinkedIn]"]') as HTMLInputElement).value, 'https://linkedin.com/in/sarah-connor');
    assert.strictEqual((doc.querySelector('input[name="urls[GitHub]"]') as HTMLInputElement).value, 'https://github.com/sarah-connor');
  });
});

describe('Ashby Extractor & Autofill Engine', () => {
  it('correctly extracts Ashby job details from DOM', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <header>
            <img src="/logo.png" alt="Ramp logo" data-qa="company-logo" />
            <h1 data-qa="job-title">Senior Full Stack Engineer</h1>
            <div data-qa="job-location">Miami, FL</div>
          </header>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://jobs.ashbyhq.com/ramp/87a93f4e-28b3-4612' });
    const job = extractAshby(dom.window.location.href, dom.window.document);

    assert.ok(job);
    assert.strictEqual(job.title, 'Senior Full Stack Engineer');
    assert.strictEqual(job.company, 'Ramp');
    assert.strictEqual(job.location, 'Miami, FL');
    assert.strictEqual(job.atsType, 'ashby');
  });

  it('correctly autofills Ashby application form', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <form>
            <input name="name" type="text" />
            <input name="email" type="email" />
            <input name="phoneNumber" type="tel" />
            <input name="location" type="text" />
            <input name="_systemfield_linkedin_url" placeholder="https://linkedin.com/in/..." type="text" />
            <input name="_systemfield_github_url" placeholder="https://github.com/..." type="text" />
            <input name="_systemfield_website_url" placeholder="https://..." type="text" />
          </form>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://jobs.ashbyhq.com/ramp/87a93f4e-28b3-4612' });
    const doc = dom.window.document;

    const result = autofillAshby(testProfile, doc);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.atsType, 'ashby');
    assert.ok(result.fieldsFilled >= 7);

    assert.strictEqual((doc.querySelector('input[name="name"]') as HTMLInputElement).value, 'Sarah Connor');
    assert.strictEqual((doc.querySelector('input[name="email"]') as HTMLInputElement).value, 'sarah.connor@example.com');
    assert.strictEqual((doc.querySelector('input[name="phoneNumber"]') as HTMLInputElement).value, '4155552671');
    assert.strictEqual((doc.querySelector('input[name="location"]') as HTMLInputElement).value, 'San Francisco, CA');
  });
});

describe('LinkedIn Job Extractor', () => {
  it('correctly extracts job details from LinkedIn job view DOM', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="jobs-unified-top-card">
            <h1 class="job-details-jobs-unified-top-card__job-title">Principal Cloud Architect</h1>
            <div class="job-details-jobs-unified-top-card__company-name">
              <a href="/company/google">Google</a>
            </div>
            <span class="job-details-jobs-unified-top-card__bullet">Sunnyvale, CA (On-site)</span>
          </div>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://www.linkedin.com/jobs/view/3829102941/' });
    const job = extractLinkedIn(dom.window.location.href, dom.window.document);

    assert.ok(job);
    assert.strictEqual(job.title, 'Principal Cloud Architect');
    assert.strictEqual(job.company, 'Google');
    assert.strictEqual(job.location, 'Sunnyvale, CA (On-site)');
    assert.strictEqual(job.atsType, 'linkedin');
  });
});

describe('Follow-up Date Calculation', () => {
  it('calculates follow-up date 3 days in the future', () => {
    const futureDateStr = calculateFollowUpDate(3);
    const futureDate = new Date(futureDateStr);
    const now = new Date();

    const diffDays = Math.round((futureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 3);
  });
});
