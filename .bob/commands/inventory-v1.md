---
description: v1 Planning — catalogue screens in a prototype folder, and build the per-screen section maps, then write INDEX.md
argument-hint: <folder — optional, defaults to design-reference/ui-prototypes/> [--sections]
---
Use Ask mode for reading; only write `docs/spec/screens/INDEX.md` (and, with `--sections`, section
map files). Arguments: $ARGUMENTS.

Read `.bob/rules/02-section-workflow-v1.md` first.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

Differences from `/inventory`: it never reads a whole HTML file, it processes a bounded batch, and with
`--sections` it creates the section map for each screen.

1. Read `docs/spec/01-overview-principles-stack.md` and `docs/spec/02-folder-structure.md`. If
   `docs/spec/screens/INDEX.md` exists, read it and update rows rather than overwrite.

2. List `.html` files in the folder and sub-folders (skip `*.original.html` and `login.html`).
   Process at most **15 files per run**; report the remainder and the command to continue.

3. For each file use `grep` only — do not read the file:
   - count `data-screen`, `data-tab`, `data-section`, `<input`, `<select`, `<textarea`, `data-todo`;
   - read lines 1–25 for the intent comment; detect a minified bundle (huge line-1 `<script>`).
   Record: name (`data-screen` or file name), module (sub-folder), business line, app target, file path
   relative to `design-reference/`, kind (`landing | list | detail | form | wizard | other`), tabs,
   inputs (S < 15, M 15–40, L > 40), dropdowns, annotations (`yes | partly | no`), `data-todo` count,
   existing spec (`yes | no`), **section map** (`yes | no`), **sections** (count, if a map exists).

4. With `--sections`: for each file in this run, create `docs/spec/screens/<screen-id>.sections.md`
   by the rules in the workflow file (rule 3) if it does not exist. Do not ask for per-file
   confirmation here; ask once for the batch at the end (confirm / correct which map).

5. Group screens of the same kind and similar layout into patterns; suggest one reference screen per
   group (prefer medium-sized, typical).

6. Write/update `docs/spec/screens/INDEX.md`: summary header, table with all columns above plus empty
   **Owner** and **Status**, and a "Pattern groups" section.

7. Reply with: totals by business line / kind / size, files still needing annotation, files with a
   spec, files with a section map, suggested pattern groups, and the command to continue if files remain.
