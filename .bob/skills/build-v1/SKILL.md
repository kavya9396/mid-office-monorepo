---
name: build-v1
description: >-
  v1 Step 2 — implement ONE section of an approved screen as React code, then
  stop
metadata:
  user-invocable: true
  disable-model-invocation: true
  argument-hint: '<screen-id> [section-id]'
---

Use Code mode. Arguments: $ARGUMENTS (screen id, optional section id).

Read `.bob/rules/02-section-workflow-v1.md` first and follow it. This command builds **one section per
run**.
**Questions: ask every one with `ask_followup_question`, one question per turn (workflow rule 12). Stop after each and wait for the answer; never batch them.**

1. Open `docs/spec/screens/<screen-id>.md`. If it does not say `Status: Approved`, stop and tell me.
   Open `<screen-id>.sections.md`; pick the section (workflow rule 2): Build cell `pending`, Spec `done`.
   `[shared]` sections are not built — mark Build `n/a`.

2. Read `.bob/rules/01-spec-rules.md`, `.bob/rules-code/01-react-rules.md`, and the section's block in
   the spec (its Component tree, Data / API, Behaviour, task list, and its "Component reuse
   (confirmed)" rows). Read `docs/spec/02-folder-structure.md` only to confirm the app target and
   package paths.

3. If the spec names a reference screen, read **only the matching section/component** of that
   screen's React source and follow its folder structure, shared-component usage, and hook patterns.
   Follow the confirmed tags exactly: use `[shared]`/`[reuse]`, build `[new]`, implement
   `[reuse-with-gap]` as stated. If a confirmed component does not fit, stop and ask me.

4. Work through this section's tasks in order. **Before writing code** for each task, read the
   prototype section (line range ±20) and write a short fidelity note in your reply:
   - exact rendered text per region, including concatenated strings with separators and conditional parts;
   - element order/grouping and empty-value fallbacks;
   - shared component only if it renders **identically**; otherwise compose with `Box`/`Typography`,
     or stop and tell me.

   Then implement only what the spec and prototype describe for this section:
   - one component per section, named from the section id, in its own file; the screen page only
     composes sections (add this section's `<Component />` to the page; do not rewrite other sections);
   - `@insurance-poc/ui` components for all UI; no bare MUI; no duplicated shared components;
   - mock JSON only through a service function; never import `mock/` in a screen;
   - React Hook Form + Zod: **extend** the screen's single schema with this section's fields
     (create it if this is the first form section); `data-testid` = `data-field-id`;
   - labels, button text, and error messages copied exactly from the prototype; `sx` values verbatim
     (only `#e45f14` → `theme.palette.primary.main`);
   - `applicationNo` / `schemeId` from `useSearchParams()`;
   - never reshape the prototype's presentation to fit a component's data model;
   - do not edit other screens' or other sections' files except the minimal composition line in the
     screen page and the shared schema/service additions. If a shared component must change, stop and tell me.

5. After each task run `pnpm --filter @insurance-poc/<app> typecheck`. Fix all errors. Then re-read the
   prototype section and compare region by region (text composition, order, separators, structure).
   Fix differences. Tick the task in the spec only after this passes.

6. Update `docs/spec/02-folder-structure.md` only if files, exports, routes, mocks, or services changed
   (new/renamed/removed files, changed exports, new route constants). Otherwise say
   "no folder-structure changes".

7. Set Build to `done` in the section map. Reply with: files created/changed, folder-structure update
   status, typecheck result, remaining tasks in this section, open questions that blocked anything, the
   next pending section, and the commands `/check-v1 <screen-id> <section-id>` and
   `/build-v1 <screen-id> <next-section-id>`.
