# Architecture rules — Common / Retail / Group layering (all modes)

Target folder architecture for `apps/common`, `apps/retail`, `apps/group`.
These rules **extend** `AGENTS.md` and `01-spec-rules.md`; where they overlap, `AGENTS.md` wins
(raw `.ts` exports, `sx`-only styling, `Custom*` wrappers, services wrap mocks with `wait(ms)`,
screens never import `mock/` JSON, workspace package names only, `Readonly<Props>`, no `any`).

Status: Draft (architecture proposal — reviewer approves)

---

## 1. Guiding principles

1. **Common owns the shape, lines own the data.** `apps/common` defines UI, hooks, types, config
   schema and API contracts. `apps/retail` and `apps/group` supply their own endpoints, mocks,
   mappers and field configs.
2. **Configuration over code.** Screens are rendered from a *master configuration* plus a
   *field-level access configuration* (`hidden | read | write`). No per-field `if` in JSX.
3. **One API envelope everywhere.** Every call returns the same `ApiResponse<T>` shape, regardless
   of business line or workstream.
4. **Mapper isolation.** Backend payload shapes never reach components. Only a mapper touches raw
   request/response types.
5. **Group-level reuse.** Anything shared by *all* Group screens (DVT, GUW Formal, GUW Informal)
   lives in `apps/group/src/shared/`, not in a workstream folder. Same for Retail.
6. **Dependency direction (never reverse):**
   `retail | group  →  common  →  @insurance-poc/ui | utils | routes`
   `common` must never import from `retail` or `group`. `retail` and `group` must never import
   from each other.

---

## 2. `apps/common` (Common repo)

```
apps/common/src/
├─ components/            # Individual sections / small reusable pieces
│   ├─ DetailCard.tsx
│   ├─ DecisionBar.tsx
│   ├─ QuickLinks.tsx
│   ├─ PreviousPolicy.tsx
│   └─ LifeAssured/ …
├─ modules/               # Composed UI shared by BOTH retail and group
│   ├─ login/             # (existing)
│   ├─ medical-financial/ # Medical / Financial sections
│   ├─ member-profile/    # Member / applicant profile
│   ├─ quick-links/       # Quick-link panel composition
│   ├─ cvt-dvt/           # Verification workstream UI (CVT = retail, DVT = group)
│   └─ cuw-guw/           # Underwriting workstream UI (CUW = retail, GUW = group)
├─ hooks/                 # Data fetch / save hooks (no business-line knowledge)
│   ├─ useDRS.ts
│   ├─ useEditAuditFields.ts
│   └─ index.ts
├─ api/                   # Common API structure
│   ├─ types.ts           # ApiResponse<T>, ApiError, PageRequest, …
│   ├─ httpClient.ts      # fetch wrapper, headers, error normalisation
│   ├─ contracts.ts       # DrsApi, AuditApi … interfaces implemented by each line
│   └─ ApiProvider.tsx    # React context that injects the line's implementation
├─ config/                # Config *schema* only (no line-specific values)
│   ├─ fieldConfig.types.ts   # FieldAccess, FieldConfig, SectionConfig, ScreenConfig
│   └─ resolveScreen.ts       # pure fn: master + access config + user role → renderable model
└─ services/              # (existing) auth services
```

### 2.1 Placement decision table

| If the thing is…                                                         | Put it in                        |
|--------------------------------------------------------------------------|----------------------------------|
| A single visual section/card/table used on ≥2 screens                    | `common/components/`             |
| A composed block (several components + layout) used by retail **and** group | `common/modules/<name>/`      |
| Fetch/save logic with no knowledge of retail/group                       | `common/hooks/`                  |
| A type/interface used by both lines                                      | `common/api/types.ts` or `common/config/*.types.ts` |
| Used by one line only                                                    | that line's folder               |
| Used by one workstream only                                              | that workstream's module folder  |

### 2.2 Components vs Modules

- **Components** are presentational: props in, JSX out. No hooks that fetch, no service imports.
- **Modules** may compose components, accept a `ScreenConfig` / `FieldConfig`, and call common hooks.
  They still do not know whether they run in Retail or Group — differences arrive via props,
  config or the injected API.
