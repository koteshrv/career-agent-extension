import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeContext, wrapTriage, parseTailoredResume, escapeLatex, OVERRIDE_HEADER } from '../src/lib/ai/playbooks';
import { renderResumeBody } from '../src/lib/latex/render';
import { wrapResume } from '../src/lib/latex/template';

test('context is laid out like the career-agent backend: job first, candidate second', () => {
  const c = composeContext({ title: 'T', company: 'C', description: 'D' }, 'Name: X');
  assert.ok(c.indexOf('# TARGET JOB DETAILS') < c.indexOf('**Company:** C') && c.indexOf('**Company:** C') < c.indexOf('# CANDIDATE CONTEXT') && c.includes('Name: X'));
});

test('triage is wrapped with the override header and a multi-posting schema', () => {
  const w = wrapTriage('# Mode: triage');
  assert.ok(w.startsWith(OVERRIDE_HEADER) && w.includes('"evaluations"') && w.includes('# Mode: triage'));
});

test('latex.md JSON renders to escaped template macros with dates from the profile', () => {
  const t = parseTailoredResume('{"tailored_summary":"Builds 100% reliable APIs & ledgers","tailored_experience":[{"company":"Stripe","title":"Senior Engineer","bullets":["Cut p99 by 40%","Owned C# services"]}],"tailored_skills":["Go","C++"],"changes_made":["reordered"]}');
  assert.ok(t);
  const body = renderResumeBody({ firstName: 'Priya', lastName: 'Raman', email: 'p@x.io', experiences: [{ id: 'e1', role: 'Senior Engineer', company: 'Stripe', startDate: '2021', endDate: '', current: true, description: '' }], education: [{ id: 'd1', institution: 'UT', degree: 'BS', fieldOfStudy: 'CS', graduationYear: '2017' }] } as never, t!);
  assert.ok(body.includes('\\resumeSubheading{Senior Engineer}{2021 -- Present}{Stripe}{}'));
  assert.ok(body.includes('\\resumeItem{Cut p99 by 40\\%}') && body.includes('C\\#') && body.includes('100\\% reliable APIs \\& ledgers'));
  assert.ok(body.includes('\\resumeSubheading{UT}{2017}{BS CS}{}'));
  assert.ok(wrapResume(body).includes('\\begin{document}'));
});

test('escapeLatex neutralises every special character and keeps markdown bold as textbf', () => {
  assert.equal(escapeLatex('a_b & 5% #1 {x} ~ ^ \\ **big**'), 'a\\_b \\& 5\\% \\#1 \\{x\\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{} \\textbf{big}');
});
