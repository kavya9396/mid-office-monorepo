# GUW UW Panel — Submit Validation Flow (modification spec)

> Part of the [Screen Specifications](./README.md).
> Modifies: [group-guw-informal-drs.md](./group-guw-informal-drs.md) → `GuwUwPanel` (`uw-panel`) Behaviour item 3.
> Source: user story + answers given during planning; user instruction: reuse the existing UW Guidelines
> table structure. The HTML prototype `Group/GUW Informal/guw-drs-screen-prototype.html` was updated to match.

---

## Overview

The **Submit inside the Case UW Decision dialog (Step 1)** calls a **decision-validation API**
(main-page Submit is unchanged). The response feeds the **UW Guidelines** step (Step 2), which keeps the
**existing table structure** — Reason | Remark | System Action | Justification/Checklist | Justification
Remarks — but is filled from the API response instead of `INITIAL_GUIDELINES`. Rows come from four
categories — **Justification**, **Checklist**, **Hard Alert**, **Soft Alert** — each row starting with a
category icon. If the response is `SUCCESS`, a success popup is shown instead. A **Blocker** hard alert
disables Confirm & Submit.

Files touched (expected): `apps/group/src/modules/guw/GuwUwPanel.tsx`,
`apps/group/src/services/guwService.ts` (service, types, mapper, mock selection), one new mock JSON under
`mock/`. Optional: one small presentational component under `apps/group/src/modules/guw/`.

---

## URL & Routing

No change. Screen stays at `/group/guw/drs?applicationNo=X`.

---

## Layout

Resting panel and Step 1 unchanged. Step 2 (title "UW Guidelines", same `CustomDialog`: `maxWidth="lg"`,
content `82vh`, paper `90vh`, close icon) keeps the current table markup, header styling
(`#ffead7` / `#5b261c`, 11px, borders `#eadfd9`) and column widths. Differences:

- **Leading icon** at the start of each row (inside the first cell), with tooltip + accessible label equal
  to the category name:

  | Category | Icon (`@insurance-poc/ui`) |
  |---|---|
  | Justification | `TaskIcon` |
  | Checklist | `NoteIcon` (icon not specified by the user; chosen from the existing set) |
  | Hard Alert | `DangerIcon` |
  | Soft Alert | `InfomationIcon` (declared without props in `Icons.tsx`, so its size cannot be set; wrap it for sizing) |

- Row order: Justification, Checklist, Hard Alert, then Soft Alert. Empty categories produce no rows.
- Checklist items come from the response's `checklist` array (same item shape as `justifications`: options in `reason[]`, e.g. Yes / No). They use the same dropdown + remarks columns. A reason must be chosen for each; the "Other Reason" remark rule applies to justification rows only.
- Column header **Justification/Checklist** (was "Justification Reason") with an info (i) icon tooltip: **"Select a reason for each justification and checklist item. A remark is mandatory when the justification reason is Other Reason."**
- **Blocker:** if any Hard Alert has `action = "Blocker"`, show **"User is not allowed to provide terminal decisions,please modify the decision"** (takes priority over the referral / counter sign message), **disable Confirm & Submit**; only **Back** stays enabled.
- Footer: existing **Back** (to Step 1) and **Confirm & Submit**. There is **no Save button**.
- Routing message (Scenarios 4/5) is shown above the footer.
- Row `data-testid`: `guw-guideline-<validationId>`.

---

## Component Reuse (Confirmed)

> **Pending user confirmation** — tags below are proposals.

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| Dialog shell | `CustomDialog` | `[shared]` | `@insurance-poc/ui` | Unchanged. |
| Guidelines table | existing inline `<table>` in `GuwUwPanel.tsx` (~922) | `[reuse]` | `GuwUwPanel.tsx` | Same markup; only data source and leading icon change. Not swapped for `CustomTable` / `UwGuidelines` (rule 7). |
| Dropdown / text | `CustomSelect`, `CustomTextField` | `[shared]` | `@insurance-poc/ui` | As today. |
| Category icons | `TaskIcon`, `NoteIcon`, `DangerIcon`, `InfomationIcon` + `CustomTooltip` | `[shared]` | `@insurance-poc/ui` | Per table above. |
| Header info icon | `InfoIcon` + `CustomTooltip` | `[shared]` | `@insurance-poc/ui` | In the "Justification/Checklist" column header. |
| Toast | `CustomSnackbar` via `notify()` | `[shared]` | `@insurance-poc/ui` | Messages below. |
| Success popup | new small dialog | `[new]` | `GuwUwPanel.tsx` or `GuwValidationSuccessDialog.tsx` | Text + selected decision. |
| Counter Sign pane | existing `APPROVER` pane | `[reuse]` | `GuwUwPanel.tsx` (~1732) | Back conditional (R5). |
| Raise Referral pane | existing `REFERRAL` pane | `[reuse]` | `GuwUwPanel.tsx` (~1131) | Back conditional (R5); pre-selection (R6). |
| Read-only details dialog | existing "Case UW Decision Details" dialog | `[reuse]` | `GuwUwPanel.tsx` (~2298) | Guidelines section re-rendered in the new structure. |

