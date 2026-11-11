---
description: v1 Fast lane — spec and build ONE section of a new screen by following the matching section of a finished reference screen
argument-hint: <new-screen-id> <reference-screen-id> [section-id] [--go]
---
Arguments: $ARGUMENTS (new screen id, reference screen id, optional section id, optional `--go`).

Read `.bob/rules/02-section-workflow-v1.md` first. This command handles **one section per run**.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

The reference screen must say `Status: Done` (or `Built`) and its section must have Check at 100 %
in `<reference>.sections.md` (or the screen-level `/check` score is 100 %). If not, stop and tell me.

## Part 1 — Spec (Plan mode)

1. Read: `docs/spec/01-overview-principles-stack.md`, `docs/spec/02-folder-structure.md`,
   `docs/spec/screens/00-shared-layout.md`, `.bob/rules/01-spec-rules.md`, the reference's section
   block in `docs/spec/screens/<reference>.md`, the reference's React source **for the matching
   section only**, and the new screen's prototype section (line range ±20).

2. Load or create `<new-screen-id>.sections.md` (workflow rule 3; confirm with me). Pick the section
   (workflow rule 2). Match it to a reference section by id/title; if none matches, treat it as `[new]`.

3. **Component reuse check for this section — confirm before writing.** Compare the new section
   region by region with the matching reference section, `packages/ui/src/index.ts`, `apps/common`
   exports, and `00-shared-layout.md`. Show a table (region | component | tag | source | fidelity note)
   marking what is **reused from the reference**, **different**, and **new**. Reusable only if it
   renders identically (rule 7). `ask_followup_question`: Confirm as is / I want to correct some rows /
   Treat all `[reuse-with-gap]` as `[new]`. Do not continue until confirmed.

4. Write this section's block into `docs/spec/screens/<new-screen-id>.md` as in `/spec-v1` (create the
   skeleton if missing), with the confirmed rows under "Component reuse (confirmed)", the same
   structure and task order as the reference's section, and a **"Differences from `<reference>`"**
   subsection for this section (fields, dropdowns, buttons, rules, API calls that are new, removed, or
   different). The new prototype wins over the reference.

5. Add unclear items and `data-todo`s under "Open questions", prefixed with the section id.
   `Status: Draft`. Set Spec to `done` in the map. **No code yet.**

## Part 2 — Build (Code mode)

6. `--go` skips only the spec-approval wait, never the confirmation in step 3. If `--go` is present
   **and** there are no open questions for this section: note "auto-approved via build-like-v1 --go"
   in the section's Notes (do not change the spec's overall `Status`), and continue. Otherwise stop
   and wait for me.

7. Build only this section as in `/build-v1` (steps 4–6 there): reference gives code structure only,
   the new prototype's rendering wins; write new code only for differences; do not edit the reference
   screen's files; stop if a shared component must change. Typecheck with
   `pnpm --filter @insurance-poc/<app> typecheck` after each task, compare to the prototype, and update
   `docs/spec/02-folder-structure.md` if the structure changed.

8. Set Build to `done` in the map. Reply with: differences table for this section, typecheck result,
   folder-structure update status, anything blocked, the next pending section, and its command.
