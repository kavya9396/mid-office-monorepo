# Monorepo Folder Structure

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## Overview

This is a **pnpm + Turborepo TypeScript monorepo** containing **three independently deployable
React SPAs** (`common`, `retail`, `group`) and **three shared workspace packages**
(`@insurance-poc/ui`, `@insurance-poc/routes`, `@insurance-poc/utils`).

```
mid-office-monorepo/
├── apps/
│   ├── common/                        # @insurance-poc/common — Login gateway & shared business components
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── vite-env.d.ts
│   │   │   ├── assets/                # IBM Logo.svg, ICICI_Logo.svg, ICICI_Logo_BG.svg, Login-Image.svg
│   │   │   ├── components/            # Shared business components (exported via subpaths)
│   │   │   │   ├── AppHeader.tsx      # AppHeader (exported as @insurance-poc/common/app-header)
│   │   │   │   ├── DvtSectionViewer.tsx # DvtSectionViewer (exported as @insurance-poc/common/dvt-section-viewer)
│   │   │   │   ├── DvtReportPage.tsx  # DvtReportPage type="medical|financial" (exported as @insurance-poc/common/dvt-report-page)
│   │   │   │   ├── DecisionBar.tsx    # DecisionBar, DecisionComparisonTable
│   │   │   │   ├── DetailCard.tsx
│   │   │   │   ├── PreviousPolicy.tsx # PreviousPolicy, PreviousPolicyDialog
│   │   │   │   ├── QuickLinks.tsx
│   │   │   │   └── LifeAssured/
│   │   │   │       ├── LifeAssured.tsx
│   │   │   │       ├── ProfileImage.tsx
│   │   │   │       └── Applicant Profile/   # Contact & Address, Fields, Image Details,
│   │   │   │                                #   Lifestyle, Nominee, Personal & KYC, Product Details
│   │   │   ├── modules/
│   │   │   │   └── login/
│   │   │   │       ├── LoginPage.tsx
│   │   │   │       └── loginSchema.ts # Zod schema co-located with its form
│   │   │   ├── routes/
│   │   │   │   ├── AppRoutes.tsx
│   │   │   │   └── guards.tsx         # RedirectIfSession guard
│   │   │   └── services/
│   │   │       ├── jwtService.ts      # Mock JWT fetch
│   │   │       ├── loginService.ts    # Mock auth (exported as @insurance-poc/common/auth)
│   │   │       └── dvtReportService.ts # DVT report data service (BFF placeholder; used by DvtSectionViewer)
│   │   ├── Dockerfile
│   │   ├── index.html
│   │   ├── package.json               # exports map: ./auth, ./app-header, ./dvt-section-viewer, ./dvt-report-page,
│   │   │                              #   ./decision-bar, ./detail-card, ./quick-links, ./previous-policy, ./life-assured (+ 2 stale, see §1)
│   │   ├── tsconfig.json
│   │   └── vite.config.ts             # Dev gateway — proxies /retail and /group
│   │
│   ├── retail/                        # @insurance-poc/retail — Retail underwriting SPA
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── vite-env.d.ts
│   │   │   ├── modules/
│   │   │   │   ├── drs/
│   │   │   │   │   └── RetailDrsPage.tsx
│   │   │   │   ├── inbox/
│   │   │   │   │   └── RetailInboxPage.tsx
│   │   │   │   ├── mas/
│   │   │   │   │   ├── MasDrsPage.tsx             # MAS DRS shell: AppHeader + empty <main> (route /mas/drs; opened from Inbox MAS_TASK)
│   │   │   │   │   ├── MASAuditTrailPage.tsx
│   │   │   │   │   ├── MASMedicalReportPage.tsx  # thin wrapper → DvtReportPage type="medical"
│   │   │   │   │   └── MASFinancialReportPage.tsx # thin wrapper → DvtReportPage type="financial"
│   │   │   │   └── previousPolicy/
│   │   │   │       └── RetailPreviousPolicyPage.tsx
│   │   │   ├── routes/
│   │   │   │   ├── AppRoutes.tsx
│   │   │   │   ├── RequireSession.tsx # Re-verifies RETAIL authorization on mount
│   │   │   │   └── RetailAppLayout.tsx
│   │   │   └── services/
│   │   │       ├── drsService.ts
│   │   │       ├── inboxService.ts
│   │   │       └── masAuditTrailService.ts
│   │   ├── Dockerfile
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts             # Served at /retail/ via Common gateway
│   │
│   └── group/                         # @insurance-poc/group — Group underwriting SPA
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── vite-env.d.ts
│       │   ├── modules/
│       │   │   ├── drs/
│       │   │   │   ├── DvtUser.tsx
│       │   │   │   └── lifeAssuredData.ts
│       │   │   ├── inbox/
│       │   │   │   └── GroupInboxPage.tsx
│       │   │   └── previousPolicy/
│       │   │       └── GroupPreviousPolicyPage.tsx
│       │   ├── routes/
│       │   │   ├── AppRoutes.tsx
│       │   │   ├── GroupAppLayout.tsx
│       │   │   └── RequireSession.tsx # Re-verifies GROUP authorization on mount
│       │   └── services/
│       │       ├── drsService.ts
│       │       └── inboxService.ts
│       ├── Dockerfile
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts             # Served at /group/ via Common gateway
│
├── packages/
│   ├── ui/                            # @insurance-poc/ui — MUI component wrappers & theme
│   │   ├── src/
│   │   │   ├── index.ts               # Public barrel — all exports go here
│   │   │   ├── theme.ts               # MUI theme: primary #E45F14, font Mulish
│   │   │   ├── Accordion/
│   │   │   │   └── Accordion.tsx      # CustomAccordion
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.tsx          # Badge, BadgeVariant, LegacyBadgeVariant, RequirementBadgeVariant
│   │   │   │   └── BadgeWithCount.tsx
│   │   │   ├── Button/
│   │   │   │   └── Button.tsx         # CustomButton
│   │   │   ├── Calendar/
│   │   │   │   └── Calendar.tsx       # Calendar (uses @mui/x-date-pickers + dayjs)
│   │   │   ├── Checkbox/
│   │   │   │   └── Checkbox.tsx       # CustomCheckbox
│   │   │   ├── Dialog/
│   │   │   │   └── Dialog.tsx         # CustomDialog
│   │   │   ├── icons/
│   │   │   │   └── Icons.tsx          # All SVG icons — proxy here, never import @mui/icons-material directly
│   │   │   ├── KeyValueTable/
│   │   │   │   └── KeyValueTable.tsx  # KeyValueTable, KeyValueRow
│   │   │   ├── Radio/
│   │   │   │   └── Radio.tsx          # CustomRadioGroup
│   │   │   ├── SearchBar/
│   │   │   │   └── SearchBar.tsx      # SearchBar
│   │   │   ├── Select/
│   │   │   │   ├── CustomApiAutocomplete.tsx
│   │   │   │   ├── CustomSearchSelect.tsx
│   │   │   │   ├── MultiSelect.tsx    # CustomMultiSelect
│   │   │   │   └── Select.tsx         # CustomSelect
│   │   │   ├── SnackBar/
│   │   │   │   └── Snackbar.tsx       # CustomSnackbar
│   │   │   ├── Table/
│   │   │   │   └── Table.tsx          # CustomTable, Column
│   │   │   ├── Tabs/
│   │   │   │   └── Tabs.tsx           # CustomTabs, TabItem
│   │   │   ├── TextField/
│   │   │   │   └── TextField.tsx      # CustomTextField
│   │   │   └── Tooltip/
│   │   │       └── Tooltip.tsx        # CustomTooltip
│   │   ├── package.json               # exports: "." → src/index.ts (no build step)
│   │   └── tsconfig.json
│   │
│   ├── routes/                        # @insurance-poc/routes — Route constants & URL helpers
│   │   ├── src/
│   │   │   ├── dev-config.json        # Single source of truth: ports, base paths, host
│   │   │   └── index.ts               # commonPaths, retailPaths, groupPaths, businessInboxUrl,
│   │   │                              #   drsUrl, previousPolicyUrl, replaceUrl, assignUrl, appBasename
│   │   ├── package.json               # exports: "." → src/index.ts (no build step)
│   │   └── tsconfig.json
│   │
│   └── utils/                         # @insurance-poc/utils — Stateless shared helpers
│       ├── src/
│       │   ├── index.ts               # Public barrel
│       │   ├── session.ts             # getToken/setToken/clearToken/hasSession/getSessionUser/
│       │   │                          #   setSessionUser/getSessionBusinessType/setSessionBusinessType
│       │   ├── formatIndianCurrency.ts # formatIndianCurrency(value) → "₹ 1,23,456"
│       │   └── regexPatterns.ts       # RegexPatterns.alphanumeric
│       ├── package.json               # exports: "." → src/index.ts (no build step)
│       └── tsconfig.json
│
├── mock/                              # Local JSON mocks — Turbo globalDependency
│   ├── auth/
│   │   ├── jwt.json                   # Mock JWT token payload
│   │   └── login.json                 # Mock users: UW001 (Retail), UW002 (Group), UW003 (both)
│   ├── drs/
│   │   ├── retail-drs.json            # Retail DRS records keyed by applicationNo
│   │   └── group-drs.json             # Group DRS records keyed by applicationNo
│   └── inbox/
│       └── inbox.json                 # Inbox tasks, poolData by category; businessType filters per app
│
├── scripts/                           # Node.js ESM utility scripts
│   ├── dev-config.mjs                 # Re-exports devConfig and monorepoRoot for vite.config.ts files
│   ├── serve-gateway.mjs              # Production preview gateway (pnpm preview)
│   └── verify-independent-builds.mjs # Builds each app separately; reports pass/fail per artifact
│
├── design-reference/                  # UI source of truth — never imported into the app build
│   └── ui-prototypes/
│       ├── Retail/                    # CUW, Pre issuance CUW, CVT, Pre issuance CVT, SUW/Reinstatement,
│       │                              #   MAS, PIVV, IT Task, MMT Grievance, Claim Audit, Ref Screens,
│       │                              #   Reinsurer
│       ├── Group/                     # DVT Informal, GUW Formal, GUW Informal
│       └── search-application/        # Search Application (read-only cross-line)
│
├── docs/
│   └── spec/                          # Architecture spec & screen contracts
│       ├── README.md
│       ├── 01-overview-principles-stack.md
│       ├── 02-folder-structure.md     # (this file)
│       ├── 03-business-lines.md
│       ├── 04-components.md
│       ├── 05-api-integration.md
│       ├── 06-security.md
│       ├── 07-config-state-forms-routing.md
│       ├── 08-coding-standards.md
│       ├── 09-testing-and-delivery.md
│       ├── 10-accessibility-performance.md
│       ├── 11-definition-of-done-governance.md
│       └── screens/                   # Per-screen specs (component tree, routes, API shapes)
│           ├── README.md
│           ├── 00-shared-layout.md    # AppHeader, Sidebar, ApplicantBanner, design tokens
│           ├── context-ingestion-manifest.md
│           ├── shared-login.md
│           ├── retail-cuw.md
│           ├── retail-pre-issuance-cuw.md
│           ├── retail-cvt.md
│           ├── retail-pre-issuance-cvt.md
│           ├── retail-suw-reinstatement.md
│           ├── retail-mas.md
│           ├── retail-pivv.md
│           ├── retail-it-task.md
│           ├── retail-mmt-grievance.md
│           ├── retail-claim-audit.md
│           ├── retail-ref-screens.md
│           ├── retail-reinsurer.md
│           ├── group-dvt-informal.md
│           ├── group-guw-formal.md
│           ├── group-guw-informal.md
│           └── search-application.md
│
├── .bob/                              # Bob AI assistant configuration
│   ├── commands/                      # annotate.md spec.md build.md build-like.md check.md inventory.md pipeline.md (interactive orchestrator)
│   ├── rules/                         # 01-spec-rules.md — annotation schema, design tokens, template
│   ├── rules-agent/AGENTS.md          # Non-obvious coding rules (Agent/Code mode)
│   ├── rules-ask/AGENTS.md            # Documentation context (Ask mode)
│   ├── rules-code/01-react-rules.md   # Full React/TS coding rules
│   ├── rules-plan/AGENTS.md           # Architectural constraints (Plan mode)
│   ├── skills/                        # annotate/ build/ build-like/ check/ inventory/ spec/
│   │                                  #   + add-feature-module.md, add-shared-component.md, implement-screen.md
│   └── custom_modes.yaml              # senior-ui-architect mode definition
│
├── .dockerignore
├── .gitignore
├── .npmrc
├── AGENTS.md                          # Repo-wide guidance for agents
├── README.md
├── package.json                       # Root: pnpm@10.15.0, turbo scripts, devDependencies
├── pnpm-lock.yaml
├── pnpm-workspace.yaml                # Workspace globs: apps/*, packages/*
├── tsconfig.base.json                 # Shared TS config: strict, noUnusedLocals, moduleResolution:bundler
└── turbo.json                         # Pipeline: build → ^typecheck; dev (no cache); globalDependencies: mock/**
```

