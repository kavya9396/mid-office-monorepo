---
name: build-like
description: >-
  Fast lane — spec and build a new screen by closely following a finished reference
  screen of the same kind. Use when the user wants to clone, copy-structure, fast-track,
  or model a new screen on an existing one.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<new-screen-id> <reference-screen-id> [--go]'
---

Screen and reference: $ARGUMENTS
(first token = new screen id, second token = reference screen id, optional `--go` flag)

The reference screen must be finished: `docs/spec/screens/<reference>.md` must say
`Status: Done` (or `Status: Built`) and its `/check` score must be 100 %.
If not, stop and tell me.

---

## Part 1 — Spec (Plan mode)

1. Read:
   - `docs/spec/01-overview-principles-stack.md`
   - `docs/spec/02-folder-structure.md`
   - `docs/spec/screens/00-shared-layout.md`
   - `.bob/rules/01-spec-rules.md`
   - `docs/spec/screens/<reference>.md`
   - The reference screen's React source files
   - The new screen's HTML prototype from `design-reference/ui-prototypes/`
     (use `grep` + small read window — never dump the whole file)

2. Write `docs/spec/screens/<new-screen>.md` from the template in `.bob/rules/01-spec-rules.md`.
   Use the same structure, `@insurance-poc/ui` component choices, and task list order as the reference.
   Add a **"Differences from `<reference>`"** section listing every field, dropdown, button,
   rule, or API call that is new, removed, or different in the new screen.

3. List all unclear items and every `data-todo` under **"Open questions"**.
   Do not copy labels, options, or behaviour from the reference when the new HTML shows something
   different — the new HTML prototype always wins.
   Set `Status: Draft`. **Do not write code yet.**

---

## Part 2 — Build (Code mode)

4. If `--go` is in the arguments **AND** "Open questions" is empty:
   - Set `Status: Approved` in the new screen's spec with the note
     "auto-approved via build-like --go".
   - Continue to step 5.
   Otherwise, stop here and wait for me to approve the spec before building.

5. Build the screen following the reference screen's code structure:
   - Same folder layout under `apps/retail/` or `apps/group/`.
   - Same `@insurance-poc/ui` shared components and service patterns.
   - Write **new code only for differences** listed in Part 1.
   - Do not edit the reference screen's files; if a shared component needs to change,
     stop and tell me instead.

6. After each task:
   ```
   pnpm --filter @insurance-poc/<app> typecheck
   ```
   Fix all errors before continuing. Tick the task in the spec.

---

Reply with:
- The differences table (field | change type | notes).
- Typecheck result.
- Anything left or any open questions that blocked a step.
