---
description: Implement one API integration from design-reference/Integration (reads the integration .md and its OpenAPI file)
argument-hint: <integration-name, e.g. bre-retrigger> [sub-task number] [add-on: extra info or changed requirements]
---
Target: $ARGUMENTS

## Reading the arguments

1. First word = integration name.
2. An optional number right after it = sub-task to run.
3. Everything else (free text, or text after `add-on:`) = **add-on info**: extra or changed requirements
   the user wants applied on top of the `.md` (new steps, field mappings, answers to open questions,
   behaviour changes, a different mock/URL/headers rule, etc.). The add-on may be empty.

Folder: `design-reference/Integration/`. Each integration has:
- `<name>.md` — flow, decisions, sub-tasks, open questions (the plan)
- `<name>.openapi.v<version>.<YYYY-MM-DD>.yaml` — API contract. If several exist, use the highest version, then latest date.
- Any raw supporting file (e.g. `<name>.txt`) is input only; never import or ship it.

## Steps

1. Read `<name>.md` and the OpenAPI file. If either is missing, stop and say which.
2. Read `AGENTS.md`, `.bob/rules/02-architecture-rules.md` and `.bob/rules-code/01-react-rules.md`.
2a. **Apply add-on info first (skip if none).** Before writing any code:
   - Append a row to the `## Add-on requests` table in `<name>.md` (create the section above `## Sub-tasks` if missing): number, today's date, the add-on in short, its effect, and which sections/sub-tasks it changes.
   - Update the affected sections of the `.md` (request rules, mapping table, sub-tasks, open questions) so the `.md` stays the single source of truth. Add new sub-tasks at the end, or re-open a `[x] done` one as `[ ] pending` with a note when the add-on changes work already done.
   - If the add-on changes the API contract (URL, fields, request/response shape), also create a new OpenAPI file: bump the version in the name (`v1.0.0` -> `v1.1.0`), use today's date, keep the old file. Move/rename the mock to match: `mock/<name>/<name>.v<new version>.mock.json`.
   - If the add-on contradicts a "decided" item, or answers an open question, do not guess: confirm with `ask_followup_question` (one question per turn) and record the answer. Mark answered open questions as resolved in the `.md`.
   - If the add-on only restates what the `.md` already says, record it as "no change needed" and continue.
3. Pick the sub-task: the number given, otherwise the first one marked `[ ] pending` or `[-] in progress`. Do **one sub-task per run**.
4. Follow the repo's existing API pattern before writing code:
   - URLs from `.env` via a getter in `packages/utils/src/config/appConfig.ts`; add the new variable to `.env.example`. Never edit `.env`.
   - Calls go through RTK Query + `createBusinessBaseQuery` (see `apps/group/src/services/drsApi.ts`). Use `encryptRequest` / `decryptResponse` exactly as the integration `.md` says.
   - `useMock` returns a mock JSON kept in the repo-root `mock/` folder at `mock/<name>/<name>.v<spec version>.mock.json`; only the service/API file imports it, screens never do.
   - Session values only through `@insurance-poc/utils` helpers (e.g. `getSessionBusinessType()`), never `sessionStorage` directly.
   - Workspace package names only; no relative cross-package imports.
5. Never invent endpoints, fields, enum values or mappings. Anything not in the `.md` or OpenAPI file, and every item under "Open questions", is **not built**. Ask the user with `ask_followup_question`, one question per turn, with concrete suggested answers, and record the answer in the `.md`.
6. Edit only files the sub-task names. Use `apply_diff` / `insert_content` on existing files. Do not change shared components in `packages/ui` or `apps/common`; report instead.
7. Validate: `pnpm typecheck` and any tests added; for a sub-task that touches several apps also run `pnpm verify:deployments`.
8. Update the sub-task's Status in `<name>.md` to `[x] done` and add any context the next sub-task needs.
9. When every sub-task is done, ask the user whether to delete the raw supporting file(s) in the Integration folder (e.g. `bre.txt`), then delete only if they confirm.
10. Reply with: sub-task done, files changed, validation result, open questions still blocking, and the exact command for the next sub-task (`/integrate-api <name> <n>`).

## Adding a new integration

Create `design-reference/Integration/<name>.md` (copy the structure of `bre-retrigger.md`, including the `## Add-on requests` section) and the OpenAPI file named `<name>.openapi.v<version>.<today's date>.yaml`, then run this command.
Raw input (curl, sample JSON, notes) can also be passed as add-on text or dropped into the Integration folder as `<name>.txt`; the command turns it into the `.md` and OpenAPI file, then offers to delete the raw file.

## Examples

- `/integrate-api bre-retrigger` — next pending sub-task.
- `/integrate-api bre-retrigger 4` — run sub-task 4 only.
- `/integrate-api bre-retrigger add-on: also show a snackbar "BRE retriggered" on success` — records the add-on in the `.md`, updates sub-task 5, then runs the next pending sub-task.
- `/integrate-api bre-retrigger 5 add-on: discrepancy comes from <field>` — resolves open question 1, then runs sub-task 5.