---

## 1. The Three Deployable Applications (`apps/*`)

### `apps/common` — Login Gateway & Shared Business Components (`@insurance-poc/common`)

- **Role**: The only entry point for authentication. After login it performs a full-page navigation
  to `/retail/inbox` or `/group/inbox`.
- **Dev gateway**: Its Vite server proxies `/retail` → port `5184` and `/group` → port `5185`,
  so all three apps share one browser origin (`localhost:5183`) and one `sessionStorage` bucket.
- **Public exports** (declared in `package.json` `exports` map):

  | Subpath | Source file | Contents |
  |---|---|---|
  | `@insurance-poc/common/auth` | `src/services/loginService.ts` | `fetchLogin`, `authorizeBusiness`, `AuthenticatedUser`, `BusinessType` |
  | `@insurance-poc/common/app-header` | `src/components/AppHeader.tsx` | `AppHeader`, `AppHeaderProps`, `ProfileMenuItem` |
  | `@insurance-poc/common/dvt-section-viewer` | `src/components/DvtSectionViewer.tsx` | `DvtSectionViewer`, `DvtSectionViewerProps` |
  | `@insurance-poc/common/dvt-report-page` | `src/components/DvtReportPage.tsx` | `DvtReportPage`, `DvtReportPageProps` |
  | `@insurance-poc/common/detail-card` | `src/components/DetailCard.tsx` | `DetailCard`, `DetailCardProps`, `DetailAttribute`, `DetailTable` |
  | `@insurance-poc/common/decision-bar` | `src/components/DecisionBar.tsx` | `DecisionBar`, `DecisionComparisonTable`, `DecisionBarItem`, `DecisionBarProps`, `ComparisonRow` |
  | `@insurance-poc/common/quick-links` | `src/components/QuickLinks.tsx` | `QuickLinks`, `QuickLinkItem`, `QuickLinksProps` |
  | `@insurance-poc/common/previous-policy` | `src/components/PreviousPolicy.tsx` | `PreviousPolicy`, `PreviousPolicyDialog`, `PreviousPolicyProps` |
  | `@insurance-poc/common/life-assured` | `src/components/LifeAssured/LifeAssured.tsx` | `LifeAssured`, `LifeAssuredApplicant`, `LifeAssuredProps`, `FieldData`, `ImageDetailRecord`, `NomineeRow`, `AppointeeRow` |

  > **Stale exports:** `./applicant-profile` (`src/components/ApplicantProfile.tsx`) and
  > `./profile-fields` (`src/components/ProfileFields.tsx`) are declared in `package.json` but the
  > target files do not exist (superseded by `LifeAssured/`). Remove them or restore the files.

