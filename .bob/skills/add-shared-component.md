---
name: add-shared-component
description: >
  Rules and checklist for adding a new reusable component to packages/ui or
  apps/common. Covers the decision of where the component belongs, the authoring
  pattern, MUI sx styling, icon usage, TypeScript requirements, export wiring, and
  definition of done. Use when the user asks to create, add, or extract a shared UI
  component, a shared business component, or a design-system primitive.
---

# Skill: Add a Shared Component

## Step 1 — Decide where it belongs

| Location | Use when |
|---|---|
| `packages/ui/src/<Name>/` | Purely presentational; no knowledge of insurance domain or API shape; reusable across Group, Retail, and any future app. Examples: `Badge`, `Table`, `Dialog`, `Tooltip`, `Calendar`. |
| `apps/common/src/components/` | Knows an insurance domain contract (e.g. renders an `ApplicantBanner`, `DetailCard`, `AuditTimeline`) but the data is passed in as props — no API calls inside. Needs a named subpath export. |
| `apps/<retail\|group>/src/modules/<workstream>/` | Only used by one workstream in one app. Keep it local until a stable reusable contract emerges. |

**Never put an insurance-domain concept (applicant, policy, task) directly in `packages/ui`.**
`packages/ui` must remain business-agnostic.

---

## Step 2 — Authoring rules

### TypeScript
- Props interface in the same file; export it alongside the component.
- Use `Readonly<Props>` on the component signature: `function Foo({ ... }: Readonly<FooProps>)`.
- No `any`. Use `unknown` and narrow, or proper discriminated unions.
- Unused imports and unused parameters are TypeScript **errors** (`noUnusedLocals`, `noUnusedParameters` enabled).

### React
- Function components only. No class components.
- Extract logic into a custom hook (`use<Name>.ts`) if it involves `useEffect`, async, or non-trivial state.
- Keep components small: if JSX exceeds ~80 lines, extract sub-components.
- Stable keys on lists — never use array index as key for dynamic data.

### Styling
- **All styling via MUI `sx` prop.** No CSS files, CSS modules, or `styled()`.
- Pull exact color values from the prototype's `<style>` block (see `implement-screen` skill).
- The one substitution: `#e45f14` (brand orange) → `theme.palette.primary.main` or the sx string `"primary.main"`.
- Typography: `Mulish, Arial, sans-serif` via the theme. Use numeric sizes (`sx={{ fontSize: 12 }}`); compact UI in this repo uses 10–12 px.
- Theme shape: `borderRadius: 8`. Use `theme.shape.borderRadius` or match the prototype's exact value.

### Icons
- Icons live in `packages/ui/src/icons/Icons.tsx`.
- Export any icon a consuming component needs from `packages/ui/src/index.ts`.
- Never add `@mui/icons-material` imports inside app code — proxy them through the icons file.

### MUI component usage
Before writing any new MUI markup, check `packages/ui/src/index.ts` for existing wrappers:
- `CustomButton`, `CustomDialog`, `CustomTable`, `CustomTabs`, `CustomTextField`
- `CustomSelect`, `CustomMultiSelect`, `CustomSearchSelect`, `CustomApiAutocomplete`
- `CustomCheckbox`, `CustomRadioGroup`, `CustomSnackbar`, `CustomTooltip`
- `CustomAccordion`, `KeyValueTable`, `Badge`, `BadgeWithCount`, `SearchBar`, `Calendar`

Use these instead of bare MUI `Button`, `Dialog`, `Table`, etc. in app or shared component code.

---

## Step 3 — Name collision check

Before creating a new export:
1. Search `packages/ui/src/index.ts` for the name you intend to use.
2. Check existing component files — e.g. `CustomButton` is taken by `Button/Button.tsx`;
   if you add a themed variant export it as a distinct name.
3. Avoid duplicate type names: `RequirementBadgeVariant`, `BadgeVariant`, `LegacyBadgeVariant`
   already exist in the Badge files.

---

## Step 4 — File placement

### packages/ui component
```
packages/ui/src/
  <ComponentName>/
    <ComponentName>.tsx      # component + exported Props interface
```

### apps/common component
```
apps/common/src/
  components/
    <ComponentName>.tsx      # component + exported Props interface
```

---

## Step 5 — Wire exports

### packages/ui
Add to `packages/ui/src/index.ts`:
```ts
export { default as MyComponent, type MyComponentProps } from './<ComponentName>/<ComponentName>';
```

### apps/common subpath export
Add to `apps/common/package.json` `exports`:
```json
"./<component-name>": {
  "types": "./src/components/<ComponentName>.tsx",
  "import": "./src/components/<ComponentName>.tsx",
  "default": "./src/components/<ComponentName>.tsx"
}
```

The consuming app then imports it as:
```ts
import { MyComponent } from '@insurance-poc/common/<component-name>';
```

---

## Step 6 — Add a new dependency (if needed)

Add the dependency to the package that imports it:
```bash
pnpm --filter @insurance-poc/ui add <package>       # for packages/ui
pnpm --filter @insurance-poc/common add <package>   # for apps/common
```

Never add a dependency to the root `package.json` for something only used in one package.

---

## Step 7 — Definition of done

1. Run `pnpm typecheck` (or `pnpm --filter @insurance-poc/<pkg> typecheck`).
2. Fix every TypeScript error before reporting done.
3. Confirm:
   - Component is exported from the correct `index.ts`.
   - No relative cross-package imports (e.g. `../../packages/ui/src/…` must not appear).
   - No bare MUI imports in app code that bypass the wrappers.
   - `sx` values match the prototype exactly (colors are verbatim, not approximated).
4. Report: files created/modified, exports added, typecheck result.
