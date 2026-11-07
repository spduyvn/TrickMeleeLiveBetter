# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project scope

- The README identifies this repository as **TrickMeleeLiveBetter**, a Vietnamese adaptation of `高性价比人生指南`; the local Chinese PDF/HTML and upstream [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) are source materials. The upstream book text is CC BY 4.0; attribute the source and mark changes when adapting it.
- The project goal, as specified by the repository owner, is a Vietnamese version adapted to Vietnamese laws and culture, presented as an easy-to-use website and kept lightweight for Vercel deployment.

## Current state and commands

- The repository has a README, two Chinese source documents in `sources/`, three project skills under `.claude/skills/`, a static HTML/CSS site, and a Markdown translation in `content/`. It has no dependency manifest, build system, test suite, or lint configuration.
- The site can be previewed locally by opening `index.html` in a browser. For Vercel, use the repository root, the **Other** framework preset, no build command, and `.` as the output directory; this is a plain static site.
- No build, lint, or test commands are defined. Do not assume a framework or invent commands. Document verified commands here if tooling is added.

## Architecture and workflow

- `index.html` is the sole page and contains Vietnamese translations of the Chinese source HTML's introduction and 34-topic table of contents, plus Vietnam-localized entries 1–10 of chapter 1 and entries 1–20 of chapter 2. Separate Markdown files are kept in `content/01-phong-tranh-rui-ro-som.md` and `content/02-dung-chet-tu-tu.md`. Other recommendations are not yet translated locally; source chapter files are available from the upstream GitHub repository.
- `styles.css` provides the responsive reading layout, light palette and SVG/CSS bronze-drum-inspired decoration. The only client-side JavaScript is the small in-page search and navigation behavior in `index.html`; no libraries, build step, or backend are used. Inter is used for body text and Roboto for headings; both load from Google Fonts.
- `sources/` contains the original PDF and HTML. Preserve these as source material. The upstream [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) repository contains the README and `book/` chapter files referenced by the local HTML; use it to retrieve source passages when needed, identifying the exact chapter file and checking the original before translation. The site is a Vietnam-localized edition: replace China-specific law, policies, benefits, services, emergency contacts, prices/currency, statistics, and procedures with current Vietnamese equivalents only after verification. Never mechanically convert CNY or substitute guessed Vietnamese laws/numbers. Where Vietnam-specific data is scarce, international research may be used if its location, population, year, source, and limitations are explicit; do not present it as Vietnam-specific or use it alone for Vietnamese legal, public-service, or locally applicable clinical guidance. If no reliable local equivalent is found, mark it pending research or omit actionable detail. Follow `.claude/skills/translate/SKILL.md` and `.claude/skills/research-vn/SKILL.md`.
- `.claude/skills/translate/SKILL.md` guides faithful Chinese-to-Vietnamese translation and keeps adaptations distinct from source meaning. `.claude/skills/research-vn/SKILL.md` covers verifying Vietnam-specific legal, regulatory, and cultural context. `.claude/skills/dev/SKILL.md` describes implementation constraints. Use the relevant skill for the task.