- **Workstreams owned**: Login, shared business components (decision bar, quick links, previous
  policy, life assured).

### `apps/retail` — Retail Underwriting SPA (`@insurance-poc/retail`)

- **Role**: Retail inbox and DRS screens. Mounted at `/retail/` via the Common dev gateway.
- **Business line**: `RETAIL` — serves only tasks with `businessType === "RETAIL"`.
- **Session guard**: `RequireSession.tsx` re-calls `authorizeBusiness(userId, "RETAIL")` on every
  mount. Unauthorized users are redirected to Common login or their authorized business.
- **Workstreams to implement**: CUW, Pre-Issuance CUW, CVT, Pre-Issuance CVT, SUW Reinstatement,
  MAS, PIVV, IT Task, MMT Grievance, Claim Audit, Ref Screens, Reinsurer.

### `apps/group` — Group Underwriting SPA (`@insurance-poc/group`)

- **Role**: Group inbox and DRS screens. Mounted at `/group/` via the Common dev gateway.
- **Business line**: `GROUP` — serves only tasks with `businessType === "GROUP"`.
- **Session guard**: `RequireSession.tsx` re-calls `authorizeBusiness(userId, "GROUP")` on every
  mount.
- **Workstreams to implement**: DVT Informal, GUW Formal, GUW Informal.

