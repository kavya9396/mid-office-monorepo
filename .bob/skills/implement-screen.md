---
name: implement-screen
description: >
  Step-by-step workflow for implementing a React screen from an HTML prototype in
  design-reference/ui-prototypes/. Covers prototype reading, component tree construction,
  data wiring, routing, and definition of done. Use whenever a user asks to implement,
  build, or convert a DRS, landing, open-tasks, audit-trail, medical-report, or any other
  prototype screen into React/TypeScript.
---

# Skill: Implement a Screen from an HTML Prototype

## When to activate
Activate this skill whenever the user asks to implement, build, or convert a screen
that maps to a file under `design-reference/ui-prototypes/`.
Also activate it when the user says "implement the [workstream] [screen]" or references
a spec file under `docs/spec/screens/`.

---

## Step 0 — Identify prototype and spec files

1. Find the screen spec in `docs/spec/screens/<workstream>.md` (e.g. `retail-cuw.md`).
2. Note the **prototype file path** listed under the screen's `#### Prototype file` heading.
3. Open that HTML file with `read_file`. The prototypes are large; read a focused window:
   - Use `grep` to find the section landmark (e.g. section label or class name).
   - Read ±150 lines around the match.
   - Do NOT dump the entire file into context.

> Never guess styling from memory. Every color, size, gap, and border-radius must be read
> directly from the prototype's `<style>` block or inline style.

---

## Step 2 — Extract design tokens from the prototype

Read the prototype's `<style>` block and record the exact values for:

| Token | Where to find it |
|---|---|
| Background color | `background:` on `body` or `.app-shell` |
| Header gradient | `.app-header { background: linear-gradient(...) }` |
| Primary orange | `#e45f14` (always maps to `theme.palette.primary.main`) |
| Font | `font-family:` on `:root` — always `Mulish, Arial, sans-serif` |
| Base font size | `font-size:` on `body` — always `12px` |
| Focus ring | `outline: 2px solid #e45f14` |
| Card border | `border:` on `.card` or panel selectors |
| Banner bg | `.banner { background: #ffead7 }` |

> **The only substitution allowed:** replace `#e45f14` (brand orange) with
> `theme.palette.primary.main` or the sx string `"primary.main"`. Every other
> color from the prototype goes into `sx` exactly as written.

---

## Step 3 — Determine where the code lives

| What | Where |
|---|---|
| Generic presentational component (reusable across workstreams) | `packages/ui/src/<ComponentName>/` |
| Business-context shared component (reusable across apps, knows domain) | `apps/common/src/components/` + export in `apps/common/package.json` |
| Page/screen component | `apps/<retail\|group>/src/modules/<workstream>/<ScreenName>.tsx` |
| Service / data fetching | `apps/<retail\|group>/src/services/<workstream>Service.ts` |
| Route definition | `apps/<retail\|group>/src/routes/AppRoutes.tsx` |
| Mock data | `mock/<workstream>/` — never import JSON directly in a screen |

**Rule:** If a component is identical between Retail and Group, it belongs in
`packages/ui` or `apps/common`. If it needs business-line data it goes in `apps/common`
as a named subpath export (add to `apps/common/package.json` `exports`).

---

## Step 4 — Build the component tree

Follow the component hierarchy from the spec's `#### Component tree` section.
Standard outer shell for every screen:

```tsx
// DRS / detail screens
<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppHeader showBack onBack={...} userName={...} />
  <Box component="main" sx={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <ApplicantBanner {...} />         {/* sticky inside main, zIndex: 20 */}
    {/* screen-specific content */}
  </Box>
</Box>

// Landing / Inbox screens
<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppHeader showBack={false} userName={...} />
  <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    <Sidebar sections={...} collapsed={...} onToggle={...} onTaskSelect={...} />
    <Box component="main" sx={{ flex: 1, overflowY: 'auto' }}>
      {/* role table */}
    </Box>
  </Box>
</Box>
```

Use only existing `packages/ui` wrappers:
- `CustomButton` for all buttons
- `CustomDialog` for modals
- `CustomTable` for data grids
- `CustomTabs` / `CustomSnackbar` / `CustomSelect` etc.

---

## Step 5 — Wire mock data

1. Check `mock/<workstream>/` for an existing JSON file. If none exists, create one
   that mirrors the prototype's embedded mock data (look for `const mockData` or
   `var data` inside a `<script>` tag in the prototype).
