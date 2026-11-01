---
name: build
description: >-
  Step 2 — implement one approved screen as a React component inside the correct
  app (apps/retail or apps/group). Use when the user wants to build, implement,
  code, or develop a screen that has an approved spec.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen id, e.g. retail-cuw-drs>'
---

Use Code mode. Screen: $ARGUMENTS

1. Open `docs/spec/screens/$ARGUMENTS.md`.
   If it does not say `Status: Approved`, stop and tell me.

2. Read `.bob/rules/01-spec-rules.md` and `.bob/rules-code/01-react-rules.md`.
   Read `docs/spec/02-folder-structure.md` to confirm the correct app target
   (`apps/retail` or `apps/group`) and the relevant `@insurance-poc/*` packages.

3. If the spec names a reference screen, read that screen's React source and follow the same
   folder structure, shared-component usage, and hook patterns.

4. Work through the spec's task list in order. For each task:
   - Implement only what the spec and HTML prototype describe — no extra features, no refactors.
   - Use `@insurance-poc/ui` components for Header, Sidebar, tables, dialogs, buttons, etc.
     Do not duplicate them. Check `packages/ui/src/index.ts` for the full export list.
   - Wrap mock JSON in a service function — never import `mock/` JSON directly in a screen.
   - One React Hook Form + Zod schema per screen; set `data-testid` = `data-field-id`.
   - Read `applicationNo` / `schemeId` from `useSearchParams()`, not from route params.
   - Copy labels, button text, and error messages **exactly** from the HTML prototype.
   - Do **not** edit other screens' files. If a shared component needs to change, stop and tell me.

5. After each task, run:
   ```
   pnpm --filter @insurance-poc/<app> typecheck
   ```
   Fix all type errors before moving to the next task. Tick the task in the spec.

6. Reply with:
   - What was built (files created / changed).
   - Typecheck result.
   - Remaining tasks, if any.
   - Any open questions that blocked a task.
