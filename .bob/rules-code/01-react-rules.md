# React / TypeScript coding rules (Code / Agent mode)

These rules apply when implementing screens for the ICICI Prudential mid-office platform.
The project is a **pnpm + Turborepo TypeScript monorepo**. Read
`docs/spec/01-overview-principles-stack.md` and `docs/spec/02-folder-structure.md` before
writing any code.

---

## Monorepo structure

| Folder | Package name | Contents |
|---|---|---|
| `apps/common` | `@insurance-poc/common` | Login, shared business components, auth service |
| `apps/retail` | `@insurance-poc/retail` | Retail workstream pages and services |
| `apps/group` | `@insurance-poc/group` | Group workstream pages and services |
| `packages/ui` | `@insurance-poc/ui` | MUI wrappers, icons (`Icons.tsx`), theme (`theme.ts`) |
| `packages/routes` | `@insurance-poc/routes` | Route constants, URL helpers, dev-config |
| `packages/utils` | `@insurance-poc/utils` | Session helpers, `formatIndianCurrency`, `RegexPatterns` |

- Never import across packages using relative paths — use workspace package names only.
- Never import from `design-reference/` into any application source file.
- Never add a library without checking the spec and confirming with the user.

---

## Technology stack (current codebase)

| Concern | Tool |
|---|---|
| UI components | `@insurance-poc/ui` — `CustomButton`, `CustomDialog`, `CustomTable`, `CustomTabs`, `CustomTextField`, `CustomSelect`, `CustomMultiSelect`, `CustomSearchSelect`, `CustomApiAutocomplete`, `CustomCheckbox`, `CustomRadioGroup`, `CustomSnackbar`, `CustomTooltip`, `CustomAccordion`, `KeyValueTable`, `Badge`, `BadgeWithCount`, `SearchBar`, `Calendar` |
| Icons | `@insurance-poc/ui` — proxy all icons through `packages/ui/src/icons/Icons.tsx` |
| Theme | `@insurance-poc/ui` — `appTheme` from `packages/ui/src/theme.ts` |
| Session | `@insurance-poc/utils` — use `getToken`, `setToken`, `clearToken`, `hasSession`, `getSessionUser`, `setSessionUser`, `getSessionBusinessType`, `setSessionBusinessType` |
| Routes | `@insurance-poc/routes` — `retailPaths`, `groupPaths`, `commonPaths`, `businessInboxUrl`, `drsUrl`, `replaceUrl`, `assignUrl` |
| Auth (cross-app) | `@insurance-poc/common/auth` — `authorizeBusiness` / `fetchLogin` |
| Forms | React Hook Form + Zod v4 (`@hookform/resolvers`) |
| Server state | `useEffect` + `useState` (TanStack Query not yet installed) |
| Routing (in-app) | React Router v7 |
| Mocking | Local JSON files under `mock/` — wrapped in async service functions |

> **Note:** The spec (`docs/spec/`) references `@axiom/ui`, `@axiom/api-client`, TanStack Query,
> MSW, and Vitest. These are the **target** architecture. Use the tools listed above for all
> current implementation work.

---

## Component usage rules

- `packages/ui/src` holds **all** UI components to be used. Check `packages/ui/src/index.ts` for an
  existing wrapper **before** writing new MUI markup.
- Use `Custom*` wrappers (`CustomButton`, `CustomDialog`, `CustomTable`, etc.) in all app code.
  Do not use bare MUI `Button`, `Dialog`, `Table*`, `Select`, `MenuItem`, `TextField`, `Paper`, etc.
  directly in app or shared component files. Use `CustomBox` / `CustomTypography` from `@insurance-poc/ui` for layout.
  Dropdowns: `CustomSelect` with an `options` array (its `onChange` receives the value, not an event).
  Data grids: `CustomTable` with `columns` / `data`; put inputs in cells via the column `render`.
- Icons: never add `@mui/icons-material` imports in app code. Export from `packages/ui/src/icons/Icons.tsx` and consume via `@insurance-poc/ui`.
- Name collision check: search `packages/ui/src/index.ts` before adding any new export.
  `CustomButton`, `RequirementBadgeVariant`, `BadgeVariant`, `LegacyBadgeVariant` are taken.

---

## Styling rules