---

## Screens

### Submit validation flow

#### Purpose
Validate the chosen Case UW Decision, present the result in UW Guidelines, and route to Raise Referral or
Counter Sign when required.

#### Prototype file
`design-reference/ui-prototypes/Group/GUW Informal/guw-drs-screen-prototype.html` (Case UW Decision flow
section). Mirrors this spec: mock validation keyed by decision code, UW Guidelines pane, Blocker, success
popup, details dialog and post-submit redirect (`?memberCount=2` opens `./MemberSelection.html`, otherwise
`./landing-prototype.html`).

#### Data / API

**Request** (`toGuwValidationRequest`)

| Field | Value |
|---|---|
| `userId` | `getSessionUser().userId` (`@insurance-poc/utils`) |
| `role` | constant `"CUW"` in the service for now; replace when a role source exists |
| `applicationNo` | `applicationNo` prop of `GuwUwPanel` |

The request has no decision field.

**Response** (`fromGuwValidationResponse`): `applicationNo`, `correlationId`, `status` (`SUCCESS` | `FAIL`),
`referralReqd` (`Y`/`N`), `counterSignReqd` (`Y`/`N`),
`SoftAlert[] { validationId, reason, remarks }` (answered: no `alert` field, no `action`),
`HardAlert[] { validationId, reason, remarks, action }`,
`justifications[] { validationId, justificationReason, justificationRemarks, action | null,
reason[] { reasonCode, reasonText } }`,
`checklist[]` (same item shape as `justifications`; options such as Yes / No; absent → `[]`).
A `HardAlert.action` of `Blocker` stops the submission (see Layout).
The story sample shows `"status":"FAIL";` (stray `;`, invalid JSON) and a SoftAlert with `alert`; the
confirmed SoftAlert shape above supersedes the sample. Mapper rules (`02-architecture-rules.md` §6): pure,
unknown fields dropped, missing arrays → `[]`, raw DTOs never reach components.

**Endpoint:** not available. Build a mock service in `guwService.ts` wrapped with `wait(ms)`; swapping to
the real call later changes only that function.

**Mock scenarios** — the mock returns a response by the **selected Case UW Decision**, passed to the
service as a **mock-only argument** (not part of the request DTO; removed when the real call is wired):

| Decision (code) | Mock response |
|---|---|
| Standard (`STD`) | `SUCCESS` |
| Extra Premium (`EP`) | `FAIL`, soft alert only |
| Counter Offer (`CO`) | `FAIL`, soft + counter sign + **Blocker** hard alert |
| Borderline Standard (`BOR_STD`) | `FAIL`, referral + counter sign + soft |
| Reject (`REJ`) | `FAIL`, justification + soft |
| Decline (`DC`) | `FAIL`, justification + checklist + counter sign + soft |
| Postpone (`POSTP`) | `FAIL`, full sample (justification + referral + counter sign + soft) |
| Raise Referral / Hold / Counter Sign | `SUCCESS` |

Fixtures live in one JSON file under `mock/` (it invalidates the Turbo cache for all three apps) and are
typed as the DTO.

**Mapping to the existing table columns**

| Category | Reason | Remark | System Action | Justification Reason | Justification Remarks |
|---|---|---|---|---|---|
| Justification | `justificationReason` | `justificationRemarks` | `action` (null → "—") | `CustomSelect`, options = `reason[]` (`reasonCode` value, `reasonText` label) | Disabled until a reason is chosen; **mandatory only for "Other Reason" (`reasonCode` 3)** |
| Checklist | `justificationReason` | `justificationRemarks` | `action` (null → "—") | `CustomSelect`, options = `reason[]` (e.g. Yes / No) | Disabled until a reason is chosen; optional |
| Hard Alert | `reason` | `remarks` | `action` | locked | locked, placeholder "Not applicable" |
| Soft Alert | `reason` | `remarks` | "—" (no action in API) | locked | locked, placeholder "Not applicable" |