---

## 2. Shared Packages (`packages/*`)

All packages export their TypeScript source directly — there is **no compile step** for packages.
Vite in each consuming app transpiles them at build time.

### `@insurance-poc/ui` — MUI Component Library

Wraps MUI v6 + Emotion. All components are exported from `packages/ui/src/index.ts`.

| Export name | Source file | Description |
|---|---|---|
| `appTheme` | `theme.ts` | MUI theme: primary `#E45F14`, font `Mulish`, bg `#fff8f3` |
| `CustomButton` | `Button/Button.tsx` | MUI Button wrapper |
| `CustomDialog` | `Dialog/Dialog.tsx` | MUI Dialog wrapper |
| `CustomTable`, `Column` | `Table/Table.tsx` | Generic data table |
| `CustomTabs`, `TabItem` | `Tabs/Tabs.tsx` | MUI Tabs wrapper |
| `CustomTextField` | `TextField/TextField.tsx` | MUI TextField wrapper |
| `CustomSelect` | `Select/Select.tsx` | MUI Select wrapper |
| `CustomMultiSelect` | `Select/MultiSelect.tsx` | Multi-select dropdown |
| `CustomSearchSelect`, `SearchSelectOption` | `Select/CustomSearchSelect.tsx` | Search-enabled select |
| `CustomApiAutocomplete`, `ApiAutocompleteOption` | `Select/CustomApiAutocomplete.tsx` | API-driven autocomplete |
| `CustomCheckbox` | `Checkbox/Checkbox.tsx` | MUI Checkbox wrapper |
| `CustomRadioGroup` | `Radio/Radio.tsx` | MUI RadioGroup wrapper |
| `CustomSnackbar` | `SnackBar/Snackbar.tsx` | Toast notification |
| `CustomTooltip` | `Tooltip/Tooltip.tsx` | MUI Tooltip wrapper |
| `CustomAccordion` | `Accordion/Accordion.tsx` | MUI Accordion wrapper |
| `KeyValueTable`, `KeyValueRow` | `KeyValueTable/KeyValueTable.tsx` | Label–value pairs table |
| `Badge`, `BadgeVariant`, `LegacyBadgeVariant`, `RequirementBadgeVariant` | `Badge/Badge.tsx` | Status badge |
| `BadgeWithCount` | `Badge/BadgeWithCount.tsx` | Badge with numeric counter |
| `SearchBar` | `SearchBar/SearchBar.tsx` | Search input |
| `Calendar`, `CalendarProps` | `Calendar/Calendar.tsx` | Date picker (MUI x-date-pickers + dayjs) |
| `CloseIcon`, `KeyDownArrowIcon`, `KeyLeftArrowIcon`, `KeyRightArrowIcon`, `LinkIcon`, `LogoutIcon`, `RefreshIcon`, `UserProfileIcon`, `EyeIcon`, `EyeSlashIcon` | `icons/Icons.tsx` | SVG icons |
| `colors` | `theme.ts` | Shared colour token map |

