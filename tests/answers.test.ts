import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { normalizeQuestion, findSavedAnswer } from '../src/lib/answers';
import { fillSavedAnswers, matchSkills } from '../src/lib/autofill/extras';

const answers = {
  [normalizeQuestion('Why do you want to work at Datadog?')]: { question: 'Why do you want to work at Datadog?', answer: 'Because observability.', updatedAt: '2026-10-01T00:00:00Z' },
  [normalizeQuestion('Describe a project you are proud of.')]: { question: 'Describe a project you are proud of.', answer: 'The ledger.', updatedAt: '2026-10-01T00:00:00Z' },
};

describe('Saved answers', () => {
  it('normalizes punctuation and case', () => {
    assert.strictEqual(normalizeQuestion('  Why DO you want to work at Datadog?! '), 'why do you want to work at datadog');
  });
  it('matches exactly and by word overlap, never loosely', () => {
    assert.strictEqual(findSavedAnswer(answers, 'why do you want to work at datadog')?.answer, 'Because observability.');
    assert.strictEqual(findSavedAnswer(answers, 'Describe a project you are proud of (optional)')?.answer, 'The ledger.');
    assert.strictEqual(findSavedAnswer(answers, 'What is your expected salary?'), null);
    assert.strictEqual(findSavedAnswer(answers, 'Why?'), null);
  });
  it('fills empty textareas whose question has a saved answer', () => {
    const dom = new JSDOM(`<form>
      <label for="q1">Why do you want to work at Datadog?</label><textarea id="q1"></textarea>
      <label for="q2">Tell us about your salary expectations</label><textarea id="q2"></textarea>
      <label for="q3">Describe a project you are proud of.</label><textarea id="q3">already written</textarea>
    </form>`, { url: 'https://boards.greenhouse.io/x/jobs/1' });
    const filled = fillSavedAnswers(dom.window.document, answers);
    assert.deepStrictEqual(filled, ['Why do you want to work at Datadog?']);
    assert.strictEqual((dom.window.document.getElementById('q1') as HTMLTextAreaElement).value, 'Because observability.');
    assert.strictEqual((dom.window.document.getElementById('q2') as HTMLTextAreaElement).value, '');
    assert.strictEqual((dom.window.document.getElementById('q3') as HTMLTextAreaElement).value, 'already written');
  });
});

describe('Skills match', () => {
  it('reports which skills the page mentions, with word boundaries', () => {
    const dom = new JSDOM(`<body><p>We use Go, PostgreSQL and C++ at scale. Golang experience welcome.</p></body>`);
    const r = matchSkills(dom.window.document, ['Go', 'PostgreSQL', 'C++', 'Rust', 'Kubernetes']);
    assert.deepStrictEqual(r.matched, ['Go', 'PostgreSQL', 'C++']);
    assert.deepStrictEqual(r.missing, ['Rust', 'Kubernetes']);
  });
});