#### Behaviour & interactions

**Texts (answered)**
- Success popup: **"Decision validated successfully"** and **"Selected decision: <label>"** (label from `ALL_DECISION_OPTIONS`).
- Justification-incomplete error (`notify`, error): **"Please select a reason for all justifications and checklists"**.
- Blocker message (shown above the footer, replaces the referral / counter sign message):
  **"User is not allowed to provide terminal decisions,please modify the decision"** (no space after the comma, as given).
- Referral message: **"User is not allowed to provide terminal decisions, please refer the case to {targets}"**.
- Counter sign message: **"User is not allowed to provide terminal decisions, please counter sign the case"**.
- `{targets}`: `HardAlert.action` values starting "Refer to" → strip prefix, remove duplicates, keep response
  order, join with ", " → sample gives **"HOD, CMO, Reinsurer"**. The table lists all hard-alert rows,
  including "Counter Sign".

**Scenario 1 — `SUCCESS`:** success popup. Closing it calls `onDecisionSubmit` (stub), shows the toast
"Decision submitted successfully" and redirects after 700 ms (today's `finalizeSubmit` behaviour; the real
final-submit API comes later). Redirect target: **Group Inbox** for a single-life case; for a **multi-life**
case (`memberCount > 1` in the DRS URL) the **GUW member summary page** (`/guw/member-selection`, same
`applicationNo` / `roleType` / `role`). `GuwDrsPage` builds the URL and passes it as `redirectUrl`.

