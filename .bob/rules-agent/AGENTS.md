# AGENTS.md — Agent (Code) Mode

This file provides guidance to agents when working with code in this repository.

## Non-obvious coding rules

### Package / import rules

- **No build step for packages.** `packages/ui`, `packages/routes`, `packages/utils` export raw `.ts`
  source files. Vite in each consuming app transpiles them. Never add build scripts or reference `dist/` paths.
- **Workspace package names only.** Relative paths across package boundaries (`../../packages/ui/src/…`)
  break independent builds. Always use `@insurance-poc/ui`, `@insurance-poc/utils`, etc.
- **`@insurance-poc/common/auth` is a subpath export.** Declared in `apps/common/package.json` `exports`.
  Retail and Group import via `@insurance-poc/common/auth`, not `@insurance-poc/common`.
- **New `apps/common` entry point** must be added to `exports` in `apps/common/package.json`
  with `types`, `import`, and `default` all pointing at the `.tsx` source file.

### Styling

- **All styling via MUI `sx` prop.** No CSS files, CSS modules, or `styled()`. No exceptions.
- **Prototype colours are copied verbatim** into `sx`. Only `#e45f14` → `theme.palette.primary.main`
  is substituted. Do not approximate or swap for other theme tokens.
- **Prototypes are large bundled files.** Use `grep` to find the target section, then `read_file` with
  a small line range (±150 lines). Never dump the whole file into context.
- **`packages/ui/src` holds all the components to use.** Check `packages/ui/src/index.ts` before
  writing new MUI markup. Use the existing `Custom*` wrappers (`CustomButton`, `CustomDialog`,
  `CustomTable`, `CustomTabs`, `CustomTextField`, `CustomSelect`, `CustomSnackbar`, `KeyValueTable`,
  etc.). No bare MUI `Table*`, `Select`, `MenuItem`, `TextField`, `Paper`, `Dialog`, `Button` in app
  code — use `CustomBox` / `CustomTypography` for layout. Dropdown → `CustomSelect options=[…]`; grid →
  `CustomTable columns data` (inputs via column `render`).
- **Name collision check required** before adding any new export. `CustomButton`,
  `RequirementBadgeVariant`, `BadgeVariant`, `LegacyBadgeVariant` are already taken.

### Session and auth

- **`clearToken()` clears all four session keys** (`token`, `userId`, `displayName`, `businessType`).
  Never call `sessionStorage.removeItem` directly — stale keys break auth guards.
- **Cross-SPA navigation is `replaceUrl()` / `assignUrl()`** from `@insurance-poc/routes`.
  Never use `<Link>` or `navigate()` to move between the three SPAs — these are full-page loads.
- **`authorizeBusiness()` always comes from `@insurance-poc/common/auth`**, not a relative import.

### Mock and services

- **Services wrap mock JSON with `wait(ms)`.** Screens never import from `mock/` directly.
- **Return `null` for "not found"** — screens must render an explicit "not found" state.
  Never default to the first record.
- **`applicationNo` / `schemeId` comes from `useSearchParams()`**, not from route params.

### Screen structure

- **DRS outer shell:** sticky `AppHeader` (57 px, `z-index: 100`) + `<main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>`.
  `ApplicantBanner` is sticky inside `<main>` at `top: 0; z-index: 20`.
  `DecisionFooter` (when present) is sticky at `bottom: 0` inside `<main>`.
- **Landing outer shell:** `AppHeader` + flex row with collapsible `Sidebar` (220 px / 60 px) + scrollable `<main>`.
- **Sidebar collapse state** is stored in `sessionStorage` (see prototype pattern).

### TypeScript

- **`noUnusedLocals` and `noUnusedParameters` are errors**, not warnings. Unused imports fail typecheck.
- **`Readonly<Props>`** on all shared component signatures (`function Foo({ ... }: Readonly<FooProps>)`).
- No `any`. No unsafe `as` casts. No non-null assertions without guards.

### Routing and ports

- **Port and base-path changes go only in `packages/routes/src/dev-config.json`.**
  Every Vite config and the preview gateway (`scripts/serve-gateway.mjs`) read from this file.
- **New path constants belong in `packages/routes/src/index.ts`**. Never hardcode URLs in app files.

### Docker

- **Build context must be the repo root:** `docker build -f apps/<app>/Dockerfile .`
  Apps reference workspace packages and `mock/` from outside their directory.

### Definition of done (every task)

1. Run `pnpm --filter @insurance-poc/<app> typecheck` and fix every error.
2. Confirm: no relative cross-package imports, no bare MUI imports, no direct `mock/` JSON imports in screens.
3. Report: files created/modified, typecheck result, anything blocked.