- Business-line wording (e.g. "Member" vs "Life Assured") comes from **config labels**, never from
  `if (businessType === 'group')` inside common.

### 2.3 Hooks (`common/hooks/`)

- Hooks consume the API through `useApi()` (context from `ApiProvider`) — they **never** import
  `fetch`, mock JSON, or a line's service directly.
- Return shape is fixed: `{ data, status, error, refetch }` for reads and
  `{ mutate, status, error }` for writes, where `status: 'idle' | 'loading' | 'success' | 'error'`.
- `useDRS(applicationNo)` — loads the DRS record; `applicationNo` comes from `useSearchParams()` in the
  screen, then is passed in.
- `useEditAuditFields(applicationNo)` — saves field edits and returns the audit trail entry.
- A "not found" result is `data === null` (never default to first record).
- New hook ⇒ also add it to `common/hooks/index.ts` and add a `./hooks` entry to `exports`.

### 2.4 Package exports (mandatory)

Every new public entry point needs an `exports` entry in `apps/common/package.json` with
`types`, `import`, `default` all pointing at the `.ts/.tsx` source. Planned entries:

| Subpath                              | Source file                              |
|--------------------------------------|------------------------------------------|
| `@insurance-poc/common/hooks`        | `src/hooks/index.ts`                     |
| `@insurance-poc/common/api`          | `src/api/index.ts`                       |
| `@insurance-poc/common/config`       | `src/config/index.ts`                    |
| `@insurance-poc/common/medical-financial` | `src/modules/medical-financial/index.ts` |
| `@insurance-poc/common/member-profile`    | `src/modules/member-profile/index.ts`    |
| `@insurance-poc/common/cvt-dvt`      | `src/modules/cvt-dvt/index.ts`           |
| `@insurance-poc/common/cuw-guw`      | `src/modules/cuw-guw/index.ts`           |

Consumers import only through these subpaths — never deep paths such as `…/common/src/…`.

---

## 3. Common API structure

```ts
// common/api/types.ts
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;          // null = not found
  error?: ApiError;
}
```

```ts
// common/api/contracts.ts  — implemented separately by retail and group
export interface DrsApi<TDomain> {
  getDrs(applicationNo: string): Promise<ApiResponse<TDomain>>;
}
export interface AuditApi {
  saveEditedFields(req: EditAuditRequest): Promise<ApiResponse<EditAuditResult>>;
}
```

Rules:

- Contracts are expressed in **domain types** (mapper output), not raw backend types.
- Each line registers one implementation through `<ApiProvider value={retailApi | groupApi}>` at its
  app layout (`RetailAppLayout.tsx` / `GroupAppLayout.tsx`).
- Never invent endpoints, params or field names (see `01-spec-rules.md` §3). Unknown ⇒ add to the
  screen spec's *Open questions* and leave the call unimplemented.

---

## 4. Group (`apps/group`) — shared for all Group screens

Everything that applies to **all** Group workstreams goes in `shared/`; only workstream-specific
files go under `modules/<workstream>/`.

```
apps/group/src/
├─ shared/                              # COMMON FOR ALL GROUP SCREENS
│   ├─ api/
│   │   ├─ groupApi.ts                  # implements common DrsApi / AuditApi for Group
│   │   ├─ endpoints.ts                 # Group endpoint constants (single place)
│   │   └─ groupHttpClient.ts           # base URL, headers, group-specific interceptors
│   ├─ config/
│   │   ├─ fieldAccess.config.ts        # field-level hidden/read/write per role × stage
│   │   ├─ masterScreen.config.ts       # master user configuration (sections, order, labels)
│   │   └─ index.ts
│   ├─ mappers/
│   │   └─ common.mapper.ts             # shared mapping helpers (dates, currency, enums)
│   ├─ mocks/
│   │   └─ group.mock.ts                # shared Group mock fixtures (typed)
│   ├─ types/
│   │   └─ group.types.ts               # Group-wide domain types
│   └─ hooks/
│       └─ useGroupScreen.ts            # master+access config → resolved screen (wraps common resolveScreen)
├─ modules/
│   ├─ dvt/
│   │   ├─ DvtPage.tsx
│   │   ├─ dvt.config.ts                # DVT-only overrides of master/field config
│   │   ├─ dvt.mock.ts
│   │   ├─ dvt.mapper.ts                # request + response payload mappers
│   │   ├─ dvt.types.ts
│   │   ├─ dvt.test.ts
│   │   └─ index.ts
│   ├─ guw-formal/        (same file set: GuwFormal*.config|mock|mapper|types|test)
│   ├─ guw-informal/      (same file set)
│   ├─ inbox/             # (existing)
│   └─ previousPolicy/    # (existing)
├─ routes/                # (existing)
└─ services/              # (existing — migrate gradually into shared/api)
```

