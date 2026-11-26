# Medical data save — View Medical integration spec

## Overview

Integration spec for saving edits on the **View Medical** screen. When the user clicks **Save** on an
edited section, only that section's data is sent to
`POST /icic-medical-service/v1/medical-data/save`. The API answers with either a validation failure or a
success message, and the screen shows that message.

- API sample (request and response shape): `mock/medical/medical-data-save.json`
- Field-by-field mapping (YAML): `design-reference/medical-data-save-mapping.yaml`
- Fetch counterpart (the save request is its inverse): `docs/spec/integrations/medical-data-fetch.md`
- UI source: `apps/common/src/modules/Medical/` (`Medical.tsx`, `medical.save.ts`, `medical.mapper.ts`)

| Layer | File |
|---|---|
| Request builder (pure, tested) | `apps/common/src/modules/Medical/medical.save.ts` (`buildMedicalSaveRequest`) |
| Builder tests | `apps/common/src/modules/Medical/medical.save.test.ts` |
| Screen (validate, call, show message, leave edit mode) | `apps/common/src/modules/Medical/Medical.tsx` (`saveUnit`, prop `onSaveSection`) |
| Service + RTK mutation (mock or `VITE_MEDICAL_SAVE_API`) | `apps/group/src/services/medicalApi.ts` (`saveGroupMedical`) |
| Host wiring | `apps/group/src/modules/drs/DvtUser.tsx` |
| URL config | `groupBusinessUrls.medicalSave` in `packages/utils/src/config/appConfig.ts`; `VITE_MEDICAL_SAVE_API` in `.env.example` |

Party id: every applicant profile has a party id, the DB correlation key. `Medical` refuses to save without one: if the
active applicant's `partyId` is empty it shows "Unable to save: the applicant's party id is missing." (`MEDICAL_MESSAGES.partyMissing`),
sends nothing and stays in edit mode. A request therefore never carries an empty `partyId`.

Telemer: `TelemerScreen` (`apps/common/src/modules/Telemer/`) passes `applicationNo`, the active applicant's party
id (new prop `partyIds`, keyed by applicant tab key) and a new prop `onSaveSection` straight to `Medical`, so Telemer
saves through the same API and the same builder. No app hosts `TelemerScreen` yet: the host must pass `partyIds` and an
`onSaveSection` that calls the save mutation (the Group `useSaveGroupMedicalMutation`, as `DvtUser.tsx` does). Without
`onSaveSection` it keeps saving locally.

Current state: **save is wired for Group only.** Retail is not wired (open question 6). In mock mode
(`useMock`) the mutation returns a success envelope without a network call.

Status: Draft

---

## URL & routing

| Item | Value |
|---|---|
| Method | POST |
| Path | `/icic-medical-service/v1/medical-data/save` |
| Host (UAT) | `https://midoffice-uat-api.icicilife.com` |
| Env variable | `VITE_MEDICAL_SAVE_API` (full URL, same pattern as fetch and Financial save) |
| Headers | `accept: */*`, `Content-Type: application/json` |
| Request | `{ applicationNumber, partyId, createdBy, sections }` |
| Response | `{ response_code, error, message, data }` |

`applicationNumber` comes from `useSearchParams()` in the host screen, per project rules, and is passed to
`Medical` as a prop. `partyId` is the selected applicant tab's party id, also passed as a prop.

---

## Request

```json
{
  "applicationNumber": "OS90377743",
  "partyId": "067a1194-7c5a-4f4d-881c-259e655b3200",
  "createdBy": "UW002",
  "sections": { "<sectionKey>": { } }
}
```

| Field | Type | Source |
|---|---|---|
| `applicationNumber` | string | Host screen prop |
| `partyId` | string | Host screen prop (per applicant tab) |
| `createdBy` | string | Logged-in user id: `getSessionUser().username`, the same value the header profile shows. Required; Save is blocked without it. |
| `sections` | object | **Only the edited unit**, nested like `data.sections` of the fetch |

### Which sections go in `sections`

The unit being saved decides it. Nothing outside the unit is sent.

