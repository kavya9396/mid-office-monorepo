# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack

pnpm 10.15.0 + Turborepo monorepo. Three independent React 18 / Vite / TypeScript SPAs
(`apps/common`, `apps/retail`, `apps/group`) plus four shared workspace packages.
MUI v6 + Emotion for UI. React Hook Form + Zod v4 for forms. No test framework currently present.

## Commands

```bash
# Dev — all three apps (required for auth; sessionStorage is origin-scoped)
pnpm dev                                        # gateway: http://localhost:5183

# Dev — single app (auth flow broken in isolation)
pnpm dev:common | dev:retail | dev:group

# Typecheck (only static check; run before every commit)
pnpm typecheck
pnpm --filter @insurance-poc/<pkg> typecheck    # common | retail | group | ui | routes | utils

# Build
pnpm build
pnpm --filter @insurance-poc/<pkg> build

# Verify all three apps produce independent dist artifacts
pnpm verify:deployments

# Production preview (requires pnpm build first)
pnpm preview                                    # http://localhost:8080
```

**There are no lint or test scripts.** `pnpm typecheck` is the only automated check.

## Workspace Package Names

| Import path | Source folder | Contents |
|---|---|---|
| `@insurance-poc/ui` | `packages/ui` | MUI wrappers, icons, theme |
| `@insurance-poc/routes` | `packages/routes` | Route constants, URL helpers, dev-config |
| `@insurance-poc/utils` | `packages/utils` | Session helpers, `formatIndianCurrency`, `RegexPatterns` |
| `@insurance-poc/common/auth` | `apps/common` (subpath export) | `loginService.ts` — used by Retail/Group guards |
| `@insurance-poc/common/detail-card` | `apps/common` (subpath export) | `DetailCard` component |

**Never import across package boundaries via relative paths.** Relative paths break independent builds.

## Architecture: Independent multi-SPA + shared `sessionStorage`

- All three apps must run under one browser origin (`localhost:5183`). Common's Vite server proxies `/retail` and `/group`.
- Never access Retail/Group directly on ports `5184`/`5185` — different origin = broken session.
- App-to-app navigation uses `window.location.assign` / `replaceUrl()` (full-page load), NOT React Router.
- Ports and base paths are centralized in `packages/routes/src/dev-config.json` — change them only there.

## Package exports point at raw `.ts` source

No compile step for packages — Vite in each app transpiles them. `packages/ui`, `packages/routes`, `packages/utils` have no `build` script.

## Session / Auth

- All session access goes through helpers in `packages/utils/src/session.ts`. Never touch `sessionStorage` directly.
- `clearToken()` removes all four keys (`token`, `userId`, `displayName`, `businessType`).
- `hasSession()` only checks token presence — no JWT signature validation.
- Retail/Group each re-call `authorizeBusiness()` from `@insurance-poc/common/auth` on mount via `RequireSession`.
- Mock users: `UW001` (Retail), `UW002` (Group), `UW003` (both). Password only checks non-empty.

## Mock data

Services wrap JSON from `mock/` with a `wait(ms)` helper. Screens never import mock JSON directly.
`mock/` is a Turbo `globalDependency` — any change invalidates the cache for all three apps.

## UI / Styling

- **All styling via MUI `sx` prop.** No CSS files, no CSS modules.
- Theme: `packages/ui/src/theme.ts` — primary `#E45F14` (brand orange), font `Mulish`, bg `#fff8f3`.
- Custom MUI wrappers in `packages/ui` are prefixed `Custom` (e.g. `CustomButton`, `CustomDialog`, `CustomTable`). Use these; do not use bare MUI primitives in app code.
- When implementing from a prototype, copy `sx` values verbatim. Only `#e45f14` → `theme.palette.primary.main` is substituted.

## Design Tokens (from prototypes / `docs/spec/screens/00-shared-layout.md`)

| Token | Value |
|---|---|
| Header gradient | `linear-gradient(to bottom, #f58220 0%, #e65318 42%, #c92e27 72%, #98252b 100%)` |
| Brand orange | `#e45f14` → `theme.palette.primary.main` |
| Brand maroon | `#9a2529` (sidebar active, secondary actions) |
| DRS page bg | `#fff8f3` |
| Landing page bg | `#f0f3f8` |
| Banner strip bg | `#ffead7` |
| Header height | `57px` |
| Sidebar expanded | `220px` / collapsed `60px` |

## Screen / Prototype Reference

Design prototypes live in `design-reference/ui-prototypes/` (never imported into builds).
Spec files with component trees, APIs, and routing are in `docs/spec/screens/`.
Workstreams: Retail (CUW, Pre-Issuance CUW, CVT, Pre-Issuance CVT, SUW Reinstatement,
MAS, PIVV, IT Task, MMT Grievance, Claim Audit, Ref Screens, Reinsurer) and Group
(DVT Informal, GUW Formal, GUW Informal) and Search Application.

## Skills available

- **`implement-screen`** — step-by-step for converting a prototype into a React screen.
- **`add-shared-component`** — authoring rules for `packages/ui` and `apps/common` components.
- **`add-feature-module`** — scaffolding a new workstream in `apps/retail` or `apps/group`.

## TypeScript config

`tsconfig.base.json`: strict, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, `moduleResolution: "bundler"`. No path aliases — use workspace package names.

## Forms

Zod v4 schemas + React Hook Form with `@hookform/resolvers`. Schemas co-located with their form module.

## Docker

Each app has its own Dockerfile. **Build context must be the repo root** — apps import files outside their directory.
