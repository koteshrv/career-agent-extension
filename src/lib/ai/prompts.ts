// The career-ops playbooks, bundled verbatim (see prompts/README.md). Loaded on first use so modules that import
// this file still load under Node's test runner, which cannot resolve Vite's `?raw` imports.
import { wrapTriage } from './playbooks';

export interface Playbooks {
  latex: string;
  cover: string;
  email: string;
  triage: string;
}

let cache: Playbooks | null = null;

export async function getPlaybooks(): Promise<Playbooks> {
  if (cache) return cache;
  const [latex, cover, email, triage] = await Promise.all([
    import('../../../prompts/latex.md?raw'),
    import('../../../prompts/cover.md?raw'),
    import('../../../prompts/email.md?raw'),
    import('../../../prompts/triage.md?raw'),
  ]);
  cache = { latex: latex.default, cover: cover.default, email: email.default, triage: wrapTriage(triage.default) };
  return cache;
}
