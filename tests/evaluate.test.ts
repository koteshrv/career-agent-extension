import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvaluations, buildEvaluatePrompt } from '../src/lib/ai/evaluate';

test('parseEvaluations reads fenced JSON, keeps known ids, derives verdicts and clamps scores', () => {
  const raw = '```json\n{"evaluations":[{"id":"a","score":4.26,"verdict":"pass","reason":"fits","matches":["Go"],"gaps":[]},{"id":"zzz","score":5},{"id":"b","score":9,"reason":"x"},{"id":"c","score":2.9}]}\n```';
  const out = parseEvaluations(raw, ['a', 'b', 'c']);
  assert.deepEqual(out.map((e) => [e.id, e.score, e.verdict]), [['a', 4.3, 'PASS'], ['b', 5, 'PASS'], ['c', 2.9, 'FAIL']]);
});

test('parseEvaluations returns nothing for prose without JSON', () => {
  assert.deepEqual(parseEvaluations('Sorry, I cannot do that.', ['a']), []);
});

test('the prompt quotes each posting as data with its id and caps the description', () => {
  const p = buildEvaluatePrompt('Name: X', [{ id: 'j1', title: 'T', company: 'C', description: 'd'.repeat(5000) }]);
  assert.ok(p.includes('<posting id="j1"'));
  assert.ok(p.length < 5000);
});
