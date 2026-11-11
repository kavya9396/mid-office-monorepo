---
description: v1 Step 0 (optional) — annotate ONE section of a plain HTML prototype with data-* attributes, then stop
argument-hint: <screen-id or HTML file> [section-id]
---
Use Code mode. Arguments: $ARGUMENTS (first token = screen id or HTML file path, second = optional section id).

Read `.bob/rules/02-section-workflow-v1.md` first and follow it. This command annotates **one section
per run**. It never walks the whole HTML.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

**Goal:** add the annotations defined in `.bob/rules/01-spec-rules.md` to one section of a prototype,
without changing how it looks.

---

## 1 — Resolve target and section map

1. Resolve the HTML file. If the argument is a screen id, use the `Prototype:` line of
   `docs/spec/screens/<screen-id>.sections.md`. If it is a file path, derive the screen id from the
   file name.
2. If the section map does not exist, create it (workflow rule 3) and have me confirm it.
3. Pick the section (workflow rule 2). Only consider rows whose Annotate cell is `pending`.
4. If the file is a **minified React bundle** (line 1 is a huge `<script>`, no readable HTML): add
   `data-spec-note="minified-bundle; annotations not possible"` to `<html>` or `<body>`, set every
   Annotate cell to `blocked: minified-bundle`, and stop.

## 2 — Login and shared components

- `login.html`: do not annotate as a screen. Add once at the top of the file:
  `<!-- DEMO ONLY: platform login is apps/common. See docs/spec/screens/shared-login.md -->` and stop.
- Section tagged `[shared]` (`AppHeader`, `Sidebar`, `ApplicantBanner`, `DecisionFooter`): add only
  `data-component="<Name>"` on its root element (plus `data-prop-show-back`, `data-prop-active-task`,
  or `data-actions` where visible). Annotate nothing inside it. Set Annotate to `done` and stop.

## 3 — Save the original (first annotate run on this file only)

Save `<same-name>.original.html` next to the file **only if it does not already exist**.

## 4 — Annotate the one section (add attributes only)

Read only the section's line range (±20 lines). Do not change layout, text, CSS, class names, element
order, or remove anything. Use `apply_diff` on that range only.

- **Screen root** (only when the section is the first one and `data-screen` is missing):
  `data-screen="SCR-nn"`, `data-route="<path>"`, `data-title="<label>"`. Update the map's
  `Screen root:` line.
- **Section / tab:** `data-section="<section-id>"` or `data-tab="<section-id>"` and
  `data-title="<exact visible label>"`. Use the section id from the map.
- **Form fields** (`input`, `select`, `textarea`): `data-field="<dotted.name>"`,
  `data-field-id="FLD-nn-NAME"` (continue numbering from the highest `FLD-` already in the file),
  `data-component="<Input|Select|Textarea|RadioGroup|Checkbox|DatePicker>"`. Keep existing
  `required`/`maxlength`/`pattern`. Add `data-error-required` only if the error text is already in the
  HTML (word for word). Add `data-visible-when` / `data-required-when` only when the HTML shows it.
- **Dropdowns, radios, dynamic tables** — decide the source in this order:
  1. matching API operation → `data-source="api"`, `data-operation-id`, `data-params`,
     `data-value-key`, `data-label-key`
  2. known typed enum → `data-source="enum"`, `data-enum`
  3. hard-coded options/rows → `data-source="static"`, `data-options="<key>"`; move the data into the
     file's single `<script type="application/json" id="static-data">` block (create or merge, keyed by
     `<section-id>.<key>`)
- **Cascading dropdowns:** child gets `data-depends-on`, `data-params` / `data-filter` with `@parent`,
  and `data-reset-on-change="true"`.
- **Buttons / `[role="button"]`:** `data-action="<submit|save|cancel|approve|reject|refer|back|navigate|toggle|open|close|download>"`;
  `data-operation-id` when an API matches; `data-target-route` when it navigates.
- **Prototype-only elements** (demo scripts, sample data, legends): `data-spec-only="true"`.
- **Unsure** about an operation id, cascade rule, field name, or enum: add `data-todo="<question>"`
  instead of a value. Never invent.

## 5 — Update the map and reply

Set the section's Annotate cell to `done` (or `blocked: <reason>`), fill Notes with the `data-todo` count.

Reply with:

| Category | Count (this section) |
|---|---|
| Fields (data-field) | |
| Dropdowns — api / enum / static | |
| Buttons with data-action | |
| data-todo items | |

Then the `data-todo` table (element | location | question), `data-operation-id`s used, the map's next
pending section, and the exact command to run it, e.g. `/annotate-v1 <screen-id> <next-section-id>`.
**Do not run `/spec-v1`.** I review the HTML and answer todos first.
