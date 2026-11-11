---
description: Fast lane — spec and build a new screen by following an already-finished reference screen of the same kind
argument-hint: <new-screen-id> <reference-screen-id> [--go]
---
Screen and reference: $ARGUMENTS
(first token = new screen id, second = reference screen id, optional --go)

The reference screen must say `Status: Done` (or `Status: Built`) and its `/check` score must be
100 %. If not, stop and tell me.

**Part 1 — Spec (Plan mode)**

1. Read:
   - `docs/spec/01-overview-principles-stack.md`
   - `docs/spec/02-folder-structure.md`
   - `docs/spec/screens/00-shared-layout.md`
   - `.bob/rules/01-spec-rules.md`
   - `docs/spec/screens/<reference>.md`
   - The reference screen's React source files
   - The new screen's HTML prototype from `design-reference/ui-prototypes/`

2. Write `docs/spec/screens/<new-screen>.md` from the template in `.bob/rules/01-spec-rules.md`.
   Use the same structure, `@insurance-poc/ui` component choices, and task list order as the reference.
   Add a **"Differences from `<reference>`"** section listing every field, dropdown, button,
   rule, or API call that is new, removed, or different in the new screen.

3. List all unclear items and `data-todo`s under **"Open questions"**.
   The new HTML prototype always wins over the reference for labels, options, and behaviour.
   Set `Status: Draft`. **Do not write code yet.**

**Part 2 — Build (Code mode)**

4. If `--go` is present **AND** "Open questions" is empty:
   - Set `Status: Approved` with note "auto-approved via build-like --go".
   - Continue to step 5.
   Otherwise, stop and wait for approval.

5. Build the screen following the reference screen's code structure:
   - Same folder layout under `apps/retail/` or `apps/group/`.
   - Same `@insurance-poc/ui` shared components and service patterns.
   - Write **new code only for differences**. Do not edit the reference screen's files.
   - If a shared component needs to change, stop and tell me.

6. After each task, run `pnpm --filter @insurance-poc/<app> typecheck`. Fix all errors. Tick tasks in the spec.

Reply with: differences table, typecheck result, and anything left or blocked.
