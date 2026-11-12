# Section-wise workflow (v1)

Applies to the `-v1` commands in `.bob/commands/` (`annotate-v1`, `inventory-v1`, `spec-v1`,
`build-v1`, `build-like-v1`, `check-v1`, `pipeline-v1`). The original commands are unchanged.

Prototypes are large. The v1 commands therefore work on **one section of one screen per run**,
never on the whole HTML file.

## Section

A section is one visually and logically separate region of a screen, for example:
`header`, `banner`, `tab-<id>`, `card-<name>`, `table-<name>`, `dialog-<name>`, `footer`.
A section must be small enough to read as a window of at most ~300 HTML lines. Split larger
regions (a tab with several cards becomes one section per card).

Shared components (`AppHeader`, `Sidebar`, `ApplicantBanner`, `DecisionFooter`) are sections
tagged `[shared]`: record them in the map, link to `00-shared-layout.md`, never re-specify or rebuild.

## Section map file

Path: `docs/spec/screens/<screen-id>.sections.md`. It is the only shared state between v1 commands.

```
# <screen-id> — section map
Prototype: <relative path under design-reference/>
Screen root: data-screen=<id> | not yet annotated
Spec file: docs/spec/screens/<screen-id>.md
App target: apps/retail | apps/group

| # | Section id | Title (as in prototype) | Lines (start-end) | Tag | Annotate | Spec | Build | Check | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | header | ... | 12-40 | [shared] | n/a | n/a | n/a | n/a | |
```

Cell values: `pending`, `done`, `n/a`, or `blocked: <reason>`. Check cells hold the score, e.g. `12/12`.
Line ranges are a hint; the section's start marker (a `data-section`/`data-tab` attribute, a heading,
or a class name) is the source of truth. Re-locate by `grep` if lines drifted, then fix the map.

## Rules for every v1 command

1. **Argument shape:** `<screen-id> [section-id]` (build-like-v1: `<new-screen-id> <reference-screen-id> [section-id]`).
2. **No section id given:** read the section map, print it, and pick the first section whose column for
   this step is `pending` and whose earlier-step columns are `done` or `n/a`. Say which one you picked.
3. **No section map yet:** create it (this is "Step S — map sections" and any v1 command may do it).
   Use `grep` for `data-screen`, `data-tab`, `data-section`, headings, `<section`, `class="card`, `<table`,
   dialog/modal markers. Read only a ±40-line window per hit. Never dump the whole HTML.
   Show the map to the user and ask to confirm or correct it (`ask_followup_question`) before continuing.
4. **One section per run.** Never start a second section in the same run. At the end, name the next
   pending section and the exact command to run it.
5. **Reads are section-sized:** read the section's line range plus at most 20 lines either side. For the
   spec file, read only the "Section map"-listed headings you need, not the whole file, when it is long.
6. **Writes are section-sized:** edit only that section's lines in the HTML, or append/replace only that
   section's block in the spec, or create only that section's React files. Use `apply_diff` /
   `insert_content`, not full-file `write_file`, on existing files.
7. **Update the section map** (only the cell for the step you ran, plus Notes) at the end of the run.
8. **Never set** `Status: Approved` or `Status: Done` on the spec. Only the user does.
9. **Never invent** endpoints, field names, enum values, labels, or validation rules. Use `data-todo`
   (annotate) or "Open questions" (spec) and skip the item.
10. Follow `.bob/rules/01-spec-rules.md` (including rule 7: render structure must match the prototype)
    and `.bob/rules-code/01-react-rules.md` in every step.
11. Do not edit another screen's or another section's files unless a task explicitly says so. If a shared
    component in `packages/ui` or `apps/common` must change, stop and report it.
12. **Ask questions one at a time.** Every confirmation (section map, component-reuse table), every
    choice, and every open question goes through `ask_followup_question`, **one question per turn**,
    each with concrete suggested answers. After asking, stop and wait for the answer; do not edit files
    or continue in the same turn. Never batch several questions into one message or one tool call, and
    never put questions only in chat text. Ask the next question only after the previous one is
    answered. The user's answers are recorded in the spec ("Open questions" / "Component reuse
    (confirmed)") before building.

## Section ids across steps

The same `section-id` is used as: the `data-section`/`data-tab` value in the HTML, the `### <Section>`
heading anchor in the spec, and the React file/component name stem. Do not rename it between steps.