| Edit unit | Sections sent | Nesting |
|---|---|---|
| MER (combined) | MER, Habit & Addictions, Measurement, Family History, BP & Pulse, Question Table | all under `sections.mer` (`details`, `habit_and_addictions`, `measurement`, `family_history`, `blood_pressure_and_pulse`, `question_table`) |
| Tele/Video MER (combined) | Tele/Video MER, Measurements, Family History, Habit & Addiction, Question Table, Disposition | all under `sections.tele_mer` (`details`, `measurement`, `family_history`, `habit_and_addictions`, `question_table`, `disposition`) |
| Any other editable section | that section only | `sections.<apiKey>` (e.g. `sections.2decho`, `sections.cbc_group`) |
| Decision | `decision` | `sections.decision.medicalDecision` |

Not sent (display-only, no Save button): Application Form Medical & Lifestyle, BRE Medical Decision.
The CMO decision grid on 2DECHO, ECG and TMT is a read-only audit trail and is never sent (fetch spec, question 9).

### Value rules (builder)

| Rule | Behaviour |
|---|---|
| Empty field | sent as `null`, never `""` |
| Date field | `DD/MM/YYYY` (form) is sent as `YYYY-MM-DD`; any other text is sent unchanged |
| Measurement fields (UI sections `measurement`, `tele_measurements`) | sent as JSON numbers, `null` when empty |
| Habit Indicator | `Yes` is sent as `Y`, `No` as `N`, `null` when empty |
| Habit No. of Year | JSON number, `null` when empty |
| Habit shape | MER: flat keys (`cigarettesBeedisCigar`, `…Quant`, `…Year`). Tele: `{ value: [{ habit, habitId, indicator, quantity, year }] }`, one item per habit |
| Family `age` | JSON number, `null` when empty |
| Family `deadOrAlive` | upper-cased (`Alive` is sent as `ALIVE`) |
| BP readings | `readings[]` of `{ readingId?, readingSeq, systolic, diastolic }`; `avgSystolic`, `avgDiastolic`, `pulseRate` are numbers |
| Parameter row `findings` | computed as the screen shows it: `ABNORMAL` when the value is numeric and outside from..to, else `NORMAL`; `null` when value, from or to is empty |
| Question answer | a question hidden by its parent's answer is sent with `response: null` and `remarks: null` |
| Test object | `isActive: "Y"` is added when the test has a `testDtlId` |
| Family member | `isActive: "Y"` on every kept member; a fetched member removed on the screen is sent again with its fetched values and `isActive: "N"`. A row added and removed before saving is not sent. |

### Ids echoed back

The fetch ids are kept in the section and sent back, so the API can update the stored record instead of
inserting a new one.

| Id | Where | Kept from fetch as |
|---|---|---|
| `testDtlId` | every test object | `MedicalSection.testDtlId` |
| `medAppDtlId` | test object / `tele_mer.details` | `MedicalSection.medAppDtlId` |
| `paramId` | single-value Other Medical tests | `MedicalSection.paramId` |
| `fieldIds` | Special Medical tests | `MedicalSection.fieldIds` |
| `parameters[].paramId`, `parameters[].id` | parameter-list tests | `MedicalParameterValue` |
| `value[].habitId` | Tele habits | `MedicalSection.habitIds` (keyed by habit; omitted when the fetch had none) |
| `members[].memberId` | family history | `MedicalFamilyRow.memberId` (new family rows send `null`; a removed member is sent with `isActive: "N"`) |
| `readings[].readingId` | BP | `MedicalSection.readingIds` by `readingSeq` |
| `questions[].responseId` | question tables | `MedicalQuestion.responseId` |

---

## Response

```json
{ "response_code": 200, "error": false, "message": "…", "data": { "applicationNumber": "…", "partyId": "…", "sections": { "<sectionKey>": { "rowsInserted": 0, "rowsUpdated": 1, "rowsDeleted": 0 } } } }
```

Each saved section returns the fetch-shaped body plus `rowsInserted`, `rowsUpdated`, `rowsDeleted`
(and `rowsDeactivated` on family history). The UI does not read these counts today.

### Mapping the response (echo of the fetch)

