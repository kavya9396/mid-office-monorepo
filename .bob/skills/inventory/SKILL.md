---
name: inventory
description: >-
  Planning — list every screen in a design-reference folder with its kind, size,
  and annotation status so the work can be batched; writes docs/spec/screens/INDEX.md.
  Use when the user wants to take stock of, catalogue, or plan all screens before speccing or building.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<folder — defaults to design-reference/ui-prototypes/>'
---

Use Ask mode for reading; only write `docs/spec/screens/INDEX.md`.
Folder: $ARGUMENTS (if empty, use `design-reference/ui-prototypes/`).

1. Read `docs/spec/01-overview-principles-stack.md` and `docs/spec/02-folder-structure.md` for
   the monorepo layout and business-line split (Retail / Group / Search).

2. List every `.html` file in the folder and its sub-folders.
   Skip `*.original.html`. A file containing several `data-screen` elements counts as several screens.

3. For each screen, skim the HTML (do not analyse deeply) and record:
   - **name**: screen id from `data-screen`, or the file name minus extension
   - **module**: sub-folder (e.g. `Retail/CUW`, `Group/GUW Formal`)
   - **business line**: `Retail`, `Group`, or `Search`
   - **app target**: `apps/retail` or `apps/group`
   - **file**: relative path under `design-reference/`
   - **kind**: `login | landing | list | detail | form | wizard | other`
   - **tabs**: number of tabs
   - **inputs**: approximate count (S < 15, M 15–40, L > 40 or wizard)
   - **dropdowns**: count
   - **annotations**: `yes` / `partly` / `no` (look for `data-screen` on the root element)
   - **data-todo count**: number of `data-todo` attributes
   - **existing spec**: `yes` if `docs/spec/screens/<name>.md` exists, else `no`

4. Group screens that share the same kind and similar layout into patterns and suggest one
   reference screen per group (prefer a medium-sized, typical one already in `docs/spec/screens/`).

5. Write `docs/spec/screens/INDEX.md` with:
   - A summary header (total screens, breakdown by business line, kind, and size).
   - A table with all columns above, plus empty **Owner** and **Status** columns.
   - A "Pattern groups" section listing each group and its suggested reference screen.

6. Reply with:
   - Total screens, counts by business line, kind (login/landing/list/detail/form/wizard/other),
     and size (S/M/L).
   - How many still need `/annotate` (annotations = "no" or "partly").
   - How many already have a spec.
   - The suggested pattern groups.
   - If there are more than 60 HTML files, process the first 60 and tell me the command to continue.
