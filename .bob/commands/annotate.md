---
description: Step 0 (optional) — add data-* annotations to a plain HTML prototype so /spec and /build are accurate
argument-hint: <HTML file or folder — optional, defaults to design-reference/ui-prototypes/>
---
Use Code mode. HTML file or folder: $ARGUMENTS (if empty, use `design-reference/ui-prototypes/`).

If it is a folder: process at most **10 files** per run (skip `*.original.html` and files that already
have `data-screen`). Do steps 1–4 for each file separately, then give one combined reply and tell me
which files remain so I can run the command again.

Goal: add the annotations described in `.bob/rules/01-spec-rules.md` without changing how the page looks.

1. Read `docs/spec/01-overview-principles-stack.md`, `.bob/rules/01-spec-rules.md`, and the HTML file.

2. Save the original as `<same-name>.original.html` next to it (only if that file doesn't exist yet).

3. Edit the HTML in place. **Add attributes only** — do not change layout, text, CSS, classes, or order.
   Follow the annotation schema in `.bob/rules/01-spec-rules.md` exactly.

4. Never guess. Add `data-todo="<question>"` instead of a value wherever you are unsure.

5. Reply with: counts (screens, sections, fields, dropdowns by source type),
   a table of every `data-todo`, and any API operations no element references.
   Do not run /spec — I will review the HTML and answer todos first.
