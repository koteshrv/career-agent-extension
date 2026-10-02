import type { CandidateProfile } from '../../types';
import { escapeLatex, type TailoredResume } from '../ai/playbooks';

/**
 * Renders latex.md's JSON into the resume template body (the preamble is in template.ts). Every string passes
 * through escapeLatex, so the model never writes LaTeX; dates and schools come from the profile, not the model.
 */
export function renderResumeBody(profile: CandidateProfile, t: TailoredResume): string {
  const e = escapeLatex;
  const name = `${profile.firstName} ${profile.lastName}`.trim() || 'Candidate';
  const contact: string[] = [];
  if (profile.phone) contact.push(e(profile.phone));
  if (profile.email) contact.push(`\\href{mailto:${profile.email}}{${e(profile.email)}}`);
  if (profile.linkedinUrl) contact.push(`\\href{${profile.linkedinUrl}}{${e(profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''))}}`);
  if (profile.githubUrl) contact.push(`\\href{${profile.githubUrl}}{${e(profile.githubUrl.replace(/^https?:\/\/(www\.)?/, ''))}}`);
  if (profile.location) contact.push(e(profile.location));

  const out: string[] = [];
  out.push('\\begin{center}');
  out.push(`  \\textbf{\\Huge \\scshape ${e(name)}} \\\\ \\vspace{1pt}`);
  if (contact.length) out.push(`  \\small ${contact.join(' $|$ ')}`);
  out.push('\\end{center}');

  if (t.tailored_summary) {
    out.push('', '\\section{Summary}', e(t.tailored_summary));
  }

  if (t.tailored_experience.length) {
    out.push('', '\\section{Experience}', '\\resumeSubHeadingListStart');
    for (const role of t.tailored_experience) {
      const src = (profile.experiences ?? []).find((x) => x.company.trim().toLowerCase() === role.company.trim().toLowerCase() || x.role.trim().toLowerCase() === role.title.trim().toLowerCase());
      const dates = src ? `${src.startDate || ''}${src.current ? ' -- Present' : src.endDate ? ` -- ${src.endDate}` : ''}`.trim() : '';
      out.push(`  \\resumeSubheading{${e(role.title || src?.role || '')}}{${e(dates)}}{${e(role.company || src?.company || '')}}{}`);
      if (role.bullets.length) {
        out.push('  \\resumeItemListStart');
        for (const b of role.bullets) out.push(`    \\resumeItem{${e(b)}}`);
        out.push('  \\resumeItemListEnd');
      }
    }
    out.push('\\resumeSubHeadingListEnd');
  }

  if (t.tailored_skills.length) {
    out.push('', '\\section{Skills}', '\\begin{itemize}[leftmargin=0.15in, label={}]', `  \\small{\\item{${e(t.tailored_skills.join(', '))}}}`, '\\end{itemize}');
  }

  const edu = profile.education ?? [];
  if (edu.length) {
    out.push('', '\\section{Education}', '\\resumeSubHeadingListStart');
    for (const d of edu) out.push(`  \\resumeSubheading{${e(d.institution)}}{${e(d.graduationYear || '')}}{${e([d.degree, d.fieldOfStudy].filter(Boolean).join(' '))}}{}`);
    out.push('\\resumeSubHeadingListEnd');
  }
  return out.join('\n');
}