### 4.1 Config files (field-level + read/write)

```ts
// common/config/fieldConfig.types.ts
export type FieldAccess = 'hidden' | 'read' | 'write';

export interface FieldConfig {
  fieldId: string;                 // becomes data-testid (see 01-spec-rules.md)
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  access: FieldAccess;             // default access
  required?: boolean;
  optionsKey?: string;             // key into static data, never a hard-coded list
  accessByRole?: Record<string, FieldAccess>;
  accessByStage?: Record<string, FieldAccess>;
}

export interface SectionConfig { sectionId: string; title: string; order: number; fields: FieldConfig[]; }
export interface ScreenConfig  { screenId: string; sections: SectionConfig[]; }
```

Resolution order (most specific wins): **stage override → role override → field default → section default**.
`resolveScreen(master, access, { role, stage })` is a pure function in `common/config/resolveScreen.ts`
and must be unit-tested.

### 4.2 "Create screen from master user configuration"

1. `useGroupScreen('dvt')` merges `masterScreen.config` + `dvt.config` + `fieldAccess.config`.
2. The result is a `ResolvedScreen` (sections → fields with final `access`).
3. `DvtPage` iterates the `ResolvedScreen` and renders through common modules/components. Fields with
   `access: 'hidden'` are not rendered; `'read'` render disabled/plain text; `'write'` render editable and
   are included in the save payload (and in `useEditAuditFields`).
4. Adding a field = edit config + mapper + type. **No JSX change.**

### 4.3 DVT module file contract

| File             | Responsibility                                                                                     |
|------------------|----------------------------------------------------------------------------------------------------|
| `DvtPage.tsx`    | Reads `applicationNo` from `useSearchParams()`, calls `useDRS`, renders `ResolvedScreen`.          |
| `dvt.config.ts`  | DVT overrides: sections/fields added, removed, reordered, access changes. Typed as `ScreenConfig` partial. |
| `dvt.mock.ts`    | Typed fixtures for DVT backend responses. Imported **only** by the Group API implementation.       |
| `dvt.mapper.ts`  | `toDvtRequest(domain): DvtRequestDto` and `fromDvtResponse(dto): DvtDomain`. Pure, no side effects. |
| `dvt.types.ts`   | `DvtRequestDto`, `DvtResponseDto` (backend shape) and `DvtDomain` (UI shape). Separate them.       |
| `dvt.test.ts`    | Tests for mapper round-trip, config resolution and access rules (see §6).                          |
| `index.ts`       | Public surface of the module (page + types).                                                       |

---

## 5. Retail (`apps/retail`) — same pattern, different data

Retail mirrors Group's structure with its **own** implementations. Do not share files between them.

```
apps/retail/src/
├─ shared/                    # common for ALL retail screens
│   ├─ api/ (retailApi.ts, endpoints.ts, retailHttpClient.ts)
│   ├─ config/ (fieldAccess.config.ts, masterScreen.config.ts)
│   ├─ mappers/  mocks/  types/  hooks/
└─ modules/
    ├─ cvt/  cuw/  pre-issuance-cuw/  …   # each: Page, *.config, *.mock, *.mapper, *.types, *.test
```

| Concern            | Common                         | Retail                         | Group                          |
|--------------------|--------------------------------|--------------------------------|--------------------------------|
| UI sections/modules| ✅ owns                        | consumes                       | consumes                       |
| Hooks (`useDRS`…)  | ✅ owns                        | consumes                       | consumes                       |
| API contracts/envelope | ✅ owns                    | implements                     | implements                     |
| Endpoints / HTTP client | —                         | ✅ own                         | ✅ own                         |
| Mocks              | —                              | ✅ own                         | ✅ own                         |
| Mappers            | generic helpers only           | ✅ own                         | ✅ own                         |
| Field-level config values | schema only             | ✅ own values                  | ✅ own values                  |

