---
description: Step 1 — write the spec, layout plan, and task list for one screen or a folder of screens (no code)
argument-hint: <screen name/id, or a folder e.g. design-reference/ui-prototypes/Retail/CUW/>
---
Use Plan mode. Target: $ARGUMENTS

---

## Pre-flight — check shared files first (ALWAYS run before A or B)

Before writing any spec, read and internalise these shared files. They define
components, patterns, and conventions that **must be linked rather than duplicated**:

| File | What it covers | Link rule |
|---|---|---|
| `docs/spec/screens/00-shared-layout.md` | `AppHeader`, `Sidebar`, `ApplicantBanner`, `DecisionFooter`, page shell layout, all design tokens | Never re-specify these. Write `See [00-shared-layout.md](./00-shared-layout.md)` + one-line summary of how they're used in the screen |
| `docs/spec/screens/shared-login.md` | The **one** platform login at `/login` (`apps/common`) | Never create a workstream-specific login section. Write the standard reference block (see §Login rule below) |
| `docs/spec/screens/INDEX.md` (if present) | Named screen patterns and their reference screens | Use to identify the pattern; copy the pattern name exactly |
| `.bob/rules/01-spec-rules.md` | Annotation schema, design tokens, spec template | Follow the template; use tokens verbatim |
| `docs/spec/01-overview-principles-stack.md` | Stack, principles | Informs app target (`apps/retail` vs `apps/group`) and component choices |
| `docs/spec/02-folder-structure.md` | Monorepo layout, `@insurance-poc/*` packages | Informs import paths and service file locations |

**Check which of these already exist** with `list_files docs/spec/screens` before reading.
Skip any that do not exist yet.

---

## Login rule (applies to every workstream spec)

Prototypes ship their own `login.html` for standalone demo purposes only. In production
there is **exactly one** login screen for the entire platform.

**Before writing a Login section**, check whether `docs/spec/screens/shared-login.md`
exists:

- **If it exists** — do NOT write a Login section. Instead, add this block to the spec's
  `## Screens` section and routing table:

  ```
  ## Screens

  > **Login** — uses the shared platform login at `/login` (`apps/common`).
  > See [`docs/spec/screens/shared-login.md`](./shared-login.md) for the full spec.
  > The `login.html` prototype in this workstream folder is for standalone demo use only.
  > No workstream-specific login route exists.
  ```

  Routing table entry:
  ```
  | `/login` | Login (shared) | `apps/common` — see [`shared-login.md`](./shared-login.md) |
  ```

  Logout navigation in behaviour sections must point to `/login`, not a workstream path.

- **If it does NOT exist** — write the full login spec in a new file
  `docs/spec/screens/shared-login.md` (not inside the workstream spec). Then reference it
  with the block above. Base the spec on the actual source file
  `apps/common/src/modules/login/LoginPage.tsx`, not just the prototype HTML.

---

## Shared-component link rules

When a screen uses any of the components listed below, **do not re-specify them** — link
to their canonical source instead.

