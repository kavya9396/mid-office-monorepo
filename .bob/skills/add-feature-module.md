---
name: add-feature-module
description: >
  Checklist for scaffolding a new workstream or feature module inside apps/retail or
  apps/group. Covers folder structure, service layer, routing, session guard, mock data,
  and integration with the shared packages. Use when the user asks to add a new
  workstream (e.g. CUW, CVT, MAS, GUW Formal) or a major new feature to a business app.
---

# Skill: Add a Feature Module to a Business App

## What counts as a "feature module"

A feature module is a self-contained workstream unit: its own inbox/landing page,
DRS (Decision-Ready Screen), and sub-screens (open tasks, risk details, audit trail,
medical/financial reports). Examples from the spec:
- Retail: CUW, Pre-Issuance CUW, CVT, Pre-Issuance CVT, SUW Reinstatement, MAS, PIVV, IT Task, MMT Grievance, Claim Audit, Ref Screens
- Group: DVT Informal, GUW Formal, GUW Informal
- Cross-line: Search Application

---

## Step 1 — Read the screen spec first

Find and read the relevant spec file in `docs/spec/screens/<workstream>.md` before
writing any code. It defines:
- URL structure and route parameters (`applicationId` vs `schemeId` etc.)
- Component tree per screen
- API endpoint shapes
- Required role guard (e.g. `CUW_USER`, `GROUP_GUW_FORMAL_USER`)
- Design-token overrides specific to that workstream

---

## Step 2 — Create the folder structure

```
apps/<retail|group>/src/
  modules/
    <workstream>/
      <Workstream>InboxPage.tsx       # Landing / Inbox screen
      <Workstream>DrsPage.tsx         # DRS screen
      <Workstream>OpenTasksPage.tsx   # (if in spec)
      <Workstream>RiskDetailsPage.tsx # (if in spec)
      <Workstream>AuditTrailPage.tsx  # (if in spec)
      # ... other sub-screens from the spec
  services/
    <workstream>Service.ts            # all API calls / mock calls for this workstream
  routes/
    AppRoutes.tsx                     # add new routes here (existing file)
```

Never add a new service file to `packages/utils` — that package is stateless helpers
only (currency, session, regex). All API / mock calls belong in `apps/<app>/src/services/`.

---

## Step 3 — Create mock data

Check `mock/` for an existing JSON. If none:
1. Look at the prototype's embedded `<script>` for `mockData` / `var data`.
2. Create `mock/<workstream>/<workstream>-<businessLine>.json`.
3. The file becomes a Turbo `globalDependency` — any change invalidates the cache for
   all three apps. Keep mock files small and focused.

---

## Step 4 — Create the service module

```ts
// apps/<app>/src/services/<workstream>Service.ts
import mockData from '../../../../mock/<workstream>/<file>.json';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface <WorkstreamEntity> { /* types matching the mock shape */ }

export async function fetch<WorkstreamEntity>(
  applicationNo: string
): Promise<<WorkstreamEntity> | null> {
  await wait(300);
  // find the matching record; return null if not found (screens must handle null)
  return mockData.records.find(r => r.applicationNo === applicationNo) ?? null;
}
```

Rules:
- Always return `null` for "not found" — screens must render an explicit "not found" state.
- Screens read `applicationNo` from `useSearchParams()`, not from route params.
- The DRS pages intentionally do not fall back to a first-record default.

---

## Step 5 — Implement the session/auth guard

Retail and Group each re-verify business authorization on every protected route.
Copy the pattern from `apps/retail/src/routes/RequireSession.tsx`:

```tsx
// apps/<app>/src/routes/RequireSession.tsx  (usually already exists — extend it)
import { authorizeBusiness } from '@insurance-poc/common/auth';
import { clearToken, replaceUrl } from '@insurance-poc/utils';
import { commonPaths } from '@insurance-poc/routes';

export function RequireSession({ children }: { children: ReactNode }) {
  // ... calls authorizeBusiness(userId, 'RETAIL' | 'GROUP') on mount
  // redirects to commonPaths.login on failure
}
```

Use `@insurance-poc/common/auth` — NOT a relative import to `apps/common/src/services/loginService.ts`.

---

## Step 6 — Add routes

In `apps/<app>/src/routes/AppRoutes.tsx`, add all routes for the new workstream
inside the existing `<Routes>` block. Wrap each in `<RequireSession>`.

Route pattern (match the URL spec):
```tsx
// Inbox
<Route path="/<workstream>" element={<RequireSession><WorkstreamInboxPage /></RequireSession>} />

// DRS + sub-screens
<Route path="/<workstream>/drs" element={<RequireSession><WorkstreamDrsPage /></RequireSession>} />
<Route path="/<workstream>/open-tasks" element={<RequireSession><WorkstreamOpenTasksPage /></RequireSession>} />
```

Export path constants from `packages/routes/src/index.ts`:
```ts
export const <workstream>Paths = {
  inbox: '/<workstream>',
  drs: '/<workstream>/drs',
  openTasks: '/<workstream>/open-tasks',
} as const;
```

---

## Step 7 — Implement screens

Follow the `implement-screen` skill for each individual screen.

Key rules for all screens in this workstream:
- Outer shell: use the standard `AppHeader` + `main` layout from `00-shared-layout.md`.
- DRS screens: `ApplicantBanner` is sticky inside `<main>`, `z-index: 20`.
- `applicationNo` / `schemeId` comes from `useSearchParams()`.
- Show explicit loading, empty, error, and "record not found" states.
- Decision footer (if present) is sticky at the bottom of `<main>`.
- Back button calls `replaceUrl(...)` or `navigate(-1)` — do NOT use `<Link>` for
  cross-SPA navigation.

---

## Step 8 — Definition of done

1. `pnpm --filter @insurance-poc/<app> typecheck` passes with zero errors.
2. All routes in the spec are implemented and accessible.
3. Service module wraps mock JSON — no direct JSON import in any screen.
4. `RequireSession` guard wraps every route.
5. Path constants exported from `packages/routes/src/index.ts`.
6. No relative cross-package imports.
7. Report: files created, routes added, mock files created, typecheck result,
   anything from the spec that requires a user decision (missing prototypes, dialog
   content not in the spec, API field names not yet confirmed).
