import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumeBodyFromModel, wrapResume, isFullDocument, RESUME_PREAMBLE } from '../src/lib/latex/template';

test('model output is reduced to a body: fences, preamble and document wrapper stripped', () => {
  const raw = '```latex\n\\documentclass{article}\\usepackage{evil}\n\\begin{document}\n\\section{Summary}\nHi\n\\end{document}\n```';
  assert.equal(resumeBodyFromModel(raw), '\\section{Summary}\nHi');
});

test('commands that reach outside the page are removed from the body', () => {
  const body = resumeBodyFromModel('\\section{X}\\write18{rm -rf /}\\input{secret}\\def\\x{1} ok');
  assert.ok(!/\\write18|\\input|\\def\b/.test(body), body);
  assert.ok(body.includes('\\section{X}'));
});

test('wrapResume produces one complete document on the fixed preamble', () => {
  const tex = wrapResume('\\section{Summary}\nHi');
  assert.ok(tex.startsWith(RESUME_PREAMBLE));
  assert.ok(tex.includes('\\begin{document}\n\\section{Summary}\nHi\n\\end{document}'));
  assert.ok(isFullDocument(tex));
  assert.ok(!isFullDocument('\\section{Summary}'));
});
