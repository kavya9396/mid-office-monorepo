# BRE Retrigger — API integration

Status: In progress (sub-tasks 1 and 2 done; 3-5 pending)
Spec date: 2026-11-09
Spec version: 1.0.0
OpenAPI: [`bre-retrigger.openapi.v1.0.0.2026-11-09.yaml`](./bre-retrigger.openapi.v1.0.0.2026-11-09.yaml)
Source of requirements: `bre.txt` (supplied by the user; contents are captured here and in the OpenAPI file; the raw file was deleted after capture)
Run with: `/integrate-api bre-retrigger [sub-task number] [add-on: extra info]`
Add-on info: anything the user adds later goes in "Add-on requests" below (the command records it there).

## Overview

When the user clicks **BRE Retrigger** on the Group DRS (DVT) screen, call the BRE events API and
replace the **Final BRE** data with the response. **Initial BRE** is not touched.

- Current state: the button handler is a stub — `handleBreRetrigger` in
  `apps/group/src/modules/drs/DvtUser.tsx` only does `console.log`.
- Final BRE is read from `drs.data.breDecision` (`BreDecision` type in
  `apps/group/src/services/drsService.ts`; source section `breDecision` in
  `apps/group/src/modules/drs/mock/groupDrs.json`).

## Endpoint

| Item | Value |
|---|---|
| Method / URL | `POST https://midoffice-uat-api.icicilife.com/icic-bre-wrapper-orchestrator/v1/events` |
| Request body | `{ eventName, applicationNumber, lob }` |
| Response | `{ data: { breOutput: {...} } }` (see OpenAPI) |
| Body encryption | **Off** — `encryptRequest: false` (decided) |
| Response decryption | **Off** — `decryptResponse: false` (decided) |
| Auth headers | **Keep** — `createBusinessBaseQuery` already applies `X-Apigee-Authorization` and Bearer token |

## Request rules

`businessType` comes from session storage via `getSessionBusinessType()` in `@insurance-poc/utils`
(never read `sessionStorage` directly).

| businessType | `eventName` | `lob` |
|---|---|---|
| GROUP | `BRE-GROUP` | `G` |
| RETAIL | `BRE-RETAIL` | `R` |

`applicationNumber` = the application number of the open DRS.

## Response → Final BRE mapping (decided: option 1)

