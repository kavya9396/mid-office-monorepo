# AGENTS.md — Plan Mode

This file provides guidance to agents when working with code in this repository.

## Non-obvious architectural constraints

- **`sessionStorage` coupling is the binding constraint.** The multi-SPA design only works when all
  three apps are served from one browser origin. Any architecture that exposes apps on separate origins
  (different domains or ports in production) must replace `sessionStorage` with SSO or a server-managed
  session. This is a known POC limitation documented in `README.md` and `docs/spec/06-security.md`.

- **Three independent SPAs, not a monolith.** Common, Retail, and Group are separate React trees, each
  with their own `BrowserRouter`, build, and `dist/` output. Cross-SPA navigation is
  `window.location.assign/replace` (full-page load). Plans that rely on shared React state, React context,
  or in-memory caches between apps will not work.

- **Three-layer ownership model.**
  | Layer | Package | Rule |
  |---|---|---|
  | Generic UI primitives | `packages/ui` | No insurance domain knowledge; must not import from apps |
  | Shared business components | `apps/common` | Data via props only; no API calls inside components |
  | Page layout + data | `apps/retail`, `apps/group` | Compose shared pieces; own services and routes |
  | Routes / ports config | `packages/routes` | Single source of truth for all ports and base paths |

- **Independent build is a first-class requirement.** `pnpm verify:deployments` builds each app in
  isolation. Relative imports that cross package boundaries silently work in dev but break isolated builds.

- **Turbo pipeline: `build` depends on `^typecheck`.** A new package must have a `typecheck` script
  or the Turbo DAG cannot traverse it.

- **No shared global state.** There is no Redux, Zustand, or cross-app React Context. Plans for cross-feature
  state must stay within one app and use `useState`/`useReducer`. `sessionStorage` is the only
  cross-SPA persistence mechanism today. (Spec recommends TanStack Query for server state — not yet implemented.)

- **Mock data invalidates the entire Turbo cache.** `mock/` is declared as a `globalDependency` in
  `turbo.json`. Any change to a mock JSON file invalidates the build cache for all three apps.
  Keep mocks stable; do not edit shared records for one-off test scenarios.

- **Auth re-verification is per-app, not global.** `apps/common` is the authoritative auth entry point.
  Each business app's `RequireSession` guard independently re-calls `authorizeBusiness()` on mount.
  Plans that centralise or remove per-app re-verification must also account for the spec's requirement
  (`docs/spec/06-security.md`) that frontend auth checks be backed by server authorization.

- **Target spec vs current codebase gap.** The following items are described in `docs/spec/` but are
  **not yet implemented** in the codebase. Any plan that depends on them must scaffold them first:
  - `@axiom/*` packages (spec naming); current codebase uses `@insurance-poc/*`
  - TanStack Query (current: `useEffect` + `useState`)
  - Axios / central HTTP client (`core/api/http-client.ts`)
  - Vitest + React Testing Library + Playwright (no tests exist)
  - ESLint / Prettier (no lint config)
  - RBAC permission constants (`core/auth/permissions.ts`)
  - PII masking (`@axiom/crypto`)
  - MSW for API mocking

- **Screen implementation scope.** 134 HTML prototypes exist across 16 workstreams (see
  `docs/spec/screens/context-ingestion-manifest.md`). Currently only Common login + `DetailCard` and
  basic Retail/Group inbox + DRS shells are implemented. The screen specs in `docs/spec/screens/`
  are the implementation contracts for the remaining work.

- **DRS sticky layout is a hard constraint.** Breaking the layered sticky positioning causes overlapping
  elements. The contract from `docs/spec/screens/00-shared-layout.md`:
  - Header: `position: sticky; top: 0; z-index: 100; height: 57px`
  - `<main>`: `height: calc(100dvh - 57px); overflow-y: auto`
  - Applicant banner: `position: sticky; top: 0; z-index: 20` inside `<main>`
  - Decision footer: `position: sticky; bottom: 0` inside `<main>`
