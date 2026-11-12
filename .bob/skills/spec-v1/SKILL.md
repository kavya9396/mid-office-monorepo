---
name: spec-v1
description: 'v1 Step 1 — write the spec for ONE section of a screen (no code), then stop'
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen-id> [section-id]'
---

Use Plan mode. Arguments: $ARGUMENTS (screen id, optional section id).

Read `.bob/rules/02-section-workflow-v1.md` first and follow it. This command specs **one section per
run** and appends it to the screen spec. It does not write code.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

---

## Pre-flight (read only what you need)

| File | Use |
|---|---|
| `docs/spec/screens/00-shared-layout.md` | Shared components and tokens — link, never re-specify |
| `docs/spec/screens/shared-login.md` | Login — never spec a workstream login |
| `docs/spec/screens/INDEX.md` (if present) | Pattern name for this screen |
| `.bob/rules/01-spec-rules.md` | Template, tokens, annotation schema |
| `docs/spec/01-overview-principles-stack.md`, `docs/spec/02-folder-structure.md` | App target and package paths |

Check what exists with `list_files docs/spec/screens` before reading.

## 1 — Resolve section

1. Load `docs/spec/screens/<screen-id>.sections.md`. If missing, create it (workflow rule 3) and have
   me confirm it.
2. Pick the section (workflow rule 2): Spec cell `pending`. If the Annotate cell is `pending` and the
   prototype is not annotated, tell me and ask whether to continue un-annotated (read the HTML
   directly) or stop to run `/annotate-v1` first.
3. **Shared sections** (`[shared]`): write one line in the spec linking to
   `00-shared-layout.md#<anchor>` plus the screen-specific props only. Set Spec to `done`, stop.
4. Login: apply the Login rule (reference `shared-login.md`; never inline).

## 2 — Create the spec skeleton once

If `docs/spec/screens/<screen-id>.md` does not exist, create it from the template in
`.bob/rules/01-spec-rules.md` with: Overview, URL & routing, Layout, empty "Component reuse
(confirmed)", `## Screens` with the `### <ScreenName>` heading and a **Sections** list linking the
section map, "Open questions", `Status: Draft`. If it exists, do not touch other sections' content.

## 3 — Read the one section

Use the map's line range (±20 lines). If the prototype is a minified bundle, say so, extract only what
is readable, and record the rest as open questions.

## 4 — Component reuse check for THIS section — confirm before writing

a. Scan only what this section needs: `packages/ui/src/index.ts`, `apps/common/package.json` `exports`,
   `00-shared-layout.md`, and any built section/screen of the same pattern under
   `apps/retail/src/modules` or `apps/group/src/modules`.
b. For each element in this section decide a tag, applying spec rule 7 (a component is reusable only if
   it renders the region **identically**): `[shared]`, `[reuse]`, `[reuse-with-gap]`, `[new]`.
c. Show:

   | # | Prototype region | Proposed component | Tag | Source (import path / spec) | Fidelity note |
   |---|---|---|---|---|---|

   plus candidates to promote to shared (do not move or edit) and `[reuse-with-gap]` rows.
d. `ask_followup_question`: "Do you confirm this component reuse list for section <id>?" Options:
   Confirm as is / I want to correct some rows / Treat all `[reuse-with-gap]` as `[new]`. Do not
   continue until confirmed; apply corrections and re-ask.
e. Anything that would require changing `packages/ui` or `apps/common` goes under "Open questions" —
   never plan a silent edit.

## 5 — Write the section's spec block

Append (or replace only this section's block, found by its `### <section-id>` heading) in the spec:

- append the confirmed rows to "Component reuse (confirmed)" with a `Section` column and "confirmed by user";
- a `### <Section title>` block with: Purpose, Prototype file + line range, Component tree (confirmed
  tags), Data / API (fields, dropdowns with source, buttons with action/operation), Behaviour &
  interactions, Accessibility notes;
- for text that is a composed string in the prototype, record the exact string, separators, and
  conditional parts, and name the helper to build it (e.g. `formatApplicantRibbon`) — rule 7;
- a small numbered task list for **this section only**, suitable for `/build-v1`, with the app target
  and the file names it will create;
- the section's `data-todo`s and unresolved items appended under "Open questions", prefixed with the
  section id.

Keep `Status: Draft`. **No code.**

## 6 — Update the map and reply

Set Spec to `done`. Reply with: fields/dropdowns/buttons in this section, the pattern, shared vs new
components (as confirmed), corrections I made, this section's open questions, the next pending section,
and the command `/spec-v1 <screen-id> <next-section-id>`. When every section has Spec `done`, say the
spec is ready for me to review and set `Status: Approved` myself.