### `@insurance-poc/routes` — Route Constants & URL Helpers

Single source of truth for all ports, base paths, and cross-SPA navigation.

| Export | Description |
|---|---|
| `dev-config.json` | `host`, `ports` (common: 5183, retail: 5184, group: 5185), `viteBase`, `previewPort` (8080) |
| `commonPaths` | `{ home: "/", login: "/login" }` |
| `retailPaths` | `{ root, inbox, drs, masDrs, previousPolicy }` |
| `groupPaths` | `{ root, inbox, drs, previousPolicy }` |
| `businessInboxUrl(businessType)` | Returns inbox URL for `"RETAIL"` or `"GROUP"` |
| `drsUrl(businessType, applicationNo)` | Returns DRS URL with `?applicationNo=` query param |
| `previousPolicyUrl(businessType, applicationNo)` | Returns previous-policy URL with `?applicationNo=` query param |
| `replaceUrl(url)` | `window.location.replace(url)` — use for cross-SPA navigation |
| `assignUrl(url)` | `window.location.assign(url)` — use for cross-SPA navigation |
| `appBasename(base)` | Strips trailing slash for React Router basename |

> **To change ports or base paths:** edit only `packages/routes/src/dev-config.json`.
> Vite configs, the preview gateway (`scripts/serve-gateway.mjs`), and this package all read from it.

