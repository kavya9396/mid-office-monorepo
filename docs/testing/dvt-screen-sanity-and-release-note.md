# Group DVT (Informal) DRS — Sanity Scenarios & Release Note

Source: [`DvtUser.tsx`](../../apps/group/src/modules/drs/DvtUser.tsx) and the services it calls.
Status of this document: Draft (reviewer approves).

---

## 1. Environment snapshot for this build

| API | Called from | Observed status | Effect on DVT screen |
|---|---|---|---|
| Claim task | Group Inbox (`GroupInboxPage`) | Working | Case can be claimed and opened |
| DRS fetch | `useGetGroupDrsQuery` | Working | DVT DRS screen loads with real data |
| BRE retrigger | `useRetriggerGroupBreMutation` | **Failing — CORS** | BRE Retrigger cannot be completed |
| PAN NSDL validate | `useValidateNsdlPanMutation` | **Failing — CORS** | PAN cannot be validated |
| Complete task | `useCompleteGroupTaskMutation` | **Failing — 503** | Decision cannot be submitted; case stays open |

Notes:
- A CORS failure is a browser-level block (`TypeError: Failed to fetch`). It is fixed by allowing the UI origin on the
  API gateway / Apigee, not by a UI change. The request may never reach the backend, so check the Network tab for a
  failed pre-flight (`OPTIONS`).
- 503 means the service responded but is unavailable. It needs the backend or infra team.
- Browser: Chrome/Edge, one tab. Start with `pnpm dev` and open `http://localhost:5183` (never `:5184`/`:5185`).
  Set `VITE_USE_MOCK=false` for the real-API run.
- Login user for Group: `UW002` (or `UW003`). Role is DVT (`role=DVT`, screen type `DVT_INFORMAL`).

---

## 2. Sanity scenarios

Result column: P = Pass, F = Fail, B = Blocked. **Expected** reflects the current code and the API state above.

### A. Inbox → claim → open DVT DRS (APIs working)

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S01 | Login as Group user | Open `/login`, Group tab, sign in as `UW002` | Lands on Group Inbox | |
| DVT-S02 | Claim a DVT task | Inbox → pick a DVT task → Claim | Claim succeeds, no error message, task becomes openable | |
| DVT-S03 | Open DVT DRS | Open the claimed case | Loader "Loading application" shows, then the DRS renders at `/app/<applicationNo>/drs` | |
| DVT-S04 | DRS with unknown application | Open `/app/INVALID123/drs` | No blank screen; text "Unable to load the Group DRS." (or API message) shows | |
| DVT-S05 | Session guard | Clear session storage, reload DRS URL | Redirected to login | |

### B. DRS content (DRS fetch working)

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S06 | Detail cards | Observe the top of the page | Four cards in order: Application Detail, Source Detail, Group Detail, Risk Detail, populated from the DRS response | |
| DVT-S07 | Quick Links | Observe Quick Links | Links per DVT config: Previous Policy, Open Task, Audit Trail (plus Applicant Profile as dialog) | |
| DVT-S08 | Applicant Profile dialog | Quick Links → Applicant Profile | Dialog opens with applicant data; closes on close | |
| DVT-S09 | Quick link navigation | Click Previous Policy / Open Task / Audit Trail | Each page opens; back returns to the DRS without losing the case | |
| DVT-S10 | BRE Decision bar | Observe BRE Decision bar | Shows Initial and Final decision; "BRE Retrigger" and view-detail actions present | |
| DVT-S11 | BRE detail dialog | Click view detail | Dialog "BRE Decision" shows Initial vs Final table; Decision and Discrepancy differences highlighted; close works | |
| DVT-S12 | Requirement Management | Observe the table | Requirements listed, ordered by status; Add / Edit / Remove controls visible | |
| DVT-S13 | Life Assured | Observe applicant sections | Each applicant section shows personal fields with Edit, View Medical, View Financial actions | |
| DVT-S14 | Decision section | Observe the decision row | DVT Remarks, DVT Decision dropdown, Decision Code and Submit button present. Dropdown options come from master data (`DVT_TERM_DESC`), else from the DRS response | |
| DVT-S15 | Default decision code | Load a case with a default decision code in the DRS | Decision Code is pre-filled | |

### C. Medical and Financial sub-pages

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S16 | View Medical | Life Assured → View Medical | Route `/app/<no>/drs/medical`; selected applicant pre-selected; summary cards shown; Back returns to DRS | |
| DVT-S17 | View Financial | Life Assured → View Financial | Route `/app/<no>/drs/financial`; financial sections load for the applicant; Back returns to DRS | |
| DVT-S18 | Switch applicant on Financial | Change applicant in the selector | Data reloads for the chosen applicant; URL unchanged apart from route state | |