`data.sections` has the same structure as the fetch response, so on a successful save it is mapped with the fetch
mapper (`mapMedicalFetchPayload`, through `readMedicalSaveSections` in `medical.save.ts`):

- Only the sections of the saved unit are re-read, and only those the save sends and the response carries. Other
  sections, and their unsaved edits, are not touched. Decision, and sections without a fetch source, are left as typed.
- The form values of those sections are replaced with what the database stored, and their ids are refreshed
  (`memberId`, `habitId`, `readingId`, `responseId`, `testDtlId`). A family member inserted by the save now carries
  its real `memberId`, so a second Save updates it instead of inserting it again.
- A family member the API returns with `isActive: "N"` is dropped from the rows.
- If the response has no readable `data.sections`, or a row cannot be mapped, nothing is replaced and the screen keeps
  what the user entered (the save itself is still reported as successful).
- A refetch (a new `sections` prop from the host) replaces everything, as before.

### Outcome rules

| Case | Detected as | Screen behaviour |
|---|---|---|
| Success | `error: false` and `response_code: 200` | Snackbar (success) shows `message`; the unit leaves edit mode; a dialog save closes the dialog |
| Validation failure in a 200 body | `error: true`, or `response_code` other than 200 | Snackbar (error) shows `message`; the unit **stays in edit mode** so the user can fix it |
| HTTP error (e.g. 400) | RTK `error` with the API message in the body | Snackbar (error) shows that message; stays in edit mode |
| Network failure or save URL not configured | thrown error | Snackbar (error) shows the error text, else "Unable to save the medical details."; stays in edit mode |
| Empty `message` | — | falls back to "`<title>` saved successfully." (success) or "Unable to save the medical details." (failure) |

Client-side validation runs first. While it fails, nothing is sent and the snackbar shows
"Please correct the highlighted fields."

---

## Screen behaviour

1. User clicks **Edit** on a unit, changes fields, clicks **Save**.
2. The unit's fields are validated (same rules as before; invalid fields are highlighted).
3. `createdBy` is read from the session (`getSessionUser().username`). If there is no session user, nothing is sent and
   the snackbar shows "Your session has expired. Please sign in again."
4. `buildMedicalSaveRequest` builds the request from the unit's sections and the form values.
5. `onSaveSection(request)` calls the mutation and resolves with the response envelope.
6. The snackbar shows `message`. Success ends edit mode; failure keeps it. On success the saved sections are
   re-read from the response (see "Mapping the response").
7. If `onSaveSection` is not passed, Save keeps its earlier local-only behaviour (success snackbar, no call).

---

## Open questions

1. Real error format: the sample only shows the success envelope. Failure is assumed to be `error: true` or
   `response_code` other than 200 (inferred from the envelope). Decided display rule:
   - Success: the API's top-level `message` only.
   - Failure: the top-level `message`, then the field-level errors joined with `; `, e.g.
     `Validation failed: firstName: First Name is required; gender: Gender is invalid`.
   - Field errors are read from `data.errors` or `data.fieldErrors` in any of three shapes: an array of strings, an
     array of `{ field, message }`, or an object of `field -> message`. The shape is a guess until the API team
     confirms it. Open: confirm the real failure body. Nothing is highlighted per field; the text goes in the snackbar.
   - An HTTP error (e.g. 400) with a JSON body is kept as an envelope by the Group service, so its `data` field errors
     are shown too. Code: `formatMedicalSaveMessage` in `medical.save.ts`, covered by tests.
2. Resolved and confirmed: `createdBy` is the logged-in user id, the value the header profile shows
   (`getSessionUser().username`, the login API `data.username`, e.g. `UW002`). The API expects this username.
