# Bundled TeX Live subset

Files the in-browser pdfTeX (public/latex) needs to typeset the resume template in src/lib/latex/template.ts, laid out the
way the engine looks them up: `pdftex/<kpathsea format number>/<file name>` (3 = TFM metrics, 10 = format, 11 = font map,
26 = TeX input files, 32 = Type 1 fonts, 44 = encodings). Served from the extension itself, so compiling needs no network.

- `pdftex/10/swiftlatexpdftex.fmt` was dumped by the engine from this latex.ltx; rebuild it if latex.ltx changes.
- Fonts are the complete Computer Modern Type 1 set (AMS BlueSky, public domain), OT1 encoding only.
- `pdftex/11/pdftex.map` is trimmed to those fonts.

Regenerate with the harness in the project notes: a local kpsewhich-backed server records every file a compile fetches.
