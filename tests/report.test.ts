import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { setNativeValue } from '../src/lib/autofill/helpers';
import { buildFillReport, clearMarks } from '../src/lib/autofill/report';

const html = `<form>
  <label for="fn">First name</label><input id="fn" required>
  <label for="em">Email</label><input id="em" type="email" required>
  <label for="cv">Resume</label><input id="cv" type="file" required>
  <label for="why">Why us?</label><textarea id="why" required></textarea>
  <label for="opt">Website</label><input id="opt">
</form>`;

test('the report lists what was set and which required fields are still empty', () => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  Object.assign(globalThis, { HTMLInputElement: dom.window.HTMLInputElement, HTMLTextAreaElement: dom.window.HTMLTextAreaElement, HTMLSelectElement: dom.window.HTMLSelectElement, HTMLElement: dom.window.HTMLElement });
  setNativeValue(doc.getElementById('fn') as HTMLInputElement, 'Priya');
  const r = buildFillReport(doc);
  assert.deepEqual(r.filled, [{ label: 'First name', value: 'Priya' }]);
  assert.deepEqual(r.empty, ['Email', 'Resume', 'Why us?']);
  assert.ok(doc.getElementById('fn')!.hasAttribute('data-careeragent-filled'));
  assert.ok(doc.getElementById('em')!.hasAttribute('data-careeragent-attention'));
  clearMarks(doc);
  assert.equal(doc.querySelectorAll('[data-careeragent-filled], [data-careeragent-attention]').length, 0);
});
