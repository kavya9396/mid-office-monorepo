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

2. **Component reuse check — confirm with me before writing.** Compare the new prototype region
   by region with the reference screen and with `packages/ui/src/index.ts`, `apps/common` exports,
   and `00-shared-layout.md`. Show a table (region | component | tag `[shared]`/`[reuse]`/
   `[reuse-with-gap]`/`[new]` | source | fidelity note), marking what is **reused from the reference**,
   what is **different**, and what is **new**. A component is reusable only if it renders the region
   identically (spec rule 7). Ask with `ask_followup_question`: Confirm as is / I want to correct
   some rows / Treat all `[reuse-with-gap]` as `[new]`. Do not continue until I confirm; apply my
   corrections and re-ask until confirmed. Anything needing a change to a shared component goes
   under "Open questions".

   Then write `docs/spec/screens/<new-screen>.md` from the template in `.bob/rules/01-spec-rules.md`,
   including the confirmed table under "Component reuse (confirmed)".
   Use the same structure, `@insurance-poc/ui` component choices, and task list order as the reference.
   Add a **"Differences from `<reference>`"** section listing every field, dropdown, button,
   rule, or API call that is new, removed, or different in the new screen.

3. List all unclear items and `data-todo`s under **"Open questions"**.
   The new HTML prototype always wins over the reference for labels, options, and behaviour.
   Set `Status: Draft`. **Do not write code yet.**

**Part 2 — Build (Code mode)**

4. `--go` skips only the spec-approval wait, never the component reuse confirmation in step 2.
   If `--go` is present **AND** "Open questions" is empty:
   - Set `Status: Approved` with note "auto-approved via build-like --go".
   - Continue to step 5.
   Otherwise, stop and wait for approval.

5. Build the screen following the reference screen's code structure. The reference gives code
   structure only — the **new prototype's rendering wins**. Before each region, note the exact
   rendered text/structure in the new prototype (concatenated strings, separators, order,
   fallbacks) and do not reuse the reference's presentation if it differs (spec rule 7):
   - Same folder layout under `apps/retail/` or `apps/group/`.
   - Same `@insurance-poc/ui` shared components and service patterns.
   - Write **new code only for differences**. Do not edit the reference screen's files.
   - If a shared component needs to change, stop and tell me.

6. After each task, run `pnpm --filter @insurance-poc/<app> typecheck`. Fix all errors. Then
   re-read the prototype section and compare it with what you built (text composition, order,
   separators, structure); fix differences. Tick tasks in the spec only after this passes.

7. Update `docs/spec/02-folder-structure.md` if the build changed the project structure. Check for:
   - New/renamed/removed files or folders under `apps/*`, `packages/*`, `mock/`, or `scripts/`.
   - New or changed exports (`packages/ui/src/index.ts`, `packages/routes/src/index.ts`,
     `packages/utils/src/index.ts`, `apps/common/package.json` `exports`).
   - New route constants, mock files, or services.

   Update both the folder tree and the matching tables/sections. If nothing changed, skip this
   step and say "no folder-structure changes".

Reply with: differences table, typecheck result, whether `docs/spec/02-folder-structure.md` was
updated (and what changed), and anything left or blocked.
