import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

import { isAllowedOrigin, sanitizeApplication, sanitizeProfile, handleExternal } from '../src/lib/bridge';
import { parseFilters } from '../src/lib/ai';

describe('External bridge', () => {
  it('only accepts origins matching the manifest patterns', () => {
    const prod = ['https://careeragent.fyi/*', 'https://*.careeragent.fyi/*'];
    assert.strictEqual(isAllowedOrigin('https://careeragent.fyi', prod), true);
    assert.strictEqual(isAllowedOrigin('https://jobs.careeragent.fyi', prod), true);
    assert.strictEqual(isAllowedOrigin('https://evil.example', prod), false);
    assert.strictEqual(isAllowedOrigin('https://careeragent.fyi.evil.example', prod), false);
    assert.strictEqual(isAllowedOrigin('http://careeragent.fyi', prod), false);
    assert.strictEqual(isAllowedOrigin('http://localhost:5174', prod), false);
    assert.strictEqual(isAllowedOrigin(undefined, prod), false);

    const dev = [...prod, 'http://localhost/*'];
    assert.strictEqual(isAllowedOrigin('http://localhost:5174', dev), true);
    assert.strictEqual(isAllowedOrigin('https://localhost:5174', dev), false);
    assert.strictEqual(isAllowedOrigin('http://evil.example', dev), false);

    // Without a chrome runtime (tests) the fallback is the production list.
    assert.strictEqual(isAllowedOrigin('https://careeragent.fyi'), true);
    assert.strictEqual(isAllowedOrigin('http://localhost:5174'), false);
  });

  it('rejects unknown actions and malformed payloads', async () => {
    await assert.rejects(handleExternal({ action: 'dump_settings' } as any), /Unknown action/);
    await assert.rejects(handleExternal({ action: 'parse_resume_for_filters', payload: { fileData: 'not base64 !!' } }), /base64/);
    await assert.rejects(handleExternal({ action: 'delete_application', payload: {} }), /id is required/);
  });

  it('never exposes settings through get_state', async () => {
    const state = (await handleExternal({ action: 'get_state' })) as Record<string, unknown>;
    assert.deepStrictEqual(Object.keys(state).sort(), ['applications', 'profile']);
  });

  it('clamps and validates application records', () => {
    const app = sanitizeApplication({
      id: 'app_1',
      title: 'Engineer',
      company: 'Acme',
      url: 'https://acme.example/jobs/1',
      status: 'BOGUS',
      notes: 'x'.repeat(10_000),
      __proto__: { polluted: true },
    });
    assert.strictEqual(app.status, 'APPLIED');
    assert.strictEqual(app.notes!.length, 5000);
    assert.strictEqual((app as any).polluted, undefined);
    assert.throws(() => sanitizeApplication({ id: 'x', title: 't', company: 'c', url: 'javascript:alert(1)' }), /http/);
    assert.throws(() => sanitizeApplication({ title: 't', company: 'c' }), /required/);
  });

  it('keeps rich profile fields but drops unknown work-auth values', () => {
    const p = sanitizeProfile({ firstName: 'Sarah', workAuthorization: 'MARTIAN', skills: ['Go', 42, 'Rust'] });
    assert.strictEqual(p.workAuthorization, 'OTHER');
    assert.deepStrictEqual(p.skills, ['Go', 'Rust']);
  });
});

describe('Resume filter parsing', () => {
  it('accepts fenced JSON and array values', () => {
    const f = parseFilters('```json\n{"roles": ["SRE", "Platform Engineer"], "keywords": "Go, k8s", "excludes": "", "location": "Remote"}\n```');
    assert.strictEqual(f.roles, 'SRE, Platform Engineer');
    assert.strictEqual(f.location, 'Remote');
  });

  it('throws instead of inventing defaults', () => {
    assert.throws(() => parseFilters('Sorry, I cannot help with that.'), /JSON/);
    assert.throws(() => parseFilters('{"foo": "bar"}'), /roles or keywords/);
  });
});

describe('Content scripts stay out of storage', () => {
  it('never import storage.ts (API keys live only in background/popup contexts)', () => {
    for (const file of ['entrypoints/content.ts', 'src/lib/inline/index.ts', 'src/lib/autofill/index.ts', 'src/lib/extractors/index.ts']) {
      const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
      assert.ok(!/from ['"][^'"]*storage['"]/.test(src), `${file} imports storage`);
    }
  });
});
