---
name: dev
description: Implement and maintain this repository's lightweight Vietnamese content website and tooling.
---

# Develop this project

Use this skill for implementation and maintenance work in this repository.

## Repository-specific constraints

- The project goal is a Vietnamese adaptation of the Chinese source document for an easy-to-use web experience, with a lightweight deployment target on Vercel.
- Inspect the current repository, `CLAUDE.md`, README, and actual manifests/configuration before choosing or assuming a framework, commands, architecture, or deployment behavior. The repository may evolve; keep guidance grounded in what exists.
- Prefer a static, content-first implementation and avoid adding dependencies, client-side JavaScript, services, or infrastructure unless a concrete user-facing need justifies them. Do not add a backend or dynamic Vercel functions by default.
- Keep source translation, editorial adaptations, and Vietnam-specific research distinguishable. Publish only Vietnam-localized laws, currencies/prices, public services, emergency contacts, policies, and jurisdiction-dependent facts after verification; do not mechanically convert CNY or swap Chinese rules/numbers for guessed Vietnamese equivalents. Where Vietnam-specific data is scarce, international studies/statistics may be used with location, population, year, source, and limitations clearly stated; never frame them as Vietnam-specific or use them alone for local legal, public-service, or clinical guidance. Mark unavailable local facts as pending research instead of presenting source-country guidance as locally applicable. Consult the `translate` and `research-vn` skills as appropriate.
- Keep the original source document intact. Do not replace, delete, or redistribute source material without explicit direction.

## Implementation workflow

1. Trace how content becomes a user-visible page through the existing files and configuration before making architectural changes.
2. Follow the existing framework, conventions, scripts, and deployment configuration when present; avoid introducing a second system for the same concern.
3. For a new feature, favor accessible semantic HTML, responsive layouts, and progressive enhancement so core reading works without client-side JavaScript.
4. Run only commands that are defined by the repository's manifests or documentation. Report what was run and any checks that could not be performed.
5. When implementation adds or changes actual scripts, architecture, or deployment setup, update `CLAUDE.md` to match the verified repository state rather than preserving obsolete assumptions.
