# Spec rules (all modes)

These rules apply whenever reading, writing, or checking screen specs for the ICICI Prudential
mid-office platform (Retail, Group, and Search business lines).

1. Read `docs/spec/01-overview-principles-stack.md` and the relevant screen spec under
   `docs/spec/screens/` first. The project is a **pnpm + Turborepo TypeScript monorepo**:
   `apps/common`, `apps/retail`, `apps/group`, and shared `packages/` (`@insurance-poc/ui`,
   `@insurance-poc/routes`, `@insurance-poc/utils`).
   Find a screen by its `data-screen` id or HTML file name under `design-reference/ui-prototypes/`.
   Read only that screen's HTML, not the whole folder.
   If `docs/spec/screens/INDEX.md` exists, read it for the list of screens and patterns.

2. **Source-of-truth hierarchy:**
   - HTML prototype wins for screen layout, labels, field order, colours, spacing, and
     user-visible behaviour.
   - `docs/spec/` wins for architecture, component choices, and coding standards.
   - When the spec and the prototype disagree on a visual detail, **the prototype wins**.

3. Never invent endpoints, parameters, field names, enum values, labels, or validation rules.
   If something is missing or unclear, record it as an open question in the screen spec file and
   skip that item. Do not build unresolved items.

4. Work on one screen at a time. Only build a screen whose spec says `Status: Approved`.

5. `design-reference/` is **never** imported into the application. Re-implement screens as React
   components that consume `@insurance-poc/ui` and other shared workspace packages.

6. The prototypes are large standalone bundled HTML files. Use `grep` to find the target section,
   then `read_file` with a small line range (±150 lines). Do not dump the entire file.

7. **Render structure must match the prototype, not just the labels.** The prototype's DOM
   structure and text composition are part of the contract. Specifically:
   - If the prototype shows a **composed/concatenated string** (e.g. `Name | Age | Gender`,
     `Policy No: X • Plan: Y`, a ribbon/banner/header line), render that **same single string**
     with the same separators, order, spacing, and conditional parts. Do **not** split it into
     label/value pairs, rows, chips, or a table.
   - Do not swap the prototype's markup for a shared component (`DetailCard`, `KeyValueTable`,
     `ApplicantBanner`, `CustomTable`, etc.) if that component renders it differently (different
     layout, label/value split, wrapping, ordering, icons). If the shared component does not
     reproduce the prototype exactly, either compose with `Box`/`Typography` inside the screen,
     or stop and report — never reshape the data to fit the component.
   - Preserve element order, grouping, visible/hidden state, empty-value fallbacks (e.g. `-`),
     and casing/formatting exactly as in the prototype.
   - Build the string/structure in a small, named helper (e.g. `formatApplicantRibbon(data)`)
     so the composition is explicit and checkable.

---

## How to read HTML annotations

| Attribute | Meaning |
|---|---|
| `data-screen`, `data-route` | One page component per screen, mounted at that route |
| `data-tab`, `data-section` | Tabs and titled sections — preserve order |
| `data-field` | Form field name |
| `data-field-id` | Use as `data-testid` |
| `data-source="api"` + `data-operation-id` | Dropdown options fetched from that API operation |
| `data-source="enum"` + `data-enum` | Options are a typed enum constant |
| `data-source="static"` + `data-options` | Options come from `src/data/static-data.ts`; no API call |
| `data-params` | Request params; `"@x.y"` means "value of field x.y" |
| `data-depends-on` | Cascading dropdown: disabled until parent has a value; reset on parent change |
| `data-value-key` / `data-label-key` | Which item property is option value / label |
| `data-visible-when`, `data-required-when` | Conditional display / required rules |
| `data-error-*` | Exact error message text — copy word for word |
| `data-action` + `data-operation-id` | What a button does and which API it calls |
| `data-todo="<question>"` | Unresolved question — list under "Open questions"; do not build until answered |

---

## Static data

