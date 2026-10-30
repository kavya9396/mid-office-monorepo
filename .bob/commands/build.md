---
description: Step 2 — implement one approved screen as a React component in apps/retail or apps/group
argument-hint: <screen id, e.g. retail-cuw-drs>
---
Use Code mode. Screen: $ARGUMENTS

1. Open `docs/spec/screens/$ARGUMENTS.md`. If it does not say `Status: Approved`, stop and tell me.

2. Read `.bob/rules/01-spec-rules.md` and `.bob/rules-code/01-react-rules.md`.
   Read `docs/spec/02-folder-structure.md` to confirm the app target (`apps/retail` or `apps/group`)
   and the relevant `@insurance-poc/*` packages.

3. If the spec names a reference screen, read that screen's React source and follow its folder
   structure, shared-component usage, and hook patterns.
   Follow the spec's **"Component reuse (confirmed)"** table exactly: use the confirmed `[shared]` /
   `[reuse]` components, build only the `[new]` ones, and implement `[reuse-with-gap]` as the spec
   states. Do not swap a confirmed component on your own — if one turns out not to fit, stop and ask me.

4. Work through the spec's task list in order. For each task, **before writing code**, read the
   prototype section and write a short "fidelity note" (in your reply, not in code) listing:
   - the exact rendered text for each region, including concatenated strings with their
     separators and conditional parts (e.g. `Name | Age | Gender`);
   - the element order/grouping, and the empty-value fallbacks;
   - whether you will use a shared component for it — only if it renders **identically**; otherwise
     compose with `Box`/`Typography`, or stop and tell me (see spec rule 7).

   Then, for each task:
   - Implement only what the spec and HTML prototype describe — no extra features, no refactors.
   - Use `@insurance-poc/ui` components for all UI elements. Never duplicate shared components.
   - Wrap mock JSON in a service function — never import `mock/` JSON directly in a screen.
   - One React Hook Form + Zod schema per screen; set `data-testid` = `data-field-id`.
   - Copy labels, button text, and error messages **exactly** from the HTML prototype.
   - Do **not** edit other screens' files. If a shared component needs to change, stop and tell me.
   - Read `applicationNo` / `schemeId` from `useSearchParams()`.
   - **Never reshape the prototype's presentation to fit a component's data model.** A
     concatenated string in the prototype stays a concatenated string (not name/value fields);
     a ribbon stays a ribbon; a row stays a row.

5. After each task, run:
   ```
   pnpm --filter @insurance-poc/<app> typecheck
   ```
   Fix all type errors before moving to the next task. Then re-read the prototype section and
   compare it with what you built, region by region (text composition, order, separators,
   structure). Fix any difference. Tick the task in the spec only after this comparison passes.

6. Update `docs/spec/02-folder-structure.md` if the build changed the project structure. Check for:
   - New/renamed/removed files or folders under `apps/*`, `packages/*`, `mock/`, or `scripts/`.
   - New or changed exports (`packages/ui/src/index.ts`, `packages/routes/src/index.ts`,
     `packages/utils/src/index.ts`, `apps/common/package.json` `exports`).
   - New route constants, mock files, or services.

   Update both the folder tree and the matching tables/sections. If nothing changed, skip this
   step and say "no folder-structure changes".

7. Reply with:
   - What was built (files created / changed).
   - Whether `docs/spec/02-folder-structure.md` was updated (and what changed).
   - Typecheck result.
   - Remaining tasks, if any.
   - Any open questions that blocked a task.
