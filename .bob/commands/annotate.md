---
description: Step 0 (optional) — add data-* annotations to a plain HTML prototype so /spec and /build are accurate. Use when the user wants to annotate, tag, or mark up an HTML mock-up or prototype file before writing specs.
argument-hint: <HTML file or folder — defaults to design-reference/ui-prototypes/>
---
Use Code mode.
HTML file or folder: $ARGUMENTS (if empty, use `design-reference/ui-prototypes/`).

If it is a folder: process at most **10 files** per run (skip `*.original.html` and files that
already have `data-screen`). Do steps 1–5 for each file separately, then give one combined reply
and tell me which files remain so I can run the command again.

**Goal:** add the annotations described in `.bob/rules/01-spec-rules.md` to a plain HTML file,
without changing how it looks.

---

## Pre-flight — check shared files first (run once per session, not per file)

Before touching any HTML, read and internalise these files:

| File | What it tells you |
|---|---|
| `docs/spec/01-overview-principles-stack.md` | Stack and business-line split |
| `.bob/rules/01-spec-rules.md` | Full annotation schema and every `data-*` attribute definition |
| `docs/spec/screens/00-shared-layout.md` | Shared components: `AppHeader`, `Sidebar`, `ApplicantBanner`, `DecisionFooter`, design tokens |
| `docs/spec/screens/shared-login.md` (if it exists) | The one platform login — never re-annotate as a workstream screen |

Run `list_files docs/spec/screens` to confirm which shared spec files exist before reading them.

---

## Login file rule

`login.html` files exist in every workstream folder **for standalone demo purposes only**.
The platform has exactly one login screen in `apps/common`.

- **Do NOT annotate `login.html`** as a new screen.
- Instead, add a single comment at the top of the file:
  ```html
  <!-- DEMO ONLY: platform login is apps/common. See docs/spec/screens/shared-login.md -->
  ```
- Skip it in folder-mode counts (it does not count toward the 10-file limit).

---

## Shared-component annotation rules

These components appear in every prototype but are **already fully specified**.
Do not add `data-field`, `data-tab`, or `data-section` inside them:

| Component region | How to identify it | What to annotate |
|---|---|---|
| `AppHeader` / `.header` / `.app-header` | Top bar with ICICI logo, session timer, profile button | Add `data-component="AppHeader"` on the root element only. Note `data-prop-show-back="true\|false"` if a back button is visible. |
| `Sidebar` / `.sidebar` | Collapsible left rail with task links | Add `data-component="Sidebar"` on the root element only. Note `data-prop-active-task="<pool-key>"` for the highlighted item. |
| `ApplicantBanner` / `.banner` | Orange/warm strip below header on DRS screens | Add `data-component="ApplicantBanner"` on the root element only. |
| `DecisionFooter` / `.decision-footer` | Sticky bottom bar with action buttons | Add `data-component="DecisionFooter"` on the root element only. Note `data-actions="<csv of button labels>"`. |

Everything **inside** these regions is already defined in `docs/spec/screens/00-shared-layout.md`
and must not be re-annotated.

---

## Step 1 — identify screens in the file

Use `grep` to find meaningful structure (headings, `class="screen"`, `data-screen`, route-like
text). Read a ±150-line window around each match. Never dump the whole file.

If the file is a **minified React bundle** (line 1 is a huge `<script>` with no readable HTML
structure):
- Note it as `prototype-type: minified-bundle` in your reply.
- Read only the top HTML comment (line 1–25) for the intent statement.
- Add `data-spec-note="minified-bundle; annotations not possible"` to `<html>` or `<body>`.
- Do not attempt further annotation. Skip to step 5 (reply) for this file.

---

## Step 2 — save the original

Save the original as `<same-name>.original.html` next to it — **only if that file does not
already exist**.

---

## Step 3 — add annotations (add attributes only)

**Do not change** layout, text, CSS, class names, element order, or remove anything.