| `BreDecision` field | Source in `breOutput` |
|---|---|
| `decision` | `systemDecision` |
| `remarks` | `breRemarks` |
| `timestamp` | `systemDecisionDateTime` (see open question 2) |
| `action` | `decisionTypes.breAction` |
| `reTriggerCount` | `reTriggerCount` |
| `discrepancy` | `requirements[].requirementType` joined with `#` (add-on #2; see open question 1 for the points still to confirm) |
| `initialDecision` | unchanged |

## Add-on requests

Extra instructions given after this document was written. The `/integrate-api` command appends a row
for each add-on it receives (or the user may add one by hand), then updates the affected sections and
sub-tasks. An add-on never silently overrides a "decided" item above; conflicts are raised as a question first.

| # | Date | Add-on (user wording, shortened) | Effect | Sections / sub-tasks changed |
|---|---|---|---|---|
| 1 | 2026-11-09 | Click on BRE Retrigger calls the API; business type read from session storage; GROUP -> `BRE-GROUP`/`G`, RETAIL -> `BRE-RETAIL`/`R`; create a mock similar to `groupDrs.json`; replace existing Final BRE data with the response | Restates the flow already captured. Mock is kept in repo-root `mock/` (user decision), not next to `groupDrs.json` | Request rules, mapping table, sub-tasks 2-5 (no change needed) |
| 2 | 2026-11-09 | Requirement type should be concatenated in the expected format to populate `discrepancy` (answer to open question 1) | Final BRE `discrepancy` = `breOutput.requirements[].requirementType` joined with `#` (same style as `breRemarks`/the current `remarks` value, e.g. `ACR#OCD#PAN`). With the sample response the value is `GCD` | Mapping table, sub-task 3 (mapper + test), open question 1 |
| 3 | 2026-11-09 | Add multiple requirements to the mock JSON so it can be verified | Mock `breOutput.requirements` now has 4 entries (`GCD`, `PAN`, `KYP`, `AGE`); the last three are invented test data. In mock mode Final BRE `discrepancy` should read `GCD#PAN#KYP#AGE` | Sub-task 2 (mock), sub-task 3 test cases |


## Sub-tasks

Each sub-task is independent and reviewable on its own. Run in order.

### 1. Config and env wiring

- **Intent:** Add the BRE events URL the same way other business URLs are configured.
- **Expected outcomes:** URL read from `.env`, empty in mock mode, no hard-coded host.
- **Todo list:**
  1. Add `VITE_BRE_SERVICE=/icic-bre-wrapper-orchestrator` and
     `VITE_BRE_EVENTS_API=${VITE_BASE_URL}${VITE_BRE_SERVICE}/v1/events` to `.env.example`
     (do not edit the user's `.env`).
  2. Add a `breUrls.events` getter in `packages/utils/src/config/appConfig.ts` (pattern: `groupBusinessUrls`)
     and export it from `packages/utils/src/config/index.ts` and `packages/utils/src/index.ts`.
  3. Add `VITE_BRE_EVENTS_API` to `apps/group/src/vite-env.d.ts` (and Retail's if Retail uses it).
- **Relevant context:** `.env.example`, `packages/utils/src/config/appConfig.ts`.
- **Status:** `[x] done` — `.env.example` (`VITE_BRE_SERVICE`, `VITE_BRE_EVENTS_API`); `breUrls.events` in
  `packages/utils/src/config/appConfig.ts`; exported from `config/index.ts` and `packages/utils/src/index.ts`;
  typed in `packages/utils/src/vite-env.d.ts` (that file holds all `VITE_*_API` keys, so the app-level
  `vite-env.d.ts` files need no change). `@insurance-poc/utils` typecheck passes.
  Note for later sub-tasks: `apps/group` typecheck currently fails on a pre-existing unrelated error
  (`apps/common/src/modules/inbox/InboxScreen.tsx(16,28)` unused `toDisplayLabel`); not caused by this work.
  The user's `.env` still needs `VITE_BRE_SERVICE` / `VITE_BRE_EVENTS_API` copied from `.env.example` for real (non-mock) calls.

### 2. Mock JSON

- **Intent:** Mock mode returns the sample response, like `groupDrs.json` does for DRS.
- **Expected outcomes:** `mock/bre-retrigger/bre-retrigger.v1.0.0.mock.json` (repo-root `mock/` folder,
  like `mock/drs/` and `mock/inbox/`) holds the sample response from the OpenAPI file (imported only by
  the API/service file, never by screens).
  Naming: `mock/<integration>/<integration>.v<api spec version>.mock.json`.
- **Todo list:**
  1. Create the JSON with the exact sample response.
  2. Do not edit `groupDrs.json` (a mock change invalidates the whole Turbo cache).
  3. (add-on #3) Mock `breOutput.requirements` holds four entries so the `#` join can be checked:
     `GCD`, `PAN`, `KYP`, `AGE`. The first is the real sample; the other three are invented test data,
     not from the API. Expected Final BRE `discrepancy` in mock mode: `GCD#PAN#KYP#AGE`.
- **Relevant context:** `apps/group/src/modules/drs/mock/groupDrs.json` (pattern reference only).
- **Status:** `[x] done` (file created; it is wired in by sub-task 4)

### 3. Service: request builder + response mapper

- **Intent:** Pure mapping code, no React.
- **Expected outcomes:** `createBreRetriggerRequest(applicationNumber, businessType)` and
  `mapBreRetriggerPayload(value: unknown)` returning a `BreDecision`-compatible Final BRE; invalid
  payloads throw the same style of error as `mapGroupDrsPayload`.
- **Todo list:**
  1. Add the functions in `apps/group/src/services/drsService.ts` (or a sibling file) using the existing
     `isRecord` / `readText` helpers and the mapping table above.
  2. `discrepancy` = `requirements[].requirementType` joined with `#`, in response order. Skip empty
     `requirementType` values; no requirements -> `"-"` (the value `groupDrs.json` already uses for none).
  3. Add tests beside the existing `*.test.ts` files (Vitest is already used in `apps/common`); cover the
     sample response (`GCD`), several requirements (`GCD#PAN`) and an empty list (`-`).
- **Relevant context:** `apps/group/src/services/drsService.ts` (`readBre`, `mapGroupDrsPayload`).
- **Status:** `[ ] pending`

### 4. RTK Query mutation

- **Intent:** Call the API through the shared business base query.
- **Expected outcomes:** `useRetriggerBreMutation` in `apps/group/src/services/drsApi.ts`;
  `useMock` returns the mock; otherwise POST with `encryptRequest: false`, `decryptResponse: false`;
  missing URL gives a custom error like the existing DRS query.
- **Todo list:**
  1. Add the mutation endpoint.
  2. On success, patch the cached `getGroupDrs` result so only `breDecision` Final fields change
     (`onQueryStarted` + `updateQueryData`); keep `initialDecision`.
- **Relevant context:** `apps/group/src/services/drsApi.ts`, `packages/utils/src/api/businessBaseQuery.ts`.
- **Status:** `[ ] pending`

### 5. UI hook-up

- **Intent:** Replace the console.log stub.
- **Expected outcomes:** Clicking **BRE Retrigger** triggers the mutation; Final BRE card and the BRE
  detail modal update; loading and error feedback reuse the existing `snackbarMessage` state.
- **Todo list:**
  1. Replace `handleBreRetrigger` in `DvtUser.tsx`; read business type with `getSessionBusinessType()`.
  2. Disable the refresh action while the mutation is pending, if the shared component supports it
     (check before changing any shared component; report instead of editing).
- **Relevant context:** `apps/group/src/modules/drs/DvtUser.tsx` lines ~134 and ~270-277,
  `apps/group/src/config/groupScreen.config.ts` (`bre-decision` block).
- **Status:** `[ ] pending`

### 6. Validate

- **Todo list:** `pnpm typecheck`, run the added tests, `pnpm verify:deployments`.
- **Status:** `[ ] pending`

## Open questions

1. **`discrepancy`** — RESOLVED by add-on #2: join `requirementType` of `breOutput.requirements[]` with `#`.
   Still to confirm (defaults used until the user says otherwise): the separator is `#` (not `, `); the source is
   the retrigger response's `requirements[]`, not the on-screen Requirements tab rows (`fupCode`); an empty list
   shows `-`.
2. **Timestamp format** — the UI formatter `formatBreTimestamp` in `DvtUser.tsx` only parses
   `dd/MM/yyyy, HHmmhrs`; the API returns ISO-8601 (`2026-11-07T10:22:45Z`). Convert in the mapper,
   or extend the formatter? Time zone to display (UTC vs IST) is also unconfirmed.
3. **Retail** — the request rule for RETAIL (`BRE-RETAIL`, `R`) is defined, but no Retail DRS screen
   exists in `apps/retail` and no sample Retail response was supplied. Implement Group only for now?
4. **Failure handling** — the response has `errorResp`. What should the UI show when it is non-empty,
   and should a failed retrigger keep the existing Final BRE? Not specified.
5. **`requirements` in `breOutput`** — should they also refresh the Requirements section? The brief
   says only Final BRE is replaced, so they are ignored for now.
6. **Auth in the supplied curl** — it shows no auth headers; the decision is to keep the standard
   headers. Confirm the UAT gateway accepts them.
