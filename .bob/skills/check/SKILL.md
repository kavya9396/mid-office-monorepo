---
name: check
description: >-
  Step 3 — verify a built screen against its spec and the HTML prototype; produces
  a scored gap report. Use when the user wants to check, verify, audit, or review
  a completed screen implementation for correctness or completeness.
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen id, e.g. retail-cuw-drs>'
---

Use Ask mode — **do not change any code**. Screen: $ARGUMENTS

1. Read `docs/spec/screens/$ARGUMENTS.md` and `.bob/rules/01-spec-rules.md`.
   If the spec does not exist, stop and tell me.

2. Read the screen's HTML prototype from `design-reference/ui-prototypes/` for exact labels
   and error message text.
   Use `grep` + a small read window — never dump the whole prototype file.

3. For every field, dropdown, button, tab, section, and behaviour rule in the spec, locate the
   implementing code in `apps/retail/` or `apps/group/` (whichever the spec targets).
   Mark each item as one of:
   - **Done** — implemented correctly (file + line).
   - **Missing** — not found in the implementation.
   - **Different** — found but diverges from spec or HTML (file + line + description).

4. Additionally check:
   - Labels and button text match the HTML prototype word for word.
   - Error messages match `data-error-*` values word for word.
   - `data-testid` values match `data-field-id` values.
   - `sx` colour values match the prototype exactly (no approximations or theme-token swaps except `#e45f14` → `primary.main`).
   - No relative cross-package imports (no `../../packages/...` paths).
   - No bare MUI imports in app or shared-component files.
   - No direct `mock/` JSON imports in any screen (must go through a service function).
   - TypeScript strict-mode: no `any`, no unsafe assertions in this screen's files.
   - Accessibility: all inputs have associated `<label>` or `aria-label`; interactive elements
     are keyboard-reachable.

5. Reply with:
   - **Score**: `done / total` items (e.g. "42 / 45").
   - A checklist of all **Missing** and **Different** items, formatted so I can paste it
     directly into `/build $ARGUMENTS` to fix them.
   - Accessibility or TypeScript issues found, if any.

6. If the score is 100 % and the screen's pattern in `docs/spec/screens/INDEX.md` has no
   reference screen assigned yet, suggest this screen as the reference for that pattern.
   Do **not** edit `INDEX.md` yourself.