### D. BRE Retrigger (API failing — CORS)

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S19 | Retrigger shows progress | Click BRE Retrigger | Full-screen loader "Retriggering BRE" shows | |
| DVT-S20 | Retrigger fails on CORS | Wait for the call to fail | Loader closes, page stays usable. Snackbar shows the error text (browser message, e.g. "TypeError: Failed to fetch"). Final BRE status is cleared. Initial values remain unchanged | **F — environment (CORS)** |
| DVT-S21 | No count update on failure | After S20 click Retrigger again | The call is attempted again (retrigger count is only stored on a successful response) | |
| DVT-S22 | Retrigger limit dialog | Only testable once the API works: after the API reports a count above 3, click Retrigger | No API call; dialog "BRE Retrigger — Kindly raise ticket with IT team"; Ok returns to Inbox | **B — needs CORS fix** |
| DVT-S23 | Retrigger success | Only testable once the API works | Final decision, remarks, discrepancy, timestamp update; the BRE bar Final value updates | **B — needs CORS fix** |

### E. PAN validation with NSDL (API failing — CORS)

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S24 | Open Edit Applicant | Life Assured → Edit | Edit dialog opens with applicant values; NSDL match fields and "Is PAN Valid?" are read-only | |
| DVT-S25 | PAN field validation | Clear PAN or enter an invalid format, click NSDL | Inline field error; NSDL API is not called | |
| DVT-S26 | NSDL fails on CORS, no pending PAN pendcode | Enter valid PAN and birth date → NSDL | Error notice: the API/browser error text followed by "Please raise a PAN pendcode." "Is PAN Valid?" stays/sets to No | **F — environment (CORS)** |
| DVT-S27 | NSDL fails on CORS, PAN pendcode already pending | Use a case with a pending PAN requirement → NSDL | Error notice shows the error text only (no pendcode prompt) | **F — environment (CORS)** |
| DVT-S28 | Save without validation | After S26, click Save | Blocked with "Please validate PAN with NSDL before saving" | |
| DVT-S29 | Edit PAN after validation | (needs working API) validate, then change PAN or birth date | "Is PAN Valid?" resets to No | **B — needs CORS fix** |
| DVT-S30 | NSDL success | (needs working API) valid PAN | Success notice; Is PAN Valid = Yes; Name / DOB / Aadhar match fields filled | **B — needs CORS fix** |
| DVT-S31 | NSDL says PAN invalid | (needs working API) invalid PAN | Case submission is blocked later (see S34) | **B — needs CORS fix** |

### F. Decision submit / Complete task (API failing — 503)

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S32 | Submit with no decision | Leave decision empty → Submit | No navigation; message "Select a decision before submitting." | |
| DVT-S33 | Submit when task details are missing | Open DRS by direct URL (not from Inbox) → Submit | No navigation; message "Task details are missing. Open the case from the inbox and try again." | |
| DVT-S34 | Submit blocked by invalid PAN | (needs working NSDL) after S31 click Submit | Error snackbar: "We couldn't verify the PAN with NSDL. Please correct the PAN details and validate them again before submitting this case." Complete task is not called | **B — needs CORS fix** |
| DVT-S35 | Submit returns 503 | Select decision, add remarks → Submit | Submit button is disabled while the call is in flight. After the 503: user stays on the DRS (no navigation to Inbox), Submit is enabled again, entered decision and remarks are kept | **F — environment (503)** |
| DVT-S36 | 503 message | Same as S35 | If the response body carries a message, it shows in a snackbar. **If the body has no message, nothing is shown** (see Known Issue KI-04) | **F — environment (503)** |
| DVT-S37 | Retry after 503 | Click Submit again | A fresh call is made; no duplicate task state | |
| DVT-S38 | Submit success | (needs working API) | Task ids cleared, redirected to `/inbox`, BRE retrigger count cleared | **B — needs 503 fix** |
| DVT-S39 | Back to Inbox after 503 | Navigate to Inbox manually | Task still listed as claimed/open (not completed) | |

### G. Cross-cutting

| ID | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| DVT-S40 | Session expiry | Let the token expire (401) and call any API | Session cleared, redirected to login | |
| DVT-S41 | Reload on DRS | Refresh the DRS page | Case reloads; BRE final overrides reset | |
| DVT-S42 | Switch case | Open a different application | BRE retrigger overrides reset to that case's values | |
| DVT-S43 | Logout | Header → Logout | Returns to login; session keys cleared | |

---

## 3. Sanity exit criteria for this build

- **Pass** — A, B, C fully pass; S19, S21, S24, S25, S28, S32, S33, S35 (stay on screen, no crash), S37, S39–S43 pass.
- **Fail, accepted (environment)** — S20, S26, S27, S35/S36 failures are caused by CORS (BRE, NSDL) and 503 (Complete task), not by UI defects.
- **Blocked until environment is fixed** — S22, S23, S29, S30, S31, S34, S38. Re-run after fixes.
- **Sign-off recommendation** — conditional: the screen can be released for **view and review**; the **decision submission, BRE retrigger and PAN validation** flows cannot be signed off.

