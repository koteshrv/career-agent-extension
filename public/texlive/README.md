# Bundled TeX Live subset

Files the in-browser pdfTeX (public/latex) needs to typeset the resume template in src/lib/latex/template.ts, laid out the
way the engine looks them up: `pdftex/<kpathsea format number>/<file name>` (3 = TFM metrics, 10 = format, 11 = font map,
26 = TeX input files, 32 = Type 1 fonts, 44 = encodings). Served from the extension itself, so compiling needs no network.

- `pdftex/10/swiftlatexpdftex.fmt` was dumped by the engine from this latex.ltx; rebuild it if latex.ltx changes.
- Fonts: the complete Computer Modern Type 1 set (AMS BlueSky) for OT1; a cm-super subset (rm, bx, ti, bi, sl, tt, cc,
  ss, sx at 8-24.88pt) with all EC/TC metrics for T1 and TS1; AMS symbols, marvosym and Font Awesome 5; and the font
  packages lato, sourcesanspro, raleway (T1/TS1/OT1, lining figures), charter, helvet and times (URW Nimbus).
- Packages beyond the template's: geometry, xcolor, multicol, parskip, setspace, ragged2e, textcomp, booktabs, graphicx,
  lastpage, longtable, calc, ifthen, changepage, xstring, paracol, microtype, amsmath, amssymb, babel (english), inputenc.
  A user's own .tex resume compiles when it stays within this set; anything else fails with "File X not found" in the log.
- `pdftex/11/pdftex.map` is trimmed to the bundled fonts.

Regenerate with the harness in the project notes: a local kpsewhich-backed server records every file a compile fetches.
