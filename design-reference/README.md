# design-reference

Static HTML prototypes (final designs, 13th Oct) used as visual and behavioral reference for the React implementation.

**This folder is not part of the application and must never be included in the production build.**

## Contents

| Folder | Description |
|---|---|
| `ui-prototypes/Group/` | Group Insurance prototypes (DVT Informal, GUW Formal, GUW Informal) |
| `ui-prototypes/Retail/` | Retail Insurance prototypes (Claim Audit, CUW, CVT, IT Task, MAS, MMT Grievance, PIVV, Pre issuance CUW/CVT, Ref Screens, SUW/Reinstatement, reinsurer screen) |
| `ui-prototypes/search-application/` | Read-only search application prototypes |

## Why it is excluded from the build

- It sits at the repository root, outside `src/` and `public/`. Vite bundles only modules reachable from the app entry point and copies only `public/`, so nothing here is emitted into `dist/`.
- Do not import from, link to, or copy files from this folder into `src/` or `public/`. Re-implement screens as React components using shared UI components.

## Required exclusions when the React project is scaffolded

Keep this folder out of every tool that scans the repository:

| Tool | Setting |
|---|---|
| TypeScript (`tsconfig.json`) | `"include": ["src"]` and `"exclude": ["design-reference", "dist", "node_modules"]` |
| ESLint | add `design-reference/` to `ignores` (flat config) or `.eslintignore` |
| Prettier | add `design-reference/` to `.prettierignore` |
| Vitest | `test.exclude` / coverage `exclude` includes `design-reference/**` |
| Playwright | no tests reference this folder |
| Docker / CI artifacts | add `design-reference/` to `.dockerignore`; do not package it in release artifacts |
| SAST / secret / dependency scans | exclude or scope scans to `src/` to avoid noise from prototype code |

## Notes

- Prototypes are standalone HTML and may contain inline scripts, sample data, and external references. They are reference material only and are not subject to the production security standards in `docs/spec/`.
- Large binary assets (for example `Login-Image.svg`, about 7 MB) are included. Consider Git LFS or keeping this folder out of the main repository if size becomes a concern.