**Scenario 2 — `FAIL`, soft alerts only:** UW Guidelines shows the Soft Alert row(s); the
"Confirm & Submit" button performs the final submit (same path as Scenario 1's close).

**Scenario 3 — `FAIL` with justifications / checklist:** Justification and checklist rows are fillable. There
is no Save button. "Confirm & Submit" is blocked until every justification and checklist row has a reason and
"Other Reason" justification rows have a remark; otherwise show the error above. Selections are held in
`sessionStorage` when the flow moves on (no API; the database persist happens only after final task closure).

**Scenario 4 — `referralReqd = Y`:** all non-empty categories shown plus the referral message;
"Confirm & Submit" (after justification gating) opens the existing **Raise Referral** pane (same as the
main-page button).

**Scenario 5 — `referralReqd = N`, `counterSignReqd = Y`:** same, with the counter sign message; it opens
the existing **Counter Sign** pane.

**Cross-cutting rules**

| # | Rule |
|---|---|
| R1 | Justification and checklist rows are always shown and fillable when present, in every FAIL scenario. There is no Save button. |
| R2 | Referral path: the Case UW Decision is **reset only when the referral is finally submitted**. Until then the decision is kept so Back can restore it. |
| R3 | Counter Sign path: the Case UW Decision is persisted (kept as base decision, as `approverBaseDecision` does today). |
| R4 | `referralReqd = Y` always wins over `counterSignReqd = Y`. |
| R5 | **Back** on Counter Sign / Raise Referral is shown **only when opened from the Case UW Decision → UW Guidelines flow**, hidden when opened from the main-page action buttons (needs an explicit "opened-from" state). Back returns to the **UW Guidelines** step with saved justifications intact. |
| R6 | Raise Referral **pre-selection**: select **only one row**, the first match in priority order **CMO / other → Sr UW Opinion → HOD Opinion → Reinsurer**. Mapping from `HardAlert.action`: "Refer to CMO" → CMO; "Refer to Sr UW" → Sr UW Opinion; "Refer to HOD" → HOD Opinion; "Refer to Reinsurer" → Reinsurer; any other "Refer to X" where X equals a row name (IT, Risk, Accuity, CUW Claim, HO CMO, Tele MER, Video MER) → that row, counted as "other" (same top priority as CMO, response order decides between them). Unmatched text and "Counter Sign" are ignored. The user can change the selection. Sample (HOD, CMO, Reinsurer) → CMO. |

**Persistence:** saved justification selections, together with the validated rows, go with the decision
snapshot (`GuwSubmittedDecision`, `sessionStorage` key `guwSubmittedDecision:<applicationNo>`) through a new
optional field.

**Read-only "Case UW Decision Details" dialog (eye icon):** the guidelines section follows the **new
structure**: same table with the leading category icons, built from the rows saved at validation time,
including the saved justification reason and remark. *Assumption (not explicitly answered):* a snapshot
saved before this change has no new rows and keeps rendering its old `guidelines` list unchanged.

#### Accessibility notes
- `CustomDialog` focus trap / Esc as today.
- Category icons carry a text alternative (category name); meaning is never conveyed by the icon alone.
- Row `data-testid`: `guw-guideline-<validationId>`.

---

## Existing code impact

- `INITIAL_GUIDELINES` / `GuidelineRow` stay: they are imported by `GuwDrsPage.tsx` (lines 12, 52) and
  `apps/group/src/modules/drs/GuwUser.tsx` (lines 16, 132) for the shared `UwGuidelines` component. Only
  `GuwUwPanel`'s own Step 2 data source changes. In the HTML prototype the separate "UW Guidelines (7)"
  button viewer keeps its static list for the same reason.
- `GuwDrsPage.tsx` reads `memberCount` / `roleType` / `role` from the URL and passes `redirectUrl` to
  `GuwUwPanel` (default `groupPaths.inbox`).
- In `GuwUwPanel.tsx`, affected: `guidelines` state (set at ~439 from `INITIAL_GUIDELINES`),
  `handleGuidelinesConfirm`, `hasCounterSignAction`, `hasOtherReferralAction`, `guidelinesConfirmed`,
  `switchToActionDecision`, `handleDialogSubmit` (Step 1 Submit now calls the validation), the Step 2 table,
  and the details dialog guidelines block (~2480).
- The earlier change removed the Step 1 footer Back, `backToGuidelines()` and `previousDecisionRef`; R5
  needs a new conditional Back built against this flow.

---

## Implementation breakdown (one reviewable step at a time)

| # | Sub-task | Intent | Status |
|---|---|---|---|
| 1 | Types + mapper + mock service | DTO/domain types, `toGuwValidationRequest`, `fromGuwValidationResponse`, `validateGuwDecision()` with `wait(ms)`, mock JSON for all decisions above, snapshot field for validated rows + saved justifications. | `[x] done` |
| 2 | UW Guidelines table from response | Replace Step 2 data source; column mapping; leading icons + tooltips; locked rows; header info tooltip; `data-testid`. | `[x] done` |
| 3 | Step 1 Submit → validation → view routing | Call the service on dialog Submit; success popup; soft-only final submit; loading/error. | `[x] done` |
| 4 | Justification gating, persistence | "Other Reason" remark rule, error text, session persistence. The Save button was later removed. | `[x] done` |
| 5 | Referral / Counter Sign routing | Messages, R4 priority, open panes, R6 pre-selection, R2/R3, conditional Back (R5). | `[x] done` |
| 6 | Details dialog + spec sync | Details dialog in the new structure; align `group-guw-informal-drs.md` Behaviour item 3. | `[x] done` |
| 7 | Checklist, Blocker, header rename | `checklist[]` rows with `NoteIcon`; Blocker hard alert disables Confirm & Submit; column header "Justification/Checklist". | `[x] done` |
| 8 | Multi-life redirect | `GuwDrsPage` passes `redirectUrl`; member selection page when `memberCount > 1`, else Inbox. | `[x] done` |
| 9 | Prototype sync | `design-reference/ui-prototypes/Group/GUW Informal/guw-drs-screen-prototype.html` mirrors steps 1–8 (mock validation, success popup, details dialog, redirect). | `[x] done` |

Validation per step: `npx tsc --noEmit -p apps/group` (`pnpm` is not on PATH in the current shell; the
project command is `pnpm --filter @insurance-poc/group typecheck`).

---

## Open Questions

1. Old snapshots (saved before this change) keep their old `guidelines` rendering in the details dialog —
   assumption in "Read-only … dialog" above; confirm or correct.
2. Which button moves from UW Guidelines to Raise Referral / Counter Sign — assumed to be
   "Confirm & Submit" (the only forward button in the footer). Confirm or give a different label.
3. Real endpoint (URL, method, headers, error format) and the real role source remain unknown; mock +
   constant `"CUW"` until provided.
4. Checklist icon was not specified — `NoteIcon` is used. Confirm or name another icon.
5. The "summary page" for a multi-life redirect is assumed to be the GUW member selection page
   (`/guw/member-selection`). Confirm or give the intended page.
6. Blocker is matched on `HardAlert.action` equal to `Blocker` (case-insensitive). Confirm the exact value
   the real API sends.

Resolved: mock scenarios, SoftAlert shape, icons, texts, `{targets}`, reset/Back rules,
referral pre-selection, details dialog structure, success/redirect behaviour, validation entry point,
checklist location in the response (`checklist[]`), no Save button.

Status: Draft
