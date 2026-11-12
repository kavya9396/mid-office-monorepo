---
description: Interactive guide — walks one workstream or screen through annotate → inventory → spec → approve → build / build-like → check, asking before each step
argument-hint: <screen id or prototype folder — optional, e.g. retail-mas-drs or design-reference/ui-prototypes/Retail/MAS/>
---
Orchestrator. Target: $ARGUMENTS

You do not implement anything yourself in this command. You detect the current state, ask me which
step to run next, then **execute that step by following its command file exactly**:

| Step | Command file to follow | Mode |
|---|---|---|
| Annotate | `.bob/commands/annotate.md` | Code |
| Inventory | `.bob/commands/inventory.md` | Ask (writes INDEX.md only) |
| Spec | `.bob/commands/spec.md` | Plan |
| Build | `.bob/commands/build.md` | Code |
| Build-like | `.bob/commands/build-like.md` | Plan, then Code |
| Check | `.bob/commands/check.md` | Ask (no code changes) |

Switch mode (`switch_mode`) when a step needs a different one. Use `ask_followup_question` for
every question below — one question per turn, then wait for my answer. Never run a step I have not
chosen. Never set `Status: Approved` or `Status: Done` yourself — only I do that.

---

## Phase 0 — Detect state (read-only)

1. If `$ARGUMENTS` is empty, ask which workstream or screen I want to work on. Offer the workstreams
   from `.bob/rules/01-spec-rules.md` (workstream → prototype directory map).
2. Resolve the target to a prototype folder and/or screen id(s). Then check, without changing anything:
   - Prototype annotated? (`data-screen` present; `*.original.html` exists) — use `grep`.
   - `docs/spec/screens/INDEX.md` exists? Does it list this workstream?
   - `docs/spec/screens/<screen-id>.md` exists? Read its `Status:` line and "Open questions".
   - Is the screen built? (look in `apps/retail` / `apps/group` `src/modules/`)
   - Is there a finished reference screen of the same pattern (`Status: Done`/`Built`) in INDEX.md?
3. Print a short status table (stage | state), then recommend the next step.

---

## Phase 1 — Choose a path (ask)

Ask: **"What do you want to do next?"** with options that fit the detected state, for example:
- Annotate the prototype(s)
- Inventory the folder (write INDEX.md)
- Write / update the spec
- Build the approved screen
- Build-like from a finished reference screen
- Check the built screen
- Show the full sequence and stop

Put the recommended option first. Only offer **Build** if the spec says `Status: Approved`; only
offer **Build-like** if a qualifying reference exists (`Status: Done`/`Built`, `/check` 100 %).
If the option is not allowed yet, say why and offer the step that unblocks it.

---

## Phase 2 — Run the chosen step

Follow the matching command file with the same arguments I would have given it:

- **Annotate** → folder or file. Respect the 10-file limit. Afterwards go to the gate below.
- **Inventory** → folder. Afterwards offer Spec.
- **Spec** → screen id or folder (8 screens per batch). Afterwards go to the gate below.
- **Build** → screen id. Includes the per-task fidelity note, prototype comparison, and the
  `02-folder-structure.md` update step.
- **Build-like** → ask me for the new screen id and the reference screen id (suggest from INDEX.md
  pattern groups), and whether to use `--go`. Only pass `--go` if I say so.
- **Check** → screen id.

### Gates (ask before moving on)

- **After Annotate:** "Review the HTML and answer the `data-todo` items. Ready to continue to Spec?"
  Options: Continue to Spec / Inventory first / Stop here.
- **During Spec / Build-like (Part 1):** the step must stop and show the **component reuse table**
  (region | component | tag | source | fidelity note) and ask me to confirm or correct it before
  the spec file is written. Do not skip or auto-confirm this. Show the confirmed table again in
  the summary.
- **After Spec:** list the "Open questions". Ask: "Resolve these, then approve?" Options:
  I will resolve and set `Status: Approved` myself, then continue / Answer questions now (record
  answers in the spec, still `Draft`) / Stop here. Re-read the spec status before offering Build.
- **After Build:** show typecheck result and the folder-structure update note. Ask: "Run Check
  now?" Options: Run Check / Continue with remaining tasks / Stop here.
- **After Check:**
  - Score < 100 % → show the Missing/Different checklist. Ask: "Fix these with Build now?"
    Options: Build with this checklist / Stop here. After the build, offer Check again.
    **Loop Build → Check until the score is 100 %.**
  - Score = 100 % → tell me to set `Status: Done` in the spec myself, then ask: "Spec and build
    the next screen with Build-like?" Options: Yes, use this screen as the reference / Pick another
    next step / Finish.

---

## Phase 3 — Repeat or finish

After each step, return to Phase 1 with the updated state until I choose **Finish** or **Stop here**.
When stopping, print:
- Steps completed this session.
- Current state of the target (annotated / spec status / built / check score).
- The exact slash command to resume (e.g. `/pipeline retail-mas-drs`).

---

## Rules

- One screen at a time for Build, Build-like, and Check. Spec and Annotate may take a folder batch.
- Follow `.bob/rules/01-spec-rules.md` (including rule 7: render structure must match the prototype)
  and `.bob/rules-code/01-react-rules.md` inside every step.
- If any step stops with a blocker (not Approved, shared component needs changing, unresolved
  question), report it and return to Phase 1 — do not work around it.
- Do not duplicate step logic here. If a step's behaviour needs to change, edit its own command file.
