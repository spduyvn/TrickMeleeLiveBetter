# CLAUDE.md

## Project scope

- Sống Tốt Hơn is a Vietnamese knowledge website: the source documents in `sources/` may inform topic selection, but the project is not a verbatim translation. Content should be independently edited and localized with reliable Vietnam-relevant evidence.
- Prioritize verified Vietnamese law, health guidance, public services, prices, policies and local data. Do not guess or mechanically replace country-specific facts. Explicitly label international evidence with location, population, year, source and transferability limits.
- Preserve original source documents; do not replace, delete or redistribute them without explicit direction.

## Architecture and commands

- Static-first site built from semantic HTML, CSS and vanilla JS in `src/`; structured JSON content in `content/`; Node scripts in `scripts/` produce `dist/` and serve it for local preview.
- No external npm dependencies, backend, database or third-party API. Requires Node.js 20+.
- Commands: `npm run build`, `npm run preview`; GitHub Pages subpath build: `BASE_PATH=/repository-name npm run build` (PowerShell: `$env:BASE_PATH='/repository-name'; npm run build`).
- Before deployment replace sample canonical/sitemap/robots domain `example.github.io/song-tot-hon` with the actual site URL. No automated Pages workflow is configured yet.

## Content and quality

- Categories: `content/categories/categories.json`; article records: `content/articles/*.json`; shared source catalog: `content/sources/sources.json`.
- Read `docs/CONTENT_SCHEMA.md`, `docs/EDITORIAL_RULES.md`, `docs/SOURCE_POLICY.md`, `docs/EVIDENCE_GRADING.md`, and `docs/CONTRIBUTING.md` before editing content.
- Demo data must be visibly marked DEMO and remain `draft`. Never invent citations, statistics or local legal/medical guidance. Do not mark content `verified` without actual source checks and review.
- Preserve any existing uncommitted user work. Current legacy root files may contain previously translated content; the new static site is built from `src/` and `content/` rather than replacing/deleting that legacy work.
- No automated test, lint or browser suite exists. Run the documented build, then verify navigation, search/filter, responsive layout, browser console and GitHub Pages subpath when applicable.