---

# Release Note — Group DVT (Informal) DRS Screen

**Application:** Mid-Office — Group
**Screen:** DVT DRS (`/app/:applicationNo/drs`, role `DVT`, screen type `DVT_INFORMAL`)
**Release type:** Conditional / partial (environment dependencies open)
**Date:** ____ **Build / Version:** ____ **Prepared by:** ____

## What is in this release

1. **DVT DRS page** loaded from the DRS fetch API: Application, Source, Group and Risk detail cards.
2. **Quick Links** — Previous Policy, Open Task, Audit Trail, and Applicant Profile (dialog).
3. **BRE Decision bar** with Initial/Final decision, detail comparison dialog (differences highlighted) and BRE Retrigger action. Retrigger is limited: when the last reported count is above 3 the API is not called and the user is told to raise an IT ticket, then returned to the Inbox.
4. **Requirement Management** table with status ordering.
5. **Life Assured** per-applicant sections with Edit Applicant, View Medical and View Financial.
6. **Edit Applicant — NSDL PAN validation**: validates PAN and birth date, fills Name / DOB / Aadhar match fields, resets the PAN-valid flag when PAN or birth date changes, and prompts "Please raise a PAN pendcode." when NSDL is unavailable and no PAN pendcode is pending.
7. **Case-submission guard**: submission is refused if NSDL reported any applicant's PAN as invalid.
8. **Decision section**: DVT Remarks, DVT Decision (options from master data `DVT_TERM_DESC`, falling back to the DRS response), Decision Code, Submit. Submit is disabled while in flight and on success the user returns to the Inbox.
9. **Medical and Financial sub-pages** with applicant switching; Financial section save is wired to its API.
10. Group Inbox claim-task works end to end.

## Verified working

- Claim task API
- DRS fetch API (screen renders with live data)
- Navigation between DRS, Medical, Financial and Quick Link pages

## Known issues / limitations

| ID | Area | Issue | Cause | Impact | Owner / Action |
|---|---|---|---|---|---|
| KI-01 | BRE Retrigger | Call fails with a CORS error | Gateway does not allow the UI origin or pre-flight for this endpoint | Final BRE decision cannot be refreshed. Page remains usable; error snackbar shown | API/Infra: enable CORS (origin, `OPTIONS`, headers `Authorization`, `Content-Type`, `accept`) for the BRE endpoint |
| KI-02 | PAN NSDL validate | Call fails with a CORS error | Same as KI-01 for the NSDL endpoint | PAN cannot be validated; Edit Applicant cannot be saved with a validated PAN; user is asked to raise a PAN pendcode | API/Infra: enable CORS for the NSDL endpoint |
| KI-03 | Complete task | Call fails with HTTP 503 | Backend/service unavailable | **DVT decision cannot be submitted.** Case remains open; user stays on the DRS and can retry | Backend: restore service; re-test |
| KI-04 | Complete task | If the 503 response has no readable message, no error is shown to the user (the UI only shows a message when one exists) | UI shows only API-supplied text | User may think Submit did nothing | UI follow-up: add a fallback message such as "Unable to submit the task. Please try again." — not included in this release |
| KI-05 | UI | Not yet connected to a service (log to console only): Add / Edit / Remove Requirement, Save Requirements, applicant Edit save, Medical Submit, Financial Submit | Pending API contracts | Those actions do not persist | Needs approved API contracts; not built |
| KI-06 | BRE | Retrigger count limit (>3) is held in the browser session only | By design | Count resets on new session | None |

## Not in scope / not changed

- No change to Retail screens, login, or other Group workstreams.
- No new endpoints were added; existing configured URLs are used.

## Test summary

- Sanity scenarios: 43 (see `docs/testing/dvt-screen-sanity-and-release-note.md`, section 2).
- Passing areas: Inbox/claim, DRS load, detail cards, Quick Links, BRE detail dialog, Medical/Financial navigation, input validation, failure handling (no crash, loaders close, user stays on the screen).
- Failing due to environment: BRE retrigger (CORS), NSDL validate (CORS), Complete task (503).
- Blocked pending environment fix: BRE success and limit paths, NSDL success/invalid paths, PAN-block on submit, decision submit success.

## Release decision

**Go, with conditions.** The DVT DRS review experience can be released. The DVT decision submit, BRE retrigger and PAN validation must be re-sanity-tested (S22, S23, S29–S31, S34, S36, S38) and signed off once KI-01, KI-02 and KI-03 are resolved.

## Rollback

Revert to the previous Group build artifact (independent `apps/group` build). No data migration or shared-package change is involved.
