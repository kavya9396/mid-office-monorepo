---
description: Planning — catalogue every screen in a design-reference folder, then write docs/spec/screens/INDEX.md
argument-hint: <folder — optional, defaults to design-reference/ui-prototypes/>
---
Use Ask mode for reading; only write `docs/spec/screens/INDEX.md`.
Folder: $ARGUMENTS (if empty, use `design-reference/ui-prototypes/`).

1. Read `docs/spec/01-overview-principles-stack.md` and `docs/spec/02-folder-structure.md`.

2. List every `.html` file in the folder and sub-folders (skip `*.original.html`).
   A file with several `data-screen` elements counts as several screens.

3. For each screen, skim the HTML and record:
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

4. Group screens that share the same kind and similar layout into patterns; suggest one
   reference screen per group (prefer a medium-sized, typical one).

5. Write `docs/spec/screens/INDEX.md`:
   - Summary header (total, breakdown by business line / kind / size).
   - Table with all columns above, plus empty **Owner** and **Status** columns.
   - "Pattern groups" section listing each group and its suggested reference screen.

6. Reply with:
   - Total screens, counts by business line, kind, and size (S/M/L).
   - How many still need `/annotate` (annotations = "no" or "partly").
   - How many already have a spec.
   - The suggested pattern groups.
   - If more than 60 files exist, process the first 60 and tell me the command to continue.