- **All styling via MUI `sx` prop.** No CSS files, CSS modules, or `styled()`.
- Copy `sx` values **verbatim** from the prototype's `<style>` block. Do not approximate.
- **Only substitution allowed:** `#e45f14` → `theme.palette.primary.main` (or `"primary.main"` in sx).
- Typography: `Mulish, Arial, sans-serif` via the theme. Base size is `12px`. Compact UI uses 10–12px.
- Use the prototype's exact `border-radius`, `box-shadow`, `gap`, `padding`, `margin` values.

---

## Screen shell layouts

### DRS / detail screens
```tsx
<CustomBox sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppHeader showBack onBack={...} userName={...} />          {/* h=57px, sticky, z-index:100 */}
  <CustomBox component="main" sx={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <ApplicantBanner {...} />                                  {/* sticky, top:0, z-index:20 */}
    {/* screen-specific content */}
    <DecisionFooter ... />                                     {/* sticky, bottom:0 if present */}
  </CustomBox>
</CustomBox>
```

### Landing / Inbox screens
```tsx
<CustomBox sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppHeader showBack={false} userName={...} />
  <CustomBox sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    <Sidebar sections={...} collapsed={...} onToggle={...} onTaskSelect={...} />  {/* 220px/60px */}
    <CustomBox component="main" sx={{ flex: 1, overflowY: 'auto' }}>
      {/* role table */}
    </CustomBox>
  </CustomBox>
</CustomBox>
```

---

## Services and mock data

- Every service lives in `apps/<app>/src/services/<workstream>Service.ts`.
- Services import from `mock/<workstream>/<file>.json` and wrap with a `wait(ms)` helper.
- **Screens never import mock JSON directly.**
- Return `null` for "not found" — screens must render an explicit "record not found" state.
  Never default to the first record as a fallback.
- Read `applicationNo` / `schemeId` from `useSearchParams()`, not from route params.

```ts
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchEntity(applicationNo: string): Promise<Entity | null> {
  await wait(300);
  return mockData.records.find(r => r.applicationNo === applicationNo) ?? null;
}
```

---

## Routing

- Route guards: wrap every protected route in `<RequireSession>` (existing file per app).
- Cross-SPA navigation: use `replaceUrl()` or `assignUrl()` from `@insurance-poc/routes`.
  Never use `<Link>` or `navigate()` to cross from one SPA to another — these are full-page loads.
- In-app navigation: use React Router `<Link>` and `useNavigate()`.
- New path constants belong in `packages/routes/src/index.ts`. Never hardcode URLs in app files.
- Ports and base paths: change only in `packages/routes/src/dev-config.json`.

---

## Forms

- One `useForm` per screen with a Zod schema.
- Schema lives in the same folder as the form component (e.g. `loginSchema.ts` next to `LoginPage.tsx`).
- Copy labels, button text, and error messages **exactly** from the HTML prototype.
- Set `data-testid` = `data-field-id` on every input.
- Prevent double submission: disable the submit button while a request is in flight.

---

## TypeScript rules

- Strict mode — no `any`, no unsafe `as` casts, no non-null assertions without guards.
- `noUnusedLocals` and `noUnusedParameters` are **errors**, not warnings.
- `Readonly<Props>` on all shared component signatures.
- Use discriminated unions for status/workflow states (e.g. `LoginResult` in `loginService.ts`).
- Function components only. No class components.
- Named exports only for components (no `export default` for new shared components; existing ones may use default for compatibility).

---

## Business context

- Use `SessionBusinessType` (`"RETAIL" | "GROUP"`) from `@insurance-poc/utils`.
- Do not scatter `businessLine === "GROUP"` checks across components; use capability flags or
  separate workstream components per the spec (`docs/spec/03-business-lines.md`).
- Do not encode underwriting decisions, premium calculations, or eligibility rules in the frontend.

---

## Scope discipline

- Do not edit other screens' files.
- If a shared component in `packages/ui` or `apps/common` needs to change, stop and report —
  do not edit it silently as a side effect of a screen task.
- Do not refactor, rename, or reorganise code unrelated to the current task.

---

## Definition of done (every task)

1. Run `pnpm --filter @insurance-poc/<app> typecheck` and fix every error.
2. Confirm: no relative cross-package imports, no bare MUI imports in app code, no direct `mock/` JSON imports in screens.
3. Report: files created/modified, typecheck result, anything left or blocked.
