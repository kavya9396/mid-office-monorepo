---
name: check-v1
description: >-
  v1 Step 3 — verify ONE built section against its spec block and the prototype;
  scored gap report
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen-id> [section-id]'
---

Use Ask mode — do not change any code or spec. The only file you may edit is the section map's Check
cell. Arguments: $ARGUMENTS (screen id, optional section id).

Read `.bob/rules/02-section-workflow-v1.md` first. This command checks **one section per run**.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

1. Read `docs/spec/screens/<screen-id>.md` (this section's block only), `<screen-id>.sections.md`, and
   `.bob/rules/01-spec-rules.md`. Pick the section (workflow rule 2): Build `done`, Check `pending`.
   If the spec file does not exist, stop and tell me. Read the prototype section (line range ±20) for
   exact labels and error text.

2. For every field, dropdown, button, and behaviour rule **in this section's spec block**, find the
   implementing code in `apps/retail/` or `apps/group/` and mark:
   - **Done** — correct (file + line)
   - **Missing** — not found
   - **Different** — found but diverges from spec or HTML (file + line + description)

3. Structural fidelity for this section's regions (header/ribbon/banner, cards, rows, tables):
   - text composition matches the prototype: same parts, order, separators, conditional pieces
     (`Name | Age | Gender` must not become label/value fields);
   - same element grouping/order and empty-value fallbacks;
   - any shared component used (`DetailCard`, `KeyValueTable`, `ApplicantBanner`, `CustomTable`, …)
     renders the region identically; otherwise **Different**.
   Report each deviation with file + line, the prototype's output, and the built output.

4. Also verify for this section's files:
   - labels and button text match the HTML word for word; error messages match `data-error-*`;
   - `data-testid` = `data-field-id` on every input;
   - `sx` values match the prototype's CSS (not approximated);
   - no relative cross-package imports; no bare MUI imports; no direct `mock/` JSON imports;
   - no `any` or unsafe assertions;
   - inputs have `<label>` or `aria-label`; interactive elements are keyboard-reachable.

5. Set the section's Check cell to the score (e.g. `14/15`). Reply with:
   - **Score** done / total for this section;
   - a checklist of Missing and Different items, formatted so it can be pasted into
     `/build-v1 <screen-id> <section-id>`;
   - TypeScript or accessibility issues found;
   - the next section with Check `pending`, and its command.

6. When every non-shared section has Check at 100 %, say so and remind me to set `Status: Done` in the
   spec myself. If this pattern has no reference screen in `docs/spec/screens/INDEX.md`, suggest this
   screen. Do not edit INDEX.md.