### 3a — Screen root
On the top element of each logical screen, add:
- `data-screen="SCR-nn"` — sequential id, e.g. `SCR-01`
- `data-route="<path>"` — e.g. `/retail/it-task/:taskId`
- `data-title="<human label>"` — matches the page `<title>` or heading

### 3b — Tabs and sections
On each tab panel or named section:
- `data-tab="<id>"` or `data-section="<id>"` — short kebab-case id
- `data-title="<label>"` — visible label text, copied exactly

### 3c — Form fields
On every `<input>`, `<select>`, `<textarea>`:
- `data-field="<dotted.name>"` — e.g. `applicant.dob`, `policy.sumAssured`
- `data-field-id="FLD-nn-NAME"` — sequential, used as `data-testid`
- `data-component="<Input|Select|Textarea|RadioGroup|Checkbox|DatePicker>"`
- Keep any existing `required`, `maxlength`, `pattern` attributes.
- Add `data-error-required="<message>"` only when the HTML already shows the error text
  (copy word for word).
- Add `data-visible-when="<field>:<value>"` / `data-required-when="<field>:<value>"` when
  the HTML shows conditional display or required logic.

### 3d — Dropdowns, selects, radio groups, and dynamic tables

Determine the data source using this decision tree — **in order**:

1. Does a matching API operation exist for the options?
   → `data-source="api"`, `data-operation-id="<opId>"`, `data-params='{"key":"@field.path"}'`,
   `data-value-key="<prop>"`, `data-label-key="<prop>"`

2. Do the options match a known typed enum (e.g. `ProductType`, `Gender`, `Channel`)?
   → `data-source="enum"`, `data-enum="<EnumName>"`

3. Are the options hard-coded in the HTML with no API or enum?
   → `data-source="static"`, `data-options="<key>"`
   Move the hard-coded options or rows into one
   `<script type="application/json" id="static-data">` block at the end of `<body>`
   (create it once per file; merge into it if it already exists) and reference by key.

### 3e — Cascading dropdowns
When one dropdown is disabled until a parent has a value:
- On the child: `data-depends-on="<parent-field-name>"`
- API source: `data-params='{"<param>":"@<parent.field>"}'`
- Static source: `data-filter='{"<prop>":"@<parent.field>"}'`
- Reset the child when the parent changes (note with `data-reset-on-change="true"`).

### 3f — Buttons
On every `<button>` and `[role="button"]`:
- `data-action="<submit|save|cancel|approve|reject|refer|back|navigate|toggle|open|close|download>"`
- `data-operation-id="<opId>"` when an API operation matches the action.
- `data-target-route="<path>"` when the button navigates to another screen.

### 3g — Prototype-only elements
Mark demo scripts, sample-data divs, and legend explanations with `data-spec-only="true"`.
These elements must not be built as React components.

---

## Step 4 — never guess

When unsure of the API operation, a cascade rule, a field name, or an enum name, add
`data-todo="<your question>"` on that element **instead of** a value.

Do not invent operation IDs, field names, or enum values. Use `data-todo` liberally.

---

## Step 5 — reply

For each file processed, report:

**Counts:**
| Category | Count |
|---|---|
| Screens found | |
| Sections / tabs | |
| Fields (data-field) | |
| Dropdowns — api source | |
| Dropdowns — enum source | |
| Dropdowns — static source | |
| Buttons with data-action | |
| data-todo items | |

**data-todo table** (one row per unresolved item):
| Element | Location / selector | Question |
|---|---|---|
| … | … | … |

**Shared components found** (linked, not re-annotated):
List which shared components (`AppHeader`, `Sidebar`, etc.) were identified and tagged with
`data-component` only.

**API operations referenced** — list every `data-operation-id` used.
**API operations unreferenced** — list any operation IDs visible in the HTML that no element
references (e.g. in a comment or `<script>`).

**Do not run `/spec`.** I will review the HTML and answer todos first.
