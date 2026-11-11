---
description: v1 Interactive guide — walks one screen section by section through annotate → spec → approve → build → check, asking before each step
argument-hint: <screen-id or prototype file — optional, e.g. retail-mas-drs>
---
Orchestrator. Target: $ARGUMENTS

Read `.bob/rules/02-section-workflow-v1.md` first. You do not implement anything yourself. You detect
state, ask which step to run next, then **execute that step by following its `-v1` command file exactly**
for **one section**:

| Step | Command file | Mode |
|---|---|---|
| Map / Inventory | `.bob/commands/inventory-v1.md` (`--sections`) | Ask |
| Annotate | `.bob/commands/annotate-v1.md` | Code |
| Spec | `.bob/commands/spec-v1.md` | Plan |
| Build | `.bob/commands/build-v1.md` | Code |
| Build-like | `.bob/commands/build-like-v1.md` | Plan, then Code |
| Check | `.bob/commands/check-v1.md` | Ask |

Switch mode with `switch_mode` when needed. Use `ask_followup_question` for every question — one per
turn. Never run a step I have not chosen. Never set `Status: Approved` or `Status: Done` yourself.

## Phase 0 — Detect state (read-only)

1. If `$ARGUMENTS` is empty, ask which workstream or screen (offer the workstreams from
   `.bob/rules/01-spec-rules.md`).
2. Check without changing anything:
   - section map `docs/spec/screens/<screen-id>.sections.md` exists?
   - prototype annotated (`grep` `data-screen`; `*.original.html` exists)?
   - spec exists; its `Status:` line and open-question count (grep, do not read all of it)?
   - screen built (look in `apps/*/src/modules/`)? finished reference of the same pattern in INDEX.md?
3. Print the section map table as the status view (one row per section, columns Annotate / Spec /
   Build / Check) and recommend the next step **for the next pending section**.

## Phase 1 — Choose (ask)

Ask "What do you want to do next?" with options that fit the state, recommended first, for example:
create/confirm the section map; annotate section `<id>`; spec section `<id>`; build section `<id>`
(only if spec `Status: Approved`); build-like section `<id>` (only if a qualifying reference exists);
check section `<id>`; show the sequence and stop. If an option is not allowed yet, say why and offer
the step that unblocks it.

## Phase 2 — Run the chosen step for one section

Follow the matching `-v1` command file with the arguments I would have given it (`<screen-id>
<section-id>`). Gates:

- **After Annotate (section):** "Review the HTML and answer the `data-todo` items. Continue?" Options:
  Spec this section / Annotate next section / Stop here.
- **During Spec / Build-like:** the component reuse table for the section must be shown and confirmed
  by me before anything is written. Never skip or auto-confirm.
- **After Spec (last section):** list the screen's open questions. Ask: I will resolve and set
  `Status: Approved` myself / Answer questions now (record in spec, still Draft) / Stop here.
- **After Build (section):** show typecheck and folder-structure note. Ask: Run Check on this section /
  Build next section / Stop here.
- **After Check (section):** score < 100 % → show the checklist and ask "Fix with Build now?" (loop
  Build → Check for the same section until 100 %). Score = 100 % → move to the next pending section.
  When all sections are 100 %, tell me to set `Status: Done` myself.

## Phase 3 — Repeat or finish

Return to Phase 1 with the updated section map until I choose Stop. When stopping print: steps done this
session, the section map, and the exact command to resume (e.g. `/pipeline-v1 retail-mas-drs`).

## Rules

- One section of one screen per step. Never batch sections.
- If a step hits a blocker (not Approved, shared component must change, unresolved question), report it
  and return to Phase 1 — do not work around it.
- Do not duplicate step logic here; change behaviour in the step's own command file.