| Component | Canonical source | How to reference in spec |
|---|---|---|
| `AppHeader` | `docs/spec/screens/00-shared-layout.md §2` | `AppHeader` — see [00-shared-layout §AppHeader](./00-shared-layout.md#2-appheader-component). Note only the screen-specific props (`showBack`, `onBack`). |
| `Sidebar` | `docs/spec/screens/00-shared-layout.md §3` | `Sidebar` — see [00-shared-layout §Sidebar](./00-shared-layout.md#3-sidebar--task-rail-component). Note only the screen-specific sections and active task. |
| `ApplicantBanner` | `docs/spec/screens/00-shared-layout.md §4` | `ApplicantBanner` — see [00-shared-layout §ApplicantBanner](./00-shared-layout.md#4-applicant-banner-component). Note only the screen-specific fields. |
| `CustomTabs` / tab nav | `docs/spec/screens/00-shared-layout.md §5` | Note tab labels and active-tab default only. |
| `CustomTable` / data grid | `docs/spec/screens/00-shared-layout.md §6` | Note column definitions, row shape, and sort/filter rules only. |
| Login page | `docs/spec/screens/shared-login.md` | Follow the Login rule above — never inline. |
| Any `@insurance-poc/ui` component | `docs/spec/02-folder-structure.md §2` | Name the component; do not re-specify its props unless the screen overrides them. |

---

## A — One screen (argument is a screen name, id, or HTML file)

1. **Run the pre-flight** (read shared files listed above).

2. **Check for an existing spec**: `list_files docs/spec/screens` — if a spec for this
   screen already exists, read it first and update rather than overwrite.

3. **Read the prototype** — use `grep` to locate the relevant section, then `read_file`
   with a ±150-line window. Never dump the whole file.
   - If the prototype is a **minified React bundle** (large `<script>` with no readable
     HTML structure), note this explicitly in the spec under the prototype file heading.
     Extract what is readable from the `<!-- comment -->` at the top and any `grep` hits
     for string literals. Record unresolvable details as open questions.

3b. **Component reuse check — confirm with me BEFORE writing the spec.**
   Identify what the prototype can reuse, show it, and wait for my confirmation:

   a. Scan the existing building blocks (read only what you need):
      - `packages/ui/src/index.ts` — `Custom*`, `Badge`, `KeyValueTable`, `Calendar`, `SearchBar`, etc.
      - `apps/common/package.json` `exports` — `DetailCard`, `DecisionBar`, `QuickLinks`,
        `PreviousPolicy`, `LifeAssured`, auth.
      - `docs/spec/screens/00-shared-layout.md` — `AppHeader`, `Sidebar`, `ApplicantBanner`,
        `DecisionFooter`.
      - The pattern's reference screen in `docs/spec/screens/INDEX.md` (if present) and any
        screen/module already built under `apps/retail/src/modules` or `apps/group/src/modules`.

   b. For **every region/element** of the prototype (header, banner/ribbon, tabs, cards, tables,
      forms, dialogs, footer), decide a tag and check fidelity (spec rule 7 in
      `.bob/rules/01-spec-rules.md`): a shared component may be proposed only if it renders the
      region **identically** (same text composition, order, layout).
      - `[shared]` — defined in `00-shared-layout.md` / `shared-login.md`
      - `[reuse]` — existing component in `@insurance-poc/ui` or `apps/common` (name the import path)
      - `[reuse-with-gap]` — close, but differs from the prototype (state the difference)
      - `[new]` — screen-specific, must be built

   c. Show me a table:

      | # | Prototype region | Proposed component | Tag | Source (import path / spec) | Fidelity note |
      |---|---|---|---|---|---|

      Also list: components used by other already-built screens that are **candidates to promote**
      to shared (do not move or edit them), and components flagged `[reuse-with-gap]`.

   d. Ask with `ask_followup_question`: "Do you confirm this component reuse list?" Options:
      - Confirm as is
      - I want to correct some rows (I will tell you which)
      - Treat all `[reuse-with-gap]` as `[new]`
      Do **not** continue until I answer. If I choose to correct, apply my changes, show the
      updated table, and ask again. Repeat until I confirm.

   e. For `[reuse-with-gap]` or `[new]` rows that would require **changing** a shared component in
      `packages/ui` or `apps/common`, record it under "Open questions" — never plan a silent edit.

   f. When running a folder batch (section B), do one table per screen but ask **once per batch**
      (group the tables), unless a screen is large (done alone). My corrections apply only to the
      screen/rows I name.

4. **Create / update** `docs/spec/screens/<screen-id>.md` using the template in
   `.bob/rules/01-spec-rules.md`. Write the confirmed table into the spec under
   **"Component reuse (confirmed)"**, noting "confirmed by user" and any corrections made.

5. **Fill in every field, dropdown, button, tab, and section** from the HTML annotations.
   For each structural element decide: **link** (shared component — use link rule above) or
   **new** (screen-specific — specify fully).

6. In the **Component tree**, mark each component using the **confirmed** tags from step 3b:
   - `[shared]` — defined in a shared spec; link it
   - `[reuse]` — existing component in `@insurance-poc/ui` or `apps/common`; name it
   - `[reuse-with-gap]` — reused with a documented difference; state it
   - `[new]` — screen-specific; must be built
   Do not change a confirmed tag without asking me again.

7. Fill in **Pattern** (from `docs/spec/screens/INDEX.md`, or "new").
   Add a concise plan reusing the pattern's reference screen and `@insurance-poc/ui` components.
   Add a numbered task list (small, ordered tasks) suitable for `/build`.
   Map each screen to its app target: `apps/retail` or `apps/group`.

8. List all unresolved items and `data-todo`s under **"Open questions"**.
   Set `Status: Draft`. **Do not write any code.**

9. Reply with: number of fields/dropdowns/buttons found, the pattern, shared components
   linked vs. new components needed (as confirmed), any corrections I made, and the open questions.

---

## B — A folder (argument is a folder path)

1. **Run the pre-flight** (read shared files listed above).

2. List every `.html` file in the folder and sub-folders.
   Skip `*.original.html`. Skip files that already have `docs/spec/screens/<screen-id>.md`
   **and** that spec is not just a stub (check it has a Component tree section).

3. **Check for the Login rule**: if `login.html` is in the folder, do NOT spec it as a
   new screen — apply the Login rule above for each workstream spec that references it.

4. Take the next **8 non-login screens** in alphabetical order:
   - A large screen (> 40 inputs or a wizard) is done **alone**.
   - Put all screens of one batch in the same business-line module where possible.

5. For each screen, do steps A3–A8 (including A3b) **independently**: read only that screen's HTML,
   write its own spec file, and do not let one screen's fields, labels, or APIs leak into
   another's. All shared-component links (login, header, sidebar, etc.) must point to
   their canonical shared spec files — not be re-described per screen.

6. Reply with:
   - Summary table: screen | HTML file | fields | dropdowns | pattern | shared links | new components | open questions (count).
   - Any screen you were unsure about (e.g. one file = two screens, or minified bundle).
   - How many screens in the folder still need a spec.
   - The exact command to run the next batch.

7. If `docs/spec/screens/INDEX.md` exists, update those screens' Status to "Spec'd (draft)".