| Attribute | Meaning |
|---|---|
| `<script type="application/json" id="static-data">` | Product data — port as-is to `src/data/static-data.ts` with TypeScript types |
| `data-source="static"` + `data-options="<key>"` | Options/rows come from that list; no API call |
| `data-filter='{"prop":"@x.y"}'` | Keep items whose `prop` equals field `x.y`; empty value = no filter |
| `data-search` | Case-insensitive text search over the listed properties |
| `data-sort` | `property,asc` or `property,desc` |

---

## Design tokens (from prototypes + `docs/spec/screens/00-shared-layout.md`)

Copy these values verbatim into `sx` props. The **only** substitution allowed:
`#e45f14` (brand orange) → `theme.palette.primary.main`.

| Token | Value |
|---|---|
| Header gradient | `linear-gradient(to bottom, #f58220 0%, #e65318 42%, #c92e27 72%, #98252b 100%)` |
| Brand orange | `#e45f14` → `theme.palette.primary.main` |
| Brand maroon | `#9a2529` |
| DRS page background | `#fff8f3` |
| Landing page background | `#f0f3f8` |
| Banner strip | `#ffead7` |
| Surface | `#ffffff` |
| Border | `#e4dedb` |
| Text primary | `#302a27` |
| Text muted | `#7b716c` |
| Focus ring | `outline: 2px solid #e45f14` |
| Font | `Mulish, Arial, sans-serif` |
| Base font size | `12px` |
| Header height | `57px` |
| Sidebar expanded | `220px` / collapsed `60px` |
| Back button width | `44px` |
| Logo width | `150px` |

---

## Screen spec file template

Each screen spec lives at `docs/spec/screens/<screen-id>.md` and follows this structure:

```
## Overview
## URL & routing
## Layout
## Component reuse (confirmed)   <- table: region | component | tag | source | fidelity note; "confirmed by user"
## Screens
  ### <ScreenName>
    #### Purpose
    #### Prototype file
    #### Component tree
    #### Data / API
    #### Behaviour & interactions
    #### Accessibility notes
## Open questions
Status: Draft | Approved | Built | Done
```

Set `Status: Draft` when writing. Do not change to `Approved` — that is the reviewer's responsibility.

Component tags: `[shared]`, `[reuse]`, `[reuse-with-gap]`, `[new]`. The "Component reuse (confirmed)"
table must be shown to the user and confirmed (or corrected) **before** the spec is written; `/build`
must follow the confirmed tags and not swap components on its own.

---

## Workstream → prototype directory map

| Workstream | Business line | Prototype path |
|---|---|---|
| CUW | Retail | `design-reference/ui-prototypes/Retail/CUW/` |
| Pre-Issuance CUW | Retail | `design-reference/ui-prototypes/Retail/Pre issuance CUW/` |
| CVT | Retail | `design-reference/ui-prototypes/Retail/CVT/` |
| Pre-Issuance CVT | Retail | `design-reference/ui-prototypes/Retail/Pre issuance CVT/` |
| SUW Reinstatement | Retail | `design-reference/ui-prototypes/Retail/SUW/Reinstatement/` |
| MAS | Retail | `design-reference/ui-prototypes/Retail/MAS/` |
| PIVV | Retail | `design-reference/ui-prototypes/Retail/PIVV/` |
| IT Task | Retail | `design-reference/ui-prototypes/Retail/IT Task/` |
| MMT Grievance | Retail | `design-reference/ui-prototypes/Retail/MMT Grievance/` |
| Claim Audit | Retail | `design-reference/ui-prototypes/Retail/Claim Audit/` |
| Ref Screens | Retail | `design-reference/ui-prototypes/Retail/Ref Screens/` |
| Reinsurer | Retail | `design-reference/ui-prototypes/Retail/` |
| DVT Informal | Group | `design-reference/ui-prototypes/Group/DVT Informal/` |
| GUW Formal | Group | `design-reference/ui-prototypes/Group/GUW Formal/` |
| GUW Informal | Group | `design-reference/ui-prototypes/Group/GUW Informal/` |
| Search Application | Cross | `design-reference/ui-prototypes/search-application/search-application/` |
