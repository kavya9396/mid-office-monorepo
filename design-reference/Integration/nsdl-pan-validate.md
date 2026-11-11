# NSDL PAN Validate — API integration

Status: Built, awaiting browser check (sub-tasks 1, 2 and 4-8 done; 3 coded, its test files pending open question 17; open questions 2 and 17 remain)
Spec date: 2026-11-11
Spec version: 1.3.0 (supersedes 1.2.0; add-on #18 confirms `panValidation` sits directly under `data`; 1.2.0 came from add-on #17)
OpenAPI: [`nsdl-pan-validate.openapi.v1.3.0.2026-11-11.yaml`](./nsdl-pan-validate.openapi.v1.3.0.2026-11-11.yaml)
(the old [`v1.2.0`](./nsdl-pan-validate.openapi.v1.2.0.2026-11-11.yaml), [`v1.1.0`](./nsdl-pan-validate.openapi.v1.1.0.2026-11-11.yaml) and [`v1.0.0`](./nsdl-pan-validate.openapi.v1.0.0.2026-11-11.yaml) files are kept for history only)
Mock: `mock/nsdl-pan-validate/nsdl-pan-validate.v1.3.0.mock.json`
Source of requirements: URL, sample request and sample response supplied by the user in chat on 2026-11-11, plus add-ons below.
Run with: `/integrate-api nsdl-pan-validate [sub-task number] [add-on: extra info]`
Add-on info: anything the user adds later goes in "Add-on requests" below (the command records it there).
User status: **waiting for further info from the user** before any UI work starts. The user will "drill down" the
PAN flag scenarios further (add-on #9); until then flag handling stays as listed and open question 9 stays open.

## Overview

Validate a PAN against NSDL for an application, from the **NSDL button** in
`apps/common/src/components/LifeAssured/EditApplicantDialog.tsx` (decided, add-on #3).
That dialog is also the **source of the request data** (add-on #3).

Decided behaviour (add-ons #3 to #13):

1. The NSDL button calls the API with data from the dialog.
2. The response is read as follows (add-on #7; add-on #8 adds the outcomes below):
   - `error` says whether the **API call** succeeded (`false`) or failed (`true`).
   - `pan_validation` says whether the **PAN is valid**: `true` -> the PAN validation flag becomes **Y**,
     anything else -> **No**.
   - `message` is **shown to the user** for both success and failure.
   - From `data` only `panValidation.{name, dob, aadharSeedingStatus}` is read (add-ons #17, #18); the rest of
     `data` is ignored. They fill "Is NSDL Name Matching?", "Is NSDL DOB Matching?" and "Aadhar Seeding Status?":
     `"Y"` -> `YES`; a missing structure, a missing value or any other value -> `NO`.
3. **Outcome table (add-on #8).** Success = `pan_validation = true`. Every other scenario is a failure.

   | Scenario | Result |
   |---|---|
   | `pan_validation = true` | **Success.** Flag = Y. Message shown. |
   | API succeeded (HTTP 200, `error = false`) but `pan_validation = false` | **Failure and a BLOCKER**: the user cannot submit the case or the audit field modification. Flag = No. Message shown. |
   | API error (`error = true`, or the call itself fails) **and** there is no PAN pendcode with status "pending" | **Failure.** Ask the user to **raise a PAN pendcode** to proceed further. Flag = No. |
   | API error (`error = true`, or the call itself fails) **and** a PAN pendcode with status "pending" already exists | **Failure. Just show the error message to the user** (add-on #9). No "raise a PAN pendcode" prompt. No blocker is applied by this rule. What the PAN flag becomes here is part of the flag drill-down (open question 9). |

   The two API-error rows are told apart only by whether a pending PAN pendcode exists. Who counts as a PAN
   pendcode is open question 16.

4. If the PAN is already validated and the user then **modifies** it, the flag is reset to **No**.
5. The user must **validate the PAN before submitting** the audit field modification; Save shows a validation
   error telling the user to validate the PAN otherwise.
6. The blocker in the table applies to both **audit field submission** (the Edit Applicant dialog Save) and
   **case submission** (the Group decision submit, `handleDecisionSubmit` in `DvtUser.tsx` via `DecisionSection`).
   Where the "PAN not valid" state is kept between the dialog and the decision footer is open question 15.
7. All screen-specific validation for this dialog lives in **one file** so it is easy to change and look up.

Fields already in the dialog: **PAN No** (`panNumber`), **Is PAN Valid?** (`isPanValid`),
**Is NSDL Name Matching?** (`nsdlNameMatching`), **Is NSDL DOB Matching?** (`nsdlDobMatching`), and a hidden-style
`nsdlTab` value that the NSDL button sets to `"Y"` today. Which of these is "the PAN validation flag" is open
question 9.

## Endpoint

| Item | Value |
|---|---|
| Method / URL | `POST https://midoffice-uat-api.icicilife.com/icic-external-event-service/v1/nsdl/pan/validate` |
| Method note | **POST confirmed by the user** (add-on #13). |
| Request body | `{ applicationNumber, pan, name, dob, fatherName }` |
| Response | `{ error, message, data, pan_validation, event_name, response_code }` (see OpenAPI v1.3.0); from `data` only `panValidation.{name, dob, aadharSeedingStatus}` is read |
| Body encryption / response decryption | **No encryption** (add-on #11): `encryptRequest: false` and `decryptResponse: false`, plain JSON both ways, as for BRE. |
| Auth headers | Standard business headers via `createBusinessBaseQuery` unless told otherwise |

## Request fields (from the sample)

| Field | Sample | Notes |
|---|---|---|
| `applicationNumber` | `OS94845380` | DRS application number |
| `pan` | `ACBPJ4468N` | From the dialog's PAN No (`panNumber`), already upper-cased and limited to 10 |
| `name` | `SACHIN NARAYAN JOSHI` | **Mapping OPEN** (add-on #12): the user will provide it later. Intended source is `EditApplicantDialog.tsx` (add-on #11), but the dialog form has no `name` field today. Do not map or invent a source (open question 5) |
| `dob` | `03/06/1967` | From the dialog's Birthdate (`dob`). The dialog stores it as `YYYY-MM-DD`; the API sample is `DD/MM/YYYY`, so convert (open question 5) |
| `fatherName` | `""` | **Mapping OPEN** (add-on #12): the user will provide it later. Intended source is `EditApplicantDialog.tsx` (add-on #11), but the dialog form has no father name field today and the Group DRS mock has no father-name value; empty in the sample. Do not map or invent a source (open question 5) |

## Response (from the sample) and outcome rules

Current structure (add-ons #17 and #18, OpenAPI v1.3.0):

```json
{
  "error": false,
  "message": "Existing and Valid PAN",
  "data": {
    "panValidation": {
      "aadharSeedingStatus": "Y",
      "dob": "Y",
      "fathername": {},
      "name": "Y",
      "pan": "ACBPJ4468N",
      "responseCode": "1: Success",
      "validity": "Existing and Valid PAN "
    }
  },
  "pan_validation": true,
  "event_name": "NSDL",
  "response_code": 200
}
```

| Field | Used for |
|---|---|
| `error` | API call outcome: `false` = the API call succeeded, `true` = the API call failed |
| `pan_validation` | PAN validation status: `true` -> flag **Y** (success), anything else -> flag **No** (failure) |
| `message` | Shown to the user for both success and failure |
| `data.panValidation.name` | `"Y"` -> "Is NSDL Name Matching?" = `YES`, anything else or missing -> `NO` (add-on #17) |
| `data.panValidation.dob` | `"Y"` -> "Is NSDL DOB Matching?" = `YES`, anything else or missing -> `NO` (add-on #17) |
| `data.panValidation.aadharSeedingStatus` | `"Y"` -> "Aadhar Seeding Status?" = `YES`, anything else or missing -> `NO` (add-on #17). Replaces the top-level `aadharSeedingStatus` of v1.1.0, which is no longer read |
| Rest of `data` (`fathername`, `pan`, `responseCode`, `validity`) | Not read (add-on #18: only the match and Aadhar seeding data are mapped, `responseCode` is not used) |
| `event_name`, `response_code` | "HTTP 200" in the outcome table means the API call itself returned 200; whether to also read `response_code` from the body is open question 2 |

- Superseded: the earlier rule (add-on #5) "`error: false` sets the flag to Y, `error: true` shows 'PAN validation failed'
  plus the `panValidation` errors" no longer applies. The message text now comes from `message`, and the
  `panValidation` list is not read, so open question 7 is no longer needed.
- The outcome table in the Overview is the rule. In short: only `pan_validation = true` passes; a valid API
  response with `pan_validation = false` blocks submission; an API error without a pending PAN pendcode asks the
  user to raise one; an API error with a pending PAN pendcode just shows the error message (add-on #9).
- Which text is the "error message" for an API error is not stated. The response `message` is the only message
  field in the contract, but a failed call may have no body at all (open question 2).
- Not specified, so **not built**: the combination `error: true` with `pan_validation: true`; an empty `message`;
  what the flag becomes in each scenario beyond Y for success and No for "other" (open question 9, being drilled
  down by the user); and what happens to "Is NSDL Name Matching?" and "Is NSDL DOB Matching?" (open question 2).

## Add-on requests

Extra instructions given after this document was written. The `/integrate-api` command appends a row
for each add-on it receives (or the user may add one by hand), then updates the affected sections and
sub-tasks. An add-on never silently overrides a "decided" item above; conflicts are raised as a question first.

| # | Date | Add-on (user wording, shortened) | Effect | Sections / sub-tasks changed |
|---|---|---|---|---|
| 1 | 2026-11-11 | Plan like the BRE API: md file + mock + OpenAPI spec for the NSDL PAN validate URL, with the given sample request and response | Created this document, the OpenAPI file and the mock | All |
| 2 | 2026-11-11 | Where the API is called from and how to behave after the response: user will update later, keep as open | Open questions 1 and 2 | Open questions |
| 3 | 2026-11-11 | Open question 1 assumption is right (NSDL button in `EditApplicantDialog`); `EditApplicantDialog` should be the source of data | Open question 1 resolved. Request data comes from the dialog. The dialog has no name / father name field, so those need another source | Overview, request fields, open questions 1, 5, 6 |
| 4 | 2026-11-11 | If the PAN is already validated, any modification resets the flag to No; show a validation error telling the user to validate the PAN before submitting the audit field modification | New rules for the dialog (reset on change, block Save until validated) | Overview, sub-tasks 5 and 6, open questions 9-11 |
| 5 | 2026-11-11 | `error: false` = success, set the PAN validation flag to Y; `error: true` = flag No, show "PAN validation failed" and the listed errors from the `panValidation` array; wait for further info | Open question 2 partly resolved. The error list shape is still unknown | Response rules, sub-tasks 3 and 6, open questions 2, 7 |
| 6 | 2026-11-11 | Keep all screen-specific validation in a single file so changes and look-ups are easy | New sub-task 5: one validation file for the dialog. Existing inline rules move into it | Overview, sub-tasks 5-7, open question 12 |
| 7 | 2026-11-11 | Response structure changed: `message` has text, new `aadharSeedingStatus` and `pan_validation`, `data.return` removed. Ignore `data` for now, do not read it. `error` = API success/failure; `pan_validation` = PAN validation status; `message` is shown to the user for success and failure | OpenAPI bumped to v1.1.0 (v1.0.0 kept), mock renamed to v1.1.0. Replaces add-on #5's response rules; open question 7 dropped; `aadharSeedingStatus` is new open question 13 | Overview, endpoint, response section, sub-tasks 2, 3, 6, open questions 2, 7, 13 |
| 8 | 2026-11-11 | Map `aadharSeedingStatus` into the screen's field. Success is `pan_validation = true`; all other scenarios are failure. If the API succeeded (200, `error = false`) but `pan_validation = false`, it is a blocker for case submission and audit field submission. If the API errors (or `error = true`) and there is no PAN pendcode with status pending, ask the user to raise a PAN pendcode to proceed | Outcome table added to the Overview; `aadharSeedingStatus` mapping decided (detail open); new blocker on case submission; PAN pendcode check added. API contract unchanged, so OpenAPI stays v1.1.0 | Overview, response section, sub-tasks 3, 5, 6, new sub-task 7, open questions 2, 11, 13, 14, 15, 16 |
| 9 | 2026-11-11 | API error and a pending PAN pendcode already exists: just show the error message to the user. The PAN flag scenarios can be drilled down further later | Outcome table row 4 decided (show the error message only; no raise-pendcode prompt, no blocker from this rule). Open question 14 resolved. PAN flag handling stays open for the user's drill-down (open question 9). OpenAPI unchanged | Overview, response section, sub-tasks 3, 5, 6, open questions 9, 14 |
| 10 | 2026-11-11 | `aadharSeedingStatus`: keep it open | Supersedes the "map it into the screen" part of add-on #8. The service still reads the value; nothing fills the "Aadhar Seeding Status?" field until the user gives the mapping. Open question 13 stays fully open | Overview, response section, sub-task 6, open question 13 |
| 11 | 2026-11-11 | Encryption: no. Name and father name come from the `EditApplicantDialog.tsx` page | Open question 3 resolved: plain JSON both ways. Name / father name are to come from the dialog page; the dialog has no such fields, so how they get there stays open (open question 5). OpenAPI unchanged | Endpoint table, request fields, sub-task 4, open questions 3, 5 |
| 12 | 2026-11-11 | Keep name and father name open; the user will give the mapping later | `name` and `fatherName` mapping is fully open. Sub-task 3 builds the request without a source for these two; sub-task 6 is not allowed to send the request until the mapping is given. Add-on #11's "from the dialog" is now only an intended direction | Request fields, sub-tasks 3 and 6, open question 5 |
| 13 | 2026-11-11 | It is POST; the rest stays open | Open question 4 resolved: the HTTP method is POST. Every other open question is unchanged. The OpenAPI v1.1.0 description wording ("assumed", "unconfirmed") was corrected in place; the contract is unchanged, so no new version | Endpoint table, OpenAPI description, sub-task 4, open question 4 |
| 14 | 2026-11-11 | Keep all messages in one common file so they are easy to change | Every user-facing message of the Edit Applicant dialog lives in `apps/common/src/components/LifeAssured/editApplicant.messages.ts`: `requiredMessage(label)`, `PAN_NOT_VALIDATED_MESSAGE`, `RAISE_PAN_PENDCODE_MESSAGE`, `BLANK_NOMINEE_MESSAGE`, `BLANK_RIDER_MESSAGE`, `FILL_ALL_NOMINEE_FIELDS_MESSAGE`, `FILL_ALL_RIDER_FIELDS_MESSAGE`. `editApplicant.validation.ts`, `EditApplicantDialog.tsx`, `NomineeDetails.tsx`, `RiderDetails.tsx` and `LoanDetails.tsx` import from it; existing wording is unchanged. Any new message added by sub-tasks 5-7 goes in this file. The API `message` is runtime text from the response and stays outside it | Sub-tasks 5, 6, open question 11 |
| 15 | 2026-11-11 | Answers to open questions 5, 9, 10, 11, 15, 16 | Q5: `name` = DRS "Applicant Name", `fatherName` = `""`. Q9: the flag is `isPanValid` (`YES` when `pan_validation = true`, else `NO`). Q10: editing PAN No or Birthdate resets it to `NO`. Q11: all messages go in the dialog's error snackbar (wording in open question 11 and in `editApplicant.messages.ts`). Q15: the "PAN invalid" state is held in `DvtUser.tsx`, passed to the dialog by props, survives close/reopen. Q16: PAN pendcode = requirement `fupCode` `PAN`, pending = `status` `pending` (case-insensitive), raised with the existing "+ Add Requirement" button. Sub-tasks 5-7 are unblocked | Sub-tasks 5, 6, 7, open questions 5, 9, 10, 11, 15, 16 |
| 16 | 2026-11-11 | Give a user-friendly message when case submission is refused | Wording (in `editApplicant.messages.ts`, `PAN_INVALID_SUBMIT_BLOCKED_MESSAGE`): "We couldn't verify the PAN with NSDL. Please correct the PAN details and validate them again before submitting this case." Shown in its own red snackbar on the Group DRS screen when Submit is clicked while an applicant's PAN is invalid | Sub-task 7 |
| 17 | 2026-11-11 | Map "Is NSDL Name Matching?", "Is NSDL DOB Matching?" and "Aadhar Seeding Status?" from `panValidation` (`name`, `dob`, `aadharSeedingStatus`). If the structure is not proper or the data is not available, map N instead of Y | Open question 13 resolved. Each value `"Y"` -> `YES`, everything else (wrong structure, missing, not "Y", API error) -> `NO`. OpenAPI bumped to v1.2.0 (v1.1.0 kept), mock renamed to v1.2.0 (superseded by add-on #18). The three selects are set on every NSDL click, including API errors | Overview, endpoint, response section, sub-tasks 2, 3, 6, open questions 13, 18 |
| 18 | 2026-11-11 | Answers to the add-on #17 follow-ups: (1) the three selects also go to `NO` when the API errors; (2) only the match and Aadhar seeding data are mapped, so `responseCode` is not used; (3) the location is `data.panValidation` | Open question 18 resolved. `return` level removed from the reader, mock and spec. OpenAPI bumped to v1.3.0 (v1.2.0 kept), mock renamed to v1.3.0. Sub-task 6 "decision to confirm" on API errors is now confirmed | Overview, endpoint, response section, sub-tasks 2, 3, 6, open question 18 |





## Sub-tasks

Each sub-task is independent and reviewable on its own. Run in order.

### 1. Config and env wiring

- **Intent:** Add the NSDL PAN validate URL the same way other business URLs are configured.
- **Expected outcomes:** URL read from `.env`, empty in mock mode, no hard-coded host.
- **Todo list:**
  1. Add `VITE_EXTERNAL_EVENT_SERVICE=/icic-external-event-service` and
     `VITE_NSDL_PAN_VALIDATE_API=${VITE_BASE_URL}${VITE_EXTERNAL_EVENT_SERVICE}/v1/nsdl/pan/validate`
     to `.env.example` (do not edit the user's `.env`).
  2. Add a `nsdlUrls.panValidate` getter in `packages/utils/src/config/appConfig.ts` (pattern: `groupBusinessUrls`),
     export it from `packages/utils/src/config/index.ts` and `packages/utils/src/index.ts`.
  3. Type both keys in `packages/utils/src/vite-env.d.ts`.
- **Relevant context:** `.env.example`, `packages/utils/src/config/appConfig.ts` (`groupBusinessUrls`).
- **Status:** `[x] done` — `.env.example` (`VITE_EXTERNAL_EVENT_SERVICE`, `VITE_NSDL_PAN_VALIDATE_API`);
  `nsdlUrls.panValidate` in `appConfig.ts`; exported from `config/index.ts` and `packages/utils/src/index.ts`; both keys
  typed in `packages/utils/src/vite-env.d.ts`. `packages/utils` typecheck passes (`tsc --noEmit`, exit 0).
  The user's `.env` still needs these two keys copied from `.env.example` for real (non-mock) calls.
  Note for later sub-tasks: the `breUrls` getter that the BRE integration added earlier is no longer in the repo
  (`git status` shows only this sub-task's files modified), so the `breUrls` pattern is not available; the
  `groupBusinessUrls` pattern was used instead. `pnpm` is not on this shell's PATH; run `tsc` from the package folder.

### 2. Mock JSON

- **Intent:** Mock mode returns the sample response.
- **Expected outcomes:** `mock/nsdl-pan-validate/nsdl-pan-validate.v1.3.0.mock.json` holds the exact sample
  response (imported only by the API/service file, never by screens). Naming:
  `mock/<integration>/<integration>.v<api spec version>.mock.json`.
- **Todo list:**
  1. Create the JSON with the exact sample response (v1.3.0 structure).
  2. Do not invent other responses (for example a failure case) until the user supplies one (add-on).
  3. (add-ons #7, #17) Each structure change replaced the previous mock file (v1.0.0 -> v1.1.0 -> v1.2.0 -> v1.3.0).
- **Relevant context:** `mock/drs/`, `mock/inbox/` (pattern reference only).
- **Status:** `[x] done` (v1.3.0 file holds the user's `data.panValidation` sample; older mock files were deleted; it is wired in by sub-task 4)

### 3. Service: request builder + response envelope reader

- **Intent:** Pure code, no React. Builds the request and reads only what is known.
- **Expected outcomes:** `createNsdlPanValidateRequest(...)` returning the request fields (including the
  `YYYY-MM-DD` -> `DD/MM/YYYY` conversion of `dob`). `name` and `fatherName` are plain input parameters of this
  function; where their values come from is **open** (add-on #12), so nothing in this sub-task reads them from the
  dialog, the DRS data or anywhere else. And a reader that returns
  `{ apiSuccess, panValid, message, matches }` from `error`, `pan_validation`, `message` and
  `data.panValidation.{name, dob, aadharSeedingStatus}` (add-ons #7, #8, #17, #18) and throws the same style of
  error as `mapGroupDrsPayload` when `error` is missing or of the wrong type. `matches` holds three booleans,
  true only for a value of exactly "Y" (trimmed, case-insensitive); a wrong structure, a missing value or an API
  error gives false.
  A pure helper turns a result into the outcome from the Overview table: `success`, `blocked` (API ok,
  `pan_validation = false`), `apiErrorRaisePendcode` (API error, no pending PAN pendcode) or `apiErrorShowMessage`
  (API error, a pending PAN pendcode exists; add-on #9), so the UI never re-derives it. The helper takes
  "does a pending PAN pendcode exist" as an input; how that is determined is open question 16.
- **Todo list:**
  1. Add the functions in a new `apps/group/src/services/nsdlService.ts` (placement: Group first; see open question 6).
  2. Tests beside the existing `*.test.ts` files: the sample response gives `apiSuccess: true`, `panValid: true`,
     message "Existing and Valid PAN", outcome `success`; `error: false` with `pan_validation: false` gives
     outcome `blocked`; `error: true` with no pending PAN pendcode gives `apiErrorRaisePendcode`; `error: true` with
     a pending PAN pendcode gives `apiErrorShowMessage`; a response without `error` throws; a response without
     `pan_validation` reads as not valid; a response whose `data` is missing or odd still reads fine (proves `data`
     is ignored); `dob` conversion.
- **Relevant context:** `apps/group/src/services/drsService.ts` (`isRecord`, `readText`, `invalidResponse`).
- **Status:** `[-] code done, test files pending` — `apps/group/src/services/nsdlService.ts` exports
  `createNsdlPanValidateRequest`, `formatDobForNsdl`, `readNsdlPanValidateResponse`, `resolveNsdlOutcome` and the
  types `NsdlPanValidateRequest`, `NsdlPanValidateRequestInput`, `NsdlPanValidateResult`, `NsdlMatchFlags`, `NsdlOutcome`.
  `apps/group` typecheck passes (`tsc --noEmit`, exit 0). **No test file was added:** `apps/group` has no test runner
  (only `apps/common` has Vitest; the repo rules say not to add a framework silently), so every case in todo 2 was
  checked once with a throw-away script against the mock instead and all passed. That script was not
  kept. Two decisions made while coding, to confirm: (1) a response **without `pan_validation`** does not throw; it
  reads as "PAN not valid" (success is exactly `pan_validation === true`, per add-on #8 "all other scenarios are
  failure"); only a missing or non-boolean `error` is rejected; this replaces the earlier plan to throw on a missing
  `pan_validation`. (2) `error: true` with `pan_validation: true` is treated as an API error, so an errored response
  can never pass the PAN gate (open question 2 still lists the combination as unspecified).

### 4. RTK Query mutation

- **Intent:** Call the API through the shared business base query.
- **Expected outcomes:** `useValidateNsdlPanMutation` in a new `apps/group/src/services/nsdlApi.ts`;
  `useMock` returns the mock; otherwise POST with `encryptRequest: false` and `decryptResponse: false` (add-on #11);
  a missing URL gives a custom error like the existing DRS query.
- **Todo list:**
  1. Add the mutation endpoint with `encryptRequest: false` and `decryptResponse: false` (add-on #11). The HTTP
     method is POST (confirmed, add-on #13).
  2. Register the API in the Group store the same way `groupDrsApi` is registered.
- **Relevant context:** `apps/group/src/services/drsApi.ts`, `packages/utils/src/api/businessBaseQuery.ts`.
- **Status:** `[x] done` — `apps/group/src/services/nsdlApi.ts` exports `groupNsdlApi` and `useValidateNsdlPanMutation`
  (POST, `encryptRequest: false`, `decryptResponse: false`, mock mode returns the v1.3.0 mock, missing URL gives the
  custom error "NSDL PAN validate API is not configured."). Registered in `apps/group/src/app/store.ts` (reducer,
  middleware, `resetApiState` on `sessionExpired`). `apps/group` typecheck passes. Checked once with a throw-away
  Vitest file run from `apps/common` (5 cases: mock mode makes no `fetch`; missing URL; real POST of plain JSON to the
  URL; `error: true` returns an API-error result; HTTP 500 and a body without `error` return errors) and all passed.
  The file was not kept because `apps/group` has no test runner (open question 17).

### 5. Single validation file for the Edit Applicant dialog (add-on #6)

- **Intent:** One place for every rule of this screen, so changing or looking up a rule never means searching the component.
- **Expected outcomes:** One file (proposed `apps/common/src/components/LifeAssured/editApplicant.validation.ts`,
  name and location are open question 12) holds: the existing zod schema and its messages that are inline in
  `EditApplicantDialog.tsx` today (`required(...)`, `editApplicantSchema`, `editFormSchema`), the new rule
  "PAN must be validated before Save", the "PAN not valid blocks audit field and case submission" rule (add-on #8),
  and the helper that resets the flag when the PAN changes. The dialog imports them and contains no inline rules.
  Existing messages keep their exact wording.
- **Todo list:**
  1. Move the existing schema and `required` helper out of the dialog into the new file, unchanged.
  2. Add the "validate PAN before Save" rule (message wording is open question 11; the flag field is open question 9).
  3. Add the "PAN modified -> flag back to No" helper as a pure function (what counts as a modification is open question 10).
  4. Add the "raise a PAN pendcode" rule for an API error with no pending PAN pendcode (add-on #8; wording and
     the pendcode definition are open questions 11 and 16). With a pending PAN pendcode the rule only shows the
     error message (add-on #9) and adds no blocker.
  5. Tests for the new rules. Existing exports used elsewhere (`EditApplicantValues`, etc.) must stay available from the same public entry point.
- **Relevant context:** `apps/common/src/components/LifeAssured/EditApplicantDialog.tsx` lines 14-45, 187-197.
  This is a shared component in `apps/common` (open question 12).
- **Status:** `[x] done` — `editApplicant.validation.ts` holds `editApplicantSchema`, `editFormSchema`,
  `EditApplicantValues`, `EditFormValues` (moved unchanged, same messages; `EditApplicantDialog.tsx` re-exports
  `EditApplicantValues`) and the new pure rules `panFlagFromValidation` (YES only for `pan_validation = true`),
  `resetPanFlagOnChange` (PAN No or Birthdate change -> NO), `isPanValidated` (Save only when YES),
  `buildNsdlNotice` (API message plus the "Please raise a PAN pendcode." line only when asked) and
  `hasPendingPanPendcode` (`fupCode` PAN, `status` pending, case-insensitive). Message text is in
  `editApplicant.messages.ts` (add-on #14). Tests: `apps/common/src/test/editApplicantValidation.test.ts`, 11 of 11
  pass with Vitest; `apps/common` typecheck passes. The rules are not yet called by the dialog; that is sub-task 6.

### 6. UI hook-up in the Edit Applicant dialog — DONE

- **Intent:** The NSDL button validates the PAN and the dialog behaves as in the Overview.
- **Expected outcomes:** Clicking **NSDL** sends the request built from dialog data and applies the Overview
  outcome table: `pan_validation: true` sets the flag to Y; any other result sets it to No; the response `message`
  is shown to the user for both success and failure (add-on #7); the three NSDL selects ("Is NSDL Name Matching?",
  "Is NSDL DOB Matching?", "Aadhar Seeding Status?") are set from the response, `NO` when not available (add-on #17);
  an API error with no pending PAN pendcode asks the user to raise one,
  while an API error with a pending PAN pendcode only shows the error message (add-on #9);
  changing a validated PAN resets the flag to No; Save is refused until the PAN is validated or while it is invalid.
- **Todo list (only when unblocked):**
  1. Per `.bob/rules/02-architecture-rules.md`, components in `apps/common` do not call services. The dialog gets
     the call through a new prop (for example an `onValidatePan` callback that returns the result), and the Group
     screen (`DvtUser.tsx`) supplies it using `useValidateNsdlPanMutation`. Prop name and shape are decided when unblocked.
  2. Replace the NSDL button's `setValue("nsdlTab", "Y")` behaviour per open question 9.
  3. Do not change the dialog layout or the prototype field order.
- **Relevant context:** `apps/common/src/components/LifeAssured/EditApplicantDialog.tsx` (NSDL button around line 291),
  `apps/common/src/components/LifeAssured/LifeAssured.tsx` (`onSaveEdit`), `apps/group/src/modules/drs/DvtUser.tsx`.
- **Status:** `[x] done` (typecheck passes for `apps/common` and `apps/group`; not yet exercised in a browser).
  - **Dialog (`EditApplicantDialog.tsx`):** new optional props `onValidatePan(input) => Promise<PanValidationResult>`,
    `panStatus` and `onPanStatusChange`. Without `onValidatePan` the dialog behaves exactly as before (Retail is
    unchanged: the NSDL button still only sets `nsdlTab`). With it: the NSDL button checks PAN No and Birthdate,
    calls the app, sets `isPanValid` to `YES`/`NO` (field becomes read-only, set only by NSDL), shows the API
    message plus the pendcode line in the snackbar (green for a valid PAN, red otherwise), and is disabled while
    the call runs. Editing PAN No or Birthdate while the flag is `YES` sets it back to `NO`. Save is refused with
    "Please validate PAN with NSDL before saving" unless the flag is `YES`. The new types `PanValidationInput`,
    `PanValidationResult` and `PanStatus` live in `editApplicant.validation.ts`; the dialog never sees API shapes.
  - **`LifeAssured.tsx`:** passes `onValidatePan`, `panStatusByApplicant` and `onPanStatusChange` through, keyed
    by applicant id, and re-exports `hasPendingPanPendcode` and the PAN types from `@insurance-poc/common/life-assured`.
  - **`DvtUser.tsx`:** holds `panStatusByApplicant` (survives closing the dialog, Q15), builds the request
    (`applicationNumber`, `pan`, `dob`, `name` = DRS "Applicant Name", `fatherName` = `""`, add-on #15), calls
    `useValidateNsdlPanMutation`, and maps the outcome: `success` -> `panValid: true`; `blocked` -> `false`;
    `apiErrorRaisePendcode` -> `false` plus the pendcode line; `apiErrorShowMessage` -> `panValid` left undefined
    (flag unchanged, message only). A failed HTTP call counts as an API error with the error text as message.
  - **Decisions to confirm (not given by the user):**
    (a) `PAN_VALIDATION_FAILED_MESSAGE` = "PAN validation failed" is shown when NSDL fails without any message.
    (b) A successful validation shows the API message in a green (success) snackbar.
    (c) Saving the dialog does not write the PAN flag back to the DRS data; the flag is kept in the screen state only.
    (d) The pending-PAN-pendcode check reads `drs.data.requirements`, so a pendcode added with "+ Add Requirement"
    is seen only once the DRS data is refreshed (that button currently only logs).
  - **Add-on #17:** `DvtUser.tsx` passes `matches` from the service result in `PanValidationResult`. The dialog's
    `handleNsdl` sets `nsdlNameMatching`, `nsdlDobMatching` and `aadharSeedingStatus` through the pure helper
    `nsdlSelectValues(matches)` in `editApplicant.validation.ts` (`YES` for true, `NO` for false or missing). They are
    set on **every** NSDL click, including API errors and the `apiErrorShowMessage` case where `isPanValid` stays
    unchanged (confirmed by the user, add-on #18). A failed HTTP call also gives all `NO`.

### 7. Case submission blocker on the Group screen (add-on #8) — DONE

- **Intent:** An invalid PAN (API ok, `pan_validation = false`) must stop **case submission**, not only the dialog Save.
- **Expected outcomes:** The decision submit in `DvtUser.tsx` (`handleDecisionSubmit`, rendered through
  `DecisionSection`) is refused while the PAN is in the blocked state, with a message the user can read.
- **Todo list (only when unblocked):**
  1. Keep the PAN validity state where both the dialog and the decision submit can read it (open question 15).
  2. Refuse the submit with the agreed message (open question 11). Do not change `DecisionSection` itself; if it
     cannot show the block, report it instead of editing the shared component.
  3. Read the requirement list (`drs.data.requirements`, each row has `fupCode` and `status`) to decide whether a
     pending PAN pendcode exists (open question 16).
- **Relevant context:** `apps/group/src/modules/drs/DvtUser.tsx` (`handleDecisionSubmit` around line 136,
  `DecisionSection` around line 319), `apps/group/src/modules/drs/requirementData.ts`,
  `apps/common/src/components/Requirement Mgmt/types.ts` (`RequirementItem`).
- **Status:** `[x] done` (typecheck passes for `apps/common` and `apps/group`; not yet exercised in a browser).
  `DvtUser.tsx` keeps `invalidPanByApplicant`. An applicant is added when NSDL answers with the API ok but
  `pan_validation = false` (outcome `blocked`). `handleDecisionSubmit` refuses to submit while any applicant is in
  that list and shows `PAN_INVALID_SUBMIT_BLOCKED_MESSAGE` in its own red snackbar (8 seconds). The user-friendly
  wording, kept in `editApplicant.messages.ts` (add-on #16): "We couldn't verify the PAN with NSDL. Please correct
  the PAN details and validate them again before submitting this case."
  - **When the block clears:** a later NSDL validation of that applicant succeeds or ends in an API error without a
    pending PAN pendcode (that outcome means "raise a pendcode", not "PAN invalid"), or the applicant's PAN No or
    Birthdate is changed in the dialog. An API error with a pending pendcode leaves the block as it was.
  - **Decisions to confirm (not given by the user):** (a) Only the `blocked` outcome blocks case submission, not
    "never validated" or an API error. Add-on #8 says "PAN invalid" blocks submission, and the user said the API-error
    case is handled by raising a pendcode, so I did not block those; say so if a case that never validated the PAN
    should also be refused. (b) `DecisionSection` was not changed; the block is applied in `handleDecisionSubmit`.
    (c) The block lives in screen state only, so a page reload clears it (same as the PAN flag, sub-task 6 item c).
  - Edit to the dialog made for this: `resetPanFlagIfEdited` now tells the app about every PAN No or Birthdate edit
    once the app holds a status for that applicant (it previously only fired when the flag was YES), so the block can
    drop when the PAN is corrected.

### 8. Validate

- **Todo list:** typecheck for `packages/utils`, `apps/common` and `apps/group` (note: `apps/group` had an unrelated
  pre-existing type error in `apps/common/src/modules/inbox/InboxScreen.tsx` when last checked), run the added tests,
  then `verify:deployments` if the shared packages changed.
- **Status:** `[x] done, except `verify:deployments`` (2026-11-11): `tsc --noEmit` exit 0 for `packages/utils`,
  `apps/common`, `apps/group` and `apps/retail`; the full `apps/common` Vitest suite passes (26 files, 177 tests,
  including the 11 in `editApplicantValidation.test.ts`); the `InboxScreen.tsx` type error seen earlier no longer
  appears. `verify:deployments` was not run: it needs `pnpm`, which is not on this shell's PATH. Not covered by any
  automated test: the dialog wiring (NSDL button, flag reset, Save gate), `DvtUser.tsx` and the submit block; they
  need a manual check in the browser, and `nsdlService.ts` / `nsdlApi.ts` have no committed tests (open question 17).

## Open questions

1. **Where is the API called from?** RESOLVED by add-on #3: the **NSDL** button in `EditApplicantDialog`.
2. **Behaviour after the response** — MOSTLY RESOLVED by add-ons #7 and #8 (see the Overview outcome table). Still
   open: what happens to "Is NSDL Name Matching?" and "Is NSDL DOB Matching?"; whether a non-200 `response_code` in the
   body (as opposed to the HTTP status) counts as an API error; an empty `message`; the combination `error: true`
   with `pan_validation: true`. How the message is shown (snackbar, helper text on PAN No, dialog) is not specified.
3. **Encryption** — RESOLVED by add-on #11: no encryption; plain JSON both ways (`encryptRequest: false`,
   `decryptResponse: false`).
4. **HTTP method** — RESOLVED by add-on #13: POST.
5. **Request field sources** — RESOLVED (2026-11-11, add-on #15). `pan` and `dob` come from the dialog (add-on #3).
   `name` is the applicant name from the DRS "Applicant Name" field; `fatherName` is always sent as an empty string
   (matches the sample request, so an empty `fatherName` is allowed). The dialog (`EditApplicantValues`) has no name
   or father-name field and gets none: the Group screen supplies `name` when it builds the request. Remaining detail
   for sub-task 6 (not a user decision): `applicationNumber` is the screen's `applicationNo` from `useSearchParams()`
   (AGENTS.md rule), passed to the call by the Group screen.
6. **Retail / placement** — is this needed in Retail too? `EditApplicantDialog` lives in `apps/common`; the API call
   must be injected by the app (Group first). Confirm whether Retail uses the same dialog.
7. **Shape of the `panValidation` items** — DROPPED by add-on #7: `data` (including `panValidation`) is ignored for
   now. Reopen only if the user later asks to read it.
8. **Auth in the supplied info** — no headers were given; the standard business headers are assumed.
9. **Which field is "the PAN validation flag", and what is its value in each scenario?** RESOLVED for the field
   (2026-11-11): the flag is `isPanValid` ("Is PAN Valid?" select, `YES`/`NO`), it stays visible in the dialog.
   `pan_validation = true` -> `YES`; any other result -> `NO`. `nsdlTab` is not the flag. The user said earlier that
   further flag scenarios will be drilled down later. Still not decided: the flag after an API error when a PAN
   pendcode is pending (the user only said to show the error message); until told, that case leaves `isPanValid`
   unchanged.
10. **What counts as a "modification" that resets the flag?** RESOLVED (2026-11-11): editing PAN No or Birthdate
    (`dob`) resets `isPanValid` to `NO`. The name is not in the dialog (see question 5), so it plays no part.
11. **Messages and where they show** — RESOLVED (2026-11-11), all in the dialog's existing error snackbar:
    (a) Save without a validated PAN: "Please validate PAN with NSDL before saving". (b) API ok but
    `pan_validation = false`: the API `message` only. (c) API error with no pending PAN pendcode: the API `message`,
    then the line "Please raise a PAN pendcode." (d) API error with a pending PAN pendcode: the API `message` only.
    Success: the API `message` is shown too (add-on #7); the success presentation (not an error snackbar) is not
    specified, so the dialog's existing snackbar component is reused with the non-error severity if it supports one.
12. **Shared component and file name** — RESOLVED (2026-11-11): the user approved editing `EditApplicantDialog.tsx`
    and the file `apps/common/src/components/LifeAssured/editApplicant.validation.ts`.
13. **`aadharSeedingStatus` mapping** — RESOLVED by add-on #17 (2026-11-11): `data.panValidation.aadharSeedingStatus`
    `"Y"` -> `YES`; anything else or missing -> `NO`. The same rule fills "Is NSDL Name Matching?" (from `name`) and
    "Is NSDL DOB Matching?" (from `dob`). The top-level `aadharSeedingStatus` of v1.1.0 is no longer read.
14. **API error but a pending PAN pendcode already exists** — RESOLVED by add-on #9: just show the error message to
    the user. This rule adds no blocker and no "raise a PAN pendcode" prompt. (The PAN flag in this case is part of
    open question 9.)
15. **Where the "PAN invalid" state lives** — RESOLVED (2026-11-11): held in the Group screen (`DvtUser.tsx`) and
    passed to the dialog by props. It survives closing and reopening the dialog, and resets only when PAN No or
    Birthdate changes (question 10).
16. **What is a "PAN pendcode"?** RESOLVED (2026-11-11): the PAN pendcode is a requirement row with `fupCode` `PAN`.
    It counts as pending when `status` equals `pending`, compared case-insensitively. The user raises it with the
    existing "+ Add Requirement" button (no new action).
17. **Test runner for `apps/group`** — sub-task 3 needs `*.test.ts` files, but `apps/group` has no test script or
    Vitest (only `apps/common` does, and `.bob/rules/02-architecture-rules.md` says not to adopt a framework
    silently). Options: add Vitest to `apps/group` (a `test` script and devDependency), or place the NSDL service
    tests in `apps/common`, which cannot import from `apps/group`. Until answered, the service has no committed tests.

18. **`responseCode` and the place of `return`** — RESOLVED by add-on #18 (2026-11-11). (a) `responseCode` is not
    used: only the match and Aadhar seeding data are mapped. (b) The location is `data.panValidation`; there is no
    `return` level.
