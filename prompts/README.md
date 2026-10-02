# Playbooks

Verbatim copies of the career-ops mode prompts from `career-agent/prompts` (upstream: career-ops.org). The extension
sends a playbook as the system prompt and appends the target job and candidate context the same way the career-agent
backend does (`backend/routers/playbooks.py`), then parses the JSON the `[OUTPUT SCHEMA]` footer demands.

| File | Used for |
|---|---|
| `latex.md` | Tailored resume: the JSON is rendered into the LaTeX template in `src/lib/latex/template.ts` |
| `cover.md` | Cover letter |
| `email.md` | Cold email |
| `triage.md` | Batch evaluation on For you (wrapped with the same override header and a multi-posting schema, see `src/lib/ai/playbooks.ts`) |

Update by copying the files again; do not edit them here.
