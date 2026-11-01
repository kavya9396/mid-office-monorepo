---
name: spec
description: >-
  Step 1 — write the screen spec, layout plan, and task list for one screen or a
  batch of screens from a folder (no code). Use when the user wants to spec, plan,
  or document a screen before building it.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen name/id, or a folder e.g. design-reference/ui-prototypes/Retail/CUW/>'
---

Use Plan mode. Target: $ARGUMENTS

---

## A — One screen (argument is a screen name, id, or HTML file)

1. Read these files first:
   - `docs/spec/01-overview-principles-stack.md` (stack, principles)
   - `docs/spec/02-folder-structure.md` (monorepo layout, `@insurance-poc/*` packages)
   - `docs/spec/screens/00-shared-layout.md` (Header, Sidebar, design tokens)
   - `docs/spec/screens/INDEX.md` if it exists (pattern groups and reference screens)
   - `.bob/rules/01-spec-rules.md` (annotation schema, template, design tokens)
   - The screen's HTML prototype from `design-reference/ui-prototypes/`
     (use `grep` to find the section; read ±150 lines around the match — never dump the whole file)

2. Create `docs/spec/screens/<screen-id>.md` using the template in `.bob/rules/01-spec-rules.md`.

3. Fill in every field, dropdown, button, tab, and section from the HTML annotations.

4. Fill in **Pattern** (from `docs/spec/screens/INDEX.md`, or "new").
   Add a concise plan reusing the pattern's reference screen and `@insurance-poc/ui` shared components.
   Add a numbered task list (small, ordered tasks) suitable for `/build`.
   Map each screen to its app target: `apps/retail` or `apps/group`.

5. List all unresolved items and `data-todo`s under **"Open questions"**.
   Set `Status: Draft`. **Do not write any code.**

6. Reply with: number of fields/dropdowns/buttons found, the pattern, and the open questions.

---

## B — A folder (argument is a folder path)

1. List every `.html` file in the folder and sub-folders.
   Skip `*.original.html`. Skip files that already have `docs/spec/screens/<screen-id>.md`.

2. Take the next **8 screens** in alphabetical order:
   - A large screen (> 40 inputs or a wizard) is done **alone**.
   - Put all screens of one batch in the same business-line module where possible.

3. For each screen, do steps A1–A5 **independently**: read only that screen's HTML,
   write its own spec file, and do not let one screen's fields, labels, or APIs leak into another's.

4. Reply with:
   - Summary table: screen | HTML file | fields | dropdowns | pattern | open questions (count).
   - Any screen you were unsure about (e.g. one file = two screens?).
   - How many screens in the folder still need a spec.
   - The exact command to run the next batch.

5. If `docs/spec/screens/INDEX.md` exists, update those screens' Status to "Spec'd (draft)".