### `@insurance-poc/utils` — Stateless Shared Helpers

| Export | Description |
|---|---|
| `getToken() / setToken(token) / clearToken()` | JWT token in `sessionStorage` — `clearToken()` removes all 4 keys |
| `hasSession()` | `true` if a non-empty token string exists — does NOT validate signature |
| `getSessionUser() / setSessionUser(user)` | `{ userId, displayName }` in `sessionStorage` |
| `getSessionBusinessType() / setSessionBusinessType(type)` | `"RETAIL" \| "GROUP"` in `sessionStorage` |
| `SessionUser`, `SessionBusinessType` | TypeScript types |
| `formatIndianCurrency(value)` | Formats number/string as `"₹ 1,23,456"` using `en-IN` locale; returns `"-"` for invalid input |
| `RegexPatterns.alphanumeric` | `/^[A-Za-z\d]+$/` |

> **Never access `sessionStorage` directly.** Always use the helpers above.

---

## 3. Mock Data (`mock/`)

Local JSON files consumed exclusively through service modules. `mock/` is declared as a
`globalDependency` in `turbo.json` — any change invalidates the build cache for all three apps.

| File | Used by | Contents |
|---|---|---|
| `mock/auth/login.json` | `apps/common` loginService | Users with `authorizedBusinessTypes` |
| `mock/auth/jwt.json` | `apps/common` jwtService | Mock token payload |
| `mock/inbox/inbox.json` | `apps/retail` + `apps/group` inboxService | `poolData` by category; `businessType` field filters per app |
| `mock/drs/retail-drs.json` | `apps/retail` drsService | DRS records keyed by `applicationNo` |
| `mock/drs/group-drs.json` | `apps/group` drsService | DRS records keyed by `applicationNo` |
| `mock/mas/mas-audit-trail.json` | `apps/retail` masAuditTrailService | MAS audit trail entries (mock; BFF placeholder) |

**Service pattern** (all services follow this pattern — screens never import mock JSON directly):

```ts
import mockData from '../../../../mock/<domain>/<file>.json';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchEntity(applicationNo: string): Promise<Entity | null> {
  await wait(300);
  return mockData.records.find(r => r.applicationNo === applicationNo) ?? null;
}
```

---

## 4. Scripts (`scripts/`)

| File | Command | Description |
|---|---|---|
| `scripts/dev-config.mjs` | (imported by vite.config.ts) | Re-exports `devConfig` and `monorepoRoot` from `packages/routes/src/dev-config.json` |
| `scripts/serve-gateway.mjs` | `pnpm preview` | Static HTTP server that serves all three `dist/` outputs under one origin |
| `scripts/verify-independent-builds.mjs` | `pnpm verify:deployments` | Builds each app with `--filter` separately; reports `PASS/FAIL` per artifact |

---

## 5. Dependency Direction

```
apps/retail, apps/group
        │
        ▼
apps/common  (via @insurance-poc/common/<subpath>)
        │
        ▼
packages/ui, packages/routes, packages/utils
        │
        ▼
   (no further internal deps)
```

- `packages/*` must not import from `apps/*`.
- `apps/common` must not import from `apps/retail` or `apps/group`.
- `apps/retail` and `apps/group` must not import from each other.
- All cross-package imports must use workspace package names — never relative paths.

---

## 6. Key Configuration Files

| File | Purpose |
|---|---|
| `package.json` (root) | `pnpm@10.15.0`, Turbo scripts (`dev`, `build`, `typecheck`, `preview`, `verify:deployments`) |
| `pnpm-workspace.yaml` | Workspace globs: `apps/*`, `packages/*` |
| `tsconfig.base.json` | Shared TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, `moduleResolution: "bundler"` |
| `turbo.json` | Pipeline: `build → ^typecheck`; `dev` (no cache); `globalDependencies: mock/**` |
| `packages/routes/src/dev-config.json` | **Single source of truth** for all dev ports and Vite base paths |