2. Create/extend a service in `apps/<app>/src/services/<workstream>Service.ts`:

```ts
import mockData from '../../../../mock/<workstream>/<file>.json';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetch<WorkstreamEntity>(): Promise<...> {
  await wait(300);
  return mockData;  // map/transform as needed
}
```

3. In the page component, fetch on mount with `useEffect` + local `useState` (no TanStack
   Query yet — match the existing pattern in `apps/retail/src/modules/`).
4. Read `applicationNo` from `useSearchParams()` — it is passed as a query param
   (e.g. `/retail/drs?applicationNo=RET1001`).

---

## Step 6 — Add routing

In `apps/<app>/src/routes/AppRoutes.tsx`, add the new route inside the existing
`<Routes>` block, wrapped in `<RequireSession>`:

```tsx
<Route
  path="/<workstream>"
  element={
    <RequireSession>
      <WorkstreamPage />
    </RequireSession>
  }
/>
```

Update `packages/routes/src/index.ts` to export the new path constant.
Do NOT add the port or path directly inside any app's `vite.config.ts`.

---

## Step 7 — Export (if shared component)

If the component is a new shared entry point in `apps/common`, add it to
`apps/common/package.json` exports:

```json
"./my-component": {
  "types": "./src/components/MyComponent.tsx",
  "import": "./src/components/MyComponent.tsx",
  "default": "./src/components/MyComponent.tsx"
}
```

If the component is a new generic component in `packages/ui`, export it from
`packages/ui/src/index.ts`.

---

## Step 8 — Definition of done

1. Run `pnpm typecheck` (or `pnpm --filter @insurance-poc/<pkg> typecheck`).
2. Fix every TypeScript error — `noUnusedLocals` and `noUnusedParameters` are enforced.
3. Verify all cross-package imports use workspace package names, not relative paths.
4. Confirm the mock service wraps the JSON — no direct JSON import in the screen.
5. Report: what files were created/modified, what the user still needs to decide
   (e.g. API shape, missing prototype sections, dialog content not in the prototype).

---

## Key design tokens (from `docs/spec/screens/00-shared-layout.md`)

| Token | Value |
|---|---|
| Header gradient | `linear-gradient(to bottom, #f58220 0%, #e65318 42%, #c92e27 72%, #98252b 100%)` |
| Brand orange | `#e45f14` → `theme.palette.primary.main` |
| Brand maroon | `#9a2529` (sidebar active, secondary actions) |
| DRS background | `#fff8f3` |
| Landing background | `#f0f3f8` |
| Banner strip | `#ffead7` |
| Surface | `#ffffff` |
| Border | `#e4dedb` |
| Text primary | `#302a27` |
| Text muted | `#7b716c` |
| Header height | `57px` |
| Sidebar expanded | `220px` |
| Sidebar collapsed | `60px` |
| Logo width | `150px` |
| Back button width | `44px` |

---

## Workstream → prototype directory map

| Workstream | Prototype path |
|---|---|
| Retail CUW | `design-reference/ui-prototypes/Retail/CUW/` |
| Retail Pre-Issuance CUW | `design-reference/ui-prototypes/Retail/Pre issuance CUW/` |
| Retail CVT | `design-reference/ui-prototypes/Retail/CVT/` |
| Retail Pre-Issuance CVT | `design-reference/ui-prototypes/Retail/Pre issuance CVT/` |
| Retail SUW Reinstatement | `design-reference/ui-prototypes/Retail/SUW/Reinstatement/` |
| Retail MAS | `design-reference/ui-prototypes/Retail/MAS/` |
| Retail PIVV | `design-reference/ui-prototypes/Retail/PIVV/` |
| Retail IT Task | `design-reference/ui-prototypes/Retail/IT Task/` |
| Retail MMT Grievance | `design-reference/ui-prototypes/Retail/MMT Grievance/` |
| Retail Claim Audit | `design-reference/ui-prototypes/Retail/Claim Audit/` |
| Retail Ref Screens | `design-reference/ui-prototypes/Retail/Ref Screens/` |
| Retail Reinsurer | `design-reference/ui-prototypes/Retail/` |
| Group DVT Informal | `design-reference/ui-prototypes/Group/DVT Informal/` |
| Group GUW Formal | `design-reference/ui-prototypes/Group/GUW Formal/` |
| Group GUW Informal | `design-reference/ui-prototypes/Group/GUW Informal/` |
| Search Application | `design-reference/ui-prototypes/search-application/search-application/` |
