---
description: Step 3 — verify a built screen against its spec and the HTML prototype; produces a scored gap report
argument-hint: <screen id, e.g. retail-cuw-drs>
---
Use Ask mode — do not change any code. Screen: $ARGUMENTS

1. Read `docs/spec/screens/$ARGUMENTS.md` and `.bob/rules/01-spec-rules.md`.
   If the spec file does not exist, stop and tell me.
   Read the HTML prototype from `design-reference/ui-prototypes/` for exact labels and error text.

2. For every field, dropdown, button, tab, section, and behaviour rule in the spec, find the
   implementing code in `apps/retail/` or `apps/group/`. Mark each as:
   - **Done** — correct implementation (file + line).
   - **Missing** — not found.
   - **Different** — found but diverges from spec or HTML (file + line + description).

3. Also verify:
   - Labels and button text match the HTML word for word.
   - Error messages match `data-error-*` values word for word.
   - `data-testid` = `data-field-id` on every input.
   - `sx` values match the prototype's CSS (colours, font sizes, spacing not approximated).
   - No relative cross-package imports (no `../../packages/...` paths).
   - No bare MUI imports (all UI goes through `@insurance-poc/ui` wrappers).
   - No direct `mock/` JSON imports in the screen (must go through a service function).
   - TypeScript: no `any`, no unsafe assertions in this screen's files.
   - All inputs have `<label>` or `aria-label`; interactive elements are keyboard-reachable.

4. Reply with:
   - **Score**: done / total items (e.g. "42 / 45").
   - Checklist of Missing and Different items, formatted so it can be pasted into `/build $ARGUMENTS`.
   - Any TypeScript or accessibility issues found.

5. If score is 100 % and this pattern has no reference screen in `docs/spec/screens/INDEX.md`,
   suggest this screen as the reference. Do not edit INDEX.md yourself.