3. Resolved: Tele habits shape. The builder now sends `tele_mer.habit_and_addictions` as
   `{ value: [{ habit, habitId, indicator, quantity, year }] }`, the same shape the fetch returns and the save sample
   sends. `habitId` is kept from the fetch and echoed back (`MedicalSection.habitIds`). The API `habit` name is fixed
   per habit (`Narcotic Consumption`, although the Tele screen label is the prototype's `Narrotic Consumption`).
   MER habits stay flat keys, as in the sample. Covered by a test. Open for the API team: if the fetch had no
   `habitId` (the flat-key fetch form), the item is sent without it; confirm the API accepts that and matches by `habit`.
4. Coded values. Decided:
   - Gender, education and occupation use the post-login master: the dropdown value is the master `code`, the label is
     its `description`.
   - Place of Examination uses the codes `CLINIC` and `RES_OFFICE` (confirmed). The dropdown value is the code, the
     label (`Clinic`, `Res/Office`) is shown. The fetch maps a code to the same option, so a fetched `RES_OFFICE`
     is shown and sent back unchanged. Covered by a test. Open for the API team: confirm there is no third code.
   - `examTime` ("Examination Time" on MER) is a plain text field and is sent as fetched (the mock has `"10:30"`).
   - `dateTimeOfTeleCall` ("Time of Tele call") is sent as the screen holds it, `hh:mm AM/PM` (e.g. `"10:30 AM"`).
     Open for the API team: the mocks only show `null`, so confirm the format the API accepts (24-hour `HH:MM`, or a
     full date-time).
   - The reactive result stays a hardcoded label until a master exists.
5. Decided: `Yes`/`No` fields other than habits are sent as the screen holds them (`Yes` / `No`), unchanged. The API
   itself uses different spellings in different places (`isMerNameSameAsProposalName: "Yes"`,
   `anyPreviousLifeInsurancePolicyDeclinePostponeOrIssuedOnRevisedTermSd: "N"`, `previousInsuranceDeclined: "YES"`,
   `telephonicMer: "NO"`). Sending the master `YESNO` codes (`Y` / `N`) for all of them was considered and not
   chosen. Habit indicators stay `Y` / `N`. Open for the API team: confirm `Yes` / `No` is accepted on every one of
   these fields. If a field rejects it, that field's spelling is changed in the builder.
6. Retail: checked, nothing to wire yet. `apps/retail` does not host the View Medical screen (no `<Medical>` host,
   no fetch query, no medical URL). Its only medical code is the unrelated Medical TPA DRS page. The builder and screen
   in `apps/common` are line-neutral, so when Retail adds the screen it needs its own fetch and save service (like
   `apps/group/src/services/medicalApi.ts`), a Retail URL entry for each API, and an `onSaveSection` prop on its
   `<Medical>` host. Open for the product team: whether and when Retail gets this screen, and its API URLs.
7. Decided: `isActive` is `"Y"` always, and `"N"` when something was deleted. The only deletion on this screen is
   removing a family member. A kept member is sent with `isActive: "Y"`. A member that was fetched (it has a
   `memberId`) and then removed is sent once more, with the values it was fetched with and `isActive: "N"`, so the API
   deactivates it (the response then counts it in `rowsDeactivated`). A row added and removed before saving is not
   sent. Test objects send `isActive: "Y"` as before, since a test cannot be deleted here. Open for the API team:
   confirm `isActive` is read on family members (the sample only has it on test objects).
8. Decided (confirmed by the API team): a family row added on the screen is sent with `memberId: null` and
   `isActive: "Y"`, and the API inserts it in the database (the response counts it in `rowsInserted`). Covered by a test.
9. Question payload: the builder sends `{ id, parentId, section, responseId, response, remarks }` per question. The
   sample sends the full question object (`questionDesc`, `answerType`, …). Confirm the shorter form is enough.
   Decided: a MULTISELECT answer is one string in `response` with the selected option keys joined by `#`, e.g.
   `"Chest Pain#Palpitations"`. The screen keeps the keys comma-joined internally; `parseMedicalQuestionnaire`
   converts `#` to `,` on fetch and `buildQuestions` converts `,` back to `#` on save. Covered by tests. Open
   point: confirm the fetch returns multi-select answers in the same `#` form (the mocks have no stored sample).
10. Sections the sample carries but the UI never edits: `application_form_medical`, `bre_medical_decision`,
    `tele_mer.stp_details`. They are not sent. Confirm they are ignored on save.
11. Save is per unit, not atomic across units: saving MER does not save Tele MER. Confirm this matches the business flow.

---

Status: Draft