---

## 6. Mocks, mappers, types, tests — conventions

### Mocks
- Raw JSON stays in repo-root `mock/<line>/…` (Turbo `globalDependency`). Typed wrappers live in
  `*.mock.ts`. **Screens and components never import either.**
- Only the line's API implementation (`shared/api/<line>Api.ts`) imports `*.mock.ts`, and wraps results
  with `wait(ms)`. Swapping to real endpoints touches only that file.
- Mock data must satisfy the same DTO types as the real backend (`*.types.ts`).

### Mappers
- Naming: `toXxxRequest` (domain → DTO) and `fromXxxResponse` (DTO → domain).
- Pure functions, no `Date.now()`, no I/O, no React.
- Unknown/extra backend fields are dropped; missing optional fields map to `undefined`, not `''`/`0`.
- Use `RegexPatterns` and `formatIndianCurrency` from `@insurance-poc/utils` — do not re-implement.

### Types
- Three layers, never mixed: **DTO** (backend) → **Domain** (mapper output) → **View/Config** (render).
- Shared across lines ⇒ `common`; across Group screens ⇒ `group/shared/types`; otherwise module-local.
- No `any`, no unsafe `as`; use `unknown` + guards at the API boundary.

### Tests (`*.test.ts`)
- The repo currently has **no test framework**. Adopting one (recommended: Vitest, already compatible with
  Vite) is an open question below — do not add it silently.
- Once approved, each module's test file covers: (1) mapper round-trip, (2) access resolution
  (`hidden/read/write` by role and stage), (3) "not found" returns `null`, (4) required-field rules.
- Tests import only the module's own files and `common` — never another line.

---

## 7. Naming & export conventions

| Item                | Convention                                              |
|---------------------|---------------------------------------------------------|
| Component files     | `PascalCase.tsx`                                        |
| Hooks               | `useCamelCase.ts`, one hook per file                    |
| Config/mocks/mappers/types/tests | `<module>.config.ts`, `.mock.ts`, `.mapper.ts`, `.types.ts`, `.test.ts` |
| Folders             | `kebab-case` (new code); keep existing folder names as-is |
| Barrels             | One `index.ts` per module; export public API only       |
| Name collisions     | Check `packages/ui/src/index.ts` and existing `common` exports before adding any export |

---

## 8. Agent checklist when adding a Group/Retail workstream screen

1. Read `docs/spec/01-overview-principles-stack.md` and the screen spec (`Status: Approved` only).
2. Confirm the needed section/module already exists in `common`; if not, add it to `common` first
   (components → modules → export entry), **not** inside the line app.
3. Add/extend `shared/config` only if the change applies to *every* screen of that line.
4. Create the module file set: `Page`, `.config`, `.mock`, `.mapper`, `.types`, `.test`, `index.ts`.
5. Register the endpoint in `shared/api/endpoints.ts` only if the spec provides it; otherwise log an open question.
6. Run `pnpm --filter @insurance-poc/<app> typecheck` (and `common` if touched). Verify: no relative
   cross-package imports, no bare MUI imports, no direct `mock/` imports in screens, no retail↔group imports.

---

## Open questions

1. **Test framework:** approve Vitest + Testing Library as the monorepo test runner, and add a
   `test` script/Turbo task? (Required before any `*.test.ts` can run.)
2. **Role and stage vocabulary:** exact role codes and workflow stages used as keys in
   `accessByRole` / `accessByStage` — source of truth (API, enum, static data)?
3. **Master user configuration source:** static TS config shipped with the app, or fetched from an API?
   If API, operation id and response shape are needed (not invented here).
4. **Existing `apps/group/src/services/*` and `apps/retail/src/services/*`:** migrate into
   `shared/api/` now, or only for new screens?
5. **Folder naming:** existing `LifeAssured/`, `Applicant Profile/` use PascalCase/spaces — keep or
   normalise to kebab-case when moving into `modules/member-profile/`?
6. **CVT/DVT and CUW/GUW shared modules:** confirm which sections are truly identical across lines versus
   those that should remain line-specific.
