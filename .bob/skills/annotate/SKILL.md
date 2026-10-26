---
name: annotate
description: >-
  Step 0 (optional) — add data-* annotations to a plain HTML prototype so /spec
  and /build are accurate. Use when the user wants to annotate, tag, or mark up
  an HTML mock-up or prototype file before writing specs.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<HTML file or folder — defaults to design-reference/ui-prototypes/>'
---

Use Code mode.
HTML file or folder: $ARGUMENTS (if empty, use `design-reference/ui-prototypes/`).

If it is a folder: process at most **10 files** per run (skip `*.original.html` and files that
already have `data-screen`). Do steps 1–4 for each file separately, then give one combined reply
and tell me which files remain so I can run the command again.

**Goal:** add the annotations described in `.bob/rules/01-spec-rules.md` to a plain HTML file,
without changing how it looks.

---

1. Read `docs/spec/01-overview-principles-stack.md`, `.bob/rules/01-spec-rules.md`, and the HTML
   file. Use `grep` to find the section you need and read a small window around the match (±150 lines).
   Never dump the whole prototype file.

2. Save the original as `<same-name>.original.html` next to it — **only if that file does not
   already exist**.

3. Edit the HTML file in place. **Add attributes only** — do not change layout, text, CSS,
   class names, element order, or remove anything.
   - **Screen root:** add `data-screen="SCR-nn"`, `data-route="<path>"`, `data-title="<label>"`
     to the top element of each logical screen.
   - **Tabs and sections:** add `data-tab="<id>"` or `data-section="<id>"` with a short id and
     `data-title` to each tab panel or named section.
   - **Fields (input, select, textarea):** add
     - `data-field="<dotted.name>"`
     - `data-field-id="FLD-nn-NAME"`
     - `data-component="<Input|Select|Textarea|RadioGroup|Checkbox|DatePicker>"`.
   - **Dropdowns / selects / radio groups / dynamic tables:**
     - If a matching API operation exists → `data-source="api"`, `data-operation-id`, `data-params`,
       `data-value-key`, `data-label-key`.
     - If options match a typed enum → `data-source="enum"`, `data-enum="<EnumName>"`.
     - Otherwise → `data-source="static"`, move hard-coded options/rows into one
       `<script type="application/json" id="static-data">` block at the end of `<body>`
       (create it once per file) and add `data-options="<key>"`.
   - **Cascading dropdowns** (e.g. BusinessType → Product): add `data-depends-on` and
     `data-params` (api) or `data-filter` (static) to the child.
   - **Buttons:** add `data-action="<submit|save|cancel|approve|reject|refer|back>"` and
     `data-operation-id` when an API operation matches.
   - Keep any existing `required`, `maxlength`, `pattern` attributes.
   - Add `data-error-required="<message>"` only if the HTML already shows the error message text.
   - Mark prototype-only scripts, legends, and sample-data divs with `data-spec-only="true"`.

4. **Never guess.** When unsure of the API, a cascade rule, or a field name, add
   `data-todo="<your question>"` on that element instead of a value.

5. Reply with:
   - Counts: screens found, sections, fields, dropdowns (api / enum / static).
   - A table of every `data-todo` (element, attribute, question).
   - Any API operations not referenced by any element.
   - Do **not** run `/spec`. I will review the HTML and answer todos first.
