// The career-ops playbooks, bundled verbatim (see prompts/README.md).
import latexMd from '../../../prompts/latex.md?raw';
import coverMd from '../../../prompts/cover.md?raw';
import emailMd from '../../../prompts/email.md?raw';
import triageMd from '../../../prompts/triage.md?raw';
import { wrapTriage } from './playbooks';

export const PLAYBOOKS = {
  latex: latexMd,
  cover: coverMd,
  email: emailMd,
  triage: wrapTriage(triageMd),
} as const;
