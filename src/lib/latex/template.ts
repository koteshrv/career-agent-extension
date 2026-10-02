/**
 * The resume document: one fixed preamble (Jake Gutierrez's single-column layout, MIT) and a body the AI writes
 * with the macros below. Keeping the preamble here means the model never controls packages or fonts.
 */
export const RESUME_MACROS = `\\resumeSubheading{Title}{Dates}{Company}{Location}
\\resumeSubHeadingListStart ... \\resumeSubHeadingListEnd (wraps subheadings)
\\resumeItemListStart \\resumeItem{bullet text} ... \\resumeItemListEnd (bullets under a subheading)
\\resumeProjectHeading{\\textbf{Name} $|$ \\emph{Stack}}{Dates}
\\section{Experience} etc. for section titles`;

export const RESUME_PREAMBLE = String.raw`\documentclass[letterpaper,10.5pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx}
\input{glyphtounicode}
% Text symbols that the kernel otherwise takes from TS1 (cm-super, not bundled): draw them from OT1 Computer Modern.
\DeclareTextCommandDefault{\textdollar}{{\upshape\fontencoding{OT1}\fontfamily{cmr}\selectfont\char36}}
\DeclareTextCommandDefault{\textsterling}{{\itshape\fontencoding{OT1}\fontfamily{cmr}\selectfont\char36}}
\DeclareTextCommandDefault{\textbullet}{\ensuremath{\bullet}}
\DeclareTextCommandDefault{\textperiodcentered}{\ensuremath{\cdot}}
\DeclareTextCommandDefault{\textasciitilde}{\ensuremath{\sim}}
\DeclareTextCommandDefault{\textregistered}{\ensuremath{^{\circledR}}}
\DeclareTextCommandDefault{\texttrademark}{\ensuremath{^{\mathrm{TM}}}}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.55in}
\addtolength{\evensidemargin}{-0.55in}
\addtolength{\textwidth}{1.1in}
\addtolength{\topmargin}{-.6in}
\addtolength{\textheight}{1.2in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]
\pdfgentounicode=1
\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{\vspace{-2pt}\item\begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}\textbf{#1} & #2 \\ \textit{\small#3} & \textit{\small #4} \\\end{tabular*}\vspace{-7pt}}
\newcommand{\resumeProjectHeading}[2]{\item\begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}\small#1 & #2 \\\end{tabular*}\vspace{-7pt}}
\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
`;

const FORBIDDEN = /\\(write18|openout|openin|input|include|usepackage|documentclass|RequirePackage|catcode|csname|def\b|let\b)/g;

/** Keeps only what belongs between \begin{document} and \end{document}, and drops anything that reaches outside the page. */
export function resumeBodyFromModel(raw: string): string {
  let body = raw.replace(/^```(?:latex|tex)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = body.indexOf('\\begin{document}');
  const end = body.lastIndexOf('\\end{document}');
  if (start !== -1) body = body.slice(start + '\\begin{document}'.length, end === -1 ? undefined : end);
  return body.replace(FORBIDDEN, '').trim();
}

export function wrapResume(body: string): string {
  return `${RESUME_PREAMBLE}\n\\begin{document}\n${body}\n\\end{document}\n`;
}

/** True when the text is already a complete document we assembled (or the user edited) rather than a bare body. */
export function isFullDocument(tex: string): boolean {
  return tex.includes('\\documentclass') && tex.includes('\\begin{document}');
}
