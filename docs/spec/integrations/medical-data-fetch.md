# Medical data fetch — View Medical integration spec

## Overview

Integration spec for the **View Medical** screen. It maps the UAT response of
`POST /icic-medical-service/v1/medical-data/fetch` to the left-menu sections of the
Medical module.

- API sample: `design-reference/medical-data-fetch-integration.txt`
- Section-by-section mapping (YAML, with API-team comments): `design-reference/medical-data-fetch-mapping.yaml`
- UI source: `apps/common/src/modules/Medical/` (`medical.config.ts`, `medical.schema.ts`, `Medical.tsx`)
- Mock (single API response): `mock/medical/medical-data-fetch.json`

Current state: **fetch is wired for Group, read-only, for these sections only**: Overview (Application Form
Medical & Lifestyle, all 12 fields), MER, Habit & Addictions,
Measurement, Family History, BP & Pulse, Question Table (MER); Tele/Video MER, Measurements, Family History,
Habit & Addiction, Question Table, Disposition Details (Tele); all 13 Special Medical tests; the 13 single-value
Other Medical tests (Blood Sugar Random, COT, GHB, HBA1C, HBsAg, HIV Elisa, PPBS, Serum Cotinine, FBS, HIV Western Blot,
HCV, Microalbuminuria, PSA); and the 8 parameter-list Other Medical tests (CBC, LFT, Lipids, OGTT, RUA, SMA12, TFT, S13:
header fields from the root, table rows from `parameters[]` matched by `paramName`; Findings is computed by the UI, not read).
The Decision menu (BRE Medical Decision, Decision) is also wired, so every section of the left menu is now mapped. The mock carries the UI parameter rows for all eight tests (CBC 25, LFT 11, Lipids 6, OGTT 3, RUA 21, SMA12 22, TFT 3, S13 22), in the six-key item shape.

| Layer | File |
|---|---|
| Mapper (pure, tested) | `apps/common/src/modules/Medical/medical.mapper.ts` (`mapMedicalFetchPayload`) |
| Service + RTK query (mock or `VITE_MEDICAL_FETCH_API`) | `apps/group/src/services/medicalApi.ts` |
| Screen | `apps/group/src/modules/drs/DvtUser.tsx` (loader, error, "not found" when `data.sections` is missing) |

Not done: Retail wiring, the save path (open question 9), and loading the dropdown option lists from the master API (request 14, open question 5).

V4 notes (`mock/medical/Medical Mock V4.json`):
- The response nests sections under `mer` (`details`, `measurement`, `habit_and_addictions`, `family_history`, `blood_pressure_and_pulse`, `question_table`) and `tele_mer` (`details`, `disposition`, `measurement`, `habit_and_addictions.value[]`, `family_history`, `question_table`, `stp_details`). The mapper reads these paths first and falls back to the older flat paths.
- Every section also carries `history[]` (earlier results, see open question 29).
- Root carries `clientType`, `examId`, `medAppDtlId`. `examId` is kept in the mapped result. `clientType` is not read.
- `tele_mer.stp_details` `{ stpDecision, stpRemarks }` fills the BRE `Tele/Video MER Decision` and `Tele/Video MER Remark` fields (the `bre_medical_decision` object itself has `null` there).
- Test objects also carry `testDtlId`, `paramId`, `fieldIds` and `isActive`. The mapper keeps `testDtlId`, `paramId` and `fieldIds` for the save path and ignores `isActive`.
- Parameter items use `parameter`, `labRangeStart`, `labRangeEnd` and `unit` (plus `id`, `paramId`). The mapper accepts these and the six-key names of request 15.
- Fields left empty on V4 data because of master-list codes (request 14) or `null` values are expected; the API fills them when data exists.
Value rules in the mapper: ISO dates become `DD/MM/YYYY`; a code the control cannot hold (e.g. gender `U`)
is left empty; family `aliveStatus` `A` becomes Alive (the dead code is unconfirmed, so it is not guessed);
`relationType` is title-cased to match the relation options.

Status: Draft

---

## URL & routing

| Item | Value |
|---|---|
| Method | POST |
| Path | `/icic-medical-service/v1/medical-data/fetch` |
| Host (UAT) | `https://midoffice-uat-api.icicilife.com` |
| Request | `{ "applicationNumber": string, "partyId": string }` |
| Response | `{ response_code, error, message, data }` |

Screen entry: View Medical, reached from the DRS left menu. `applicationNumber` comes from
`useSearchParams()`, per project rules. `partyId` is per applicant tab (Life Assured 1, Proposer).

---

## Layout (left menu)

The screen has six menus. Sections inside each menu are rendered in this order.

| # | Menu key | Label | Sections |
|---|---|---|---|
| 1 | `overview` | Overview | Application Form Medical & Lifestyle |
| 2 | `mer` | MER | MER, Habit & Addictions, Measurement, Family History, BP & Pulse, Question Table |
| 3 | `tele_video_mer` | TELE-VIDEO MER | Tele/Video MER, Measurements, Family History, Habit & Addiction, Question Table, Disposition |
| 4 | `special_medical` | SPECIAL MEDICAL | 2DECHO, Blood Urea & Nitro, CXR, Dobutamine SE, Exercise SE, ECG, Mammogram, PAP Smear, PFT, Stool Test, TMT, USG, Fundoscopy |
| 5 | `other_medical` | OTHER MEDICAL | Blood Sugar Random, CBC, COT, GHB, HBA1C, HBSAG, HIV Elisa, LFT, Lipids, OGTT, PPBS, RUA, Serum Cotinine, SMA12, TFT, FBS, S13, HIV Western Blot, HCV, Microalbuminuria, PSA |
| 6 | `decision` | Decision | BRE Medical Decision, Decision |

---

## Cardinality rules

These apply to every section. The API team must confirm each one.

| Rule | Meaning |
|---|---|
| R1 | One response per `applicationNumber` + `partyId`. |
| R2 | Each test key under `data.sections` is a **single object** (1:1). The API cannot return two reports for the same test. Confirm whether repeats are possible. |
| R3 | `parameters[]` and `answers[]` and `members[]` are **1:N**. The UI renders one row per element. |
| R4 | Each field must have one source. Where the API returns two keys for the same value (e.g. `dateOfBirth` / `examineeDob`), one must be designated as source. |
| R5 | A test with `testDtlId: null` is **not done**. It must not be shown as an empty result. |

---

## Section mapping summary

Status legend: `match` · `correlated` (same meaning, different name or shape) · `mismatch` (cardinality or shape must change) · `api_missing` · `ui_missing`.

### Menu 1 — Overview

| UI section | API key | Cardinality (UI / API) | Status |
|---|---|---|---|
| Application Form Medical & Lifestyle | `application_form_medical` | 1:1 / 1:1 | match (3 UI fields missing in API sample) |

Wired: nine fields map 1:1 and `Y`/`N` become Yes/No. `Adverse`, `Hazardous Occupation` and `Illness Impairment` keep their empty default.
The mock carries the prototype values (170, 70, 27.2, Yes, Yes, Yes, No, No, No) because the UAT sample is all `null`.
Open: all nine values are `null` in the sample. Confirm whether this is "not filled" or a data gap.
Open: `Adverse`, `Hazardous Occupation` and `Illness Impairment` are shown in the UI but missing from the API sample. The API team must add these keys.

### Menu 2 — MER

| UI section | API key | Cardinality (UI / API) | Status |
|---|---|---|---|
| MER | `mer.details` | 1:1 / 1:1 | correlated |
| Habit & Addictions | `mer.habit_and_addictions` | 1:1 / 1:1 (flat keys) | correlated |
| Measurement | `mer.measurement` | 1:1 / 1:1 | correlated |
| Family History & Health Status | `mer.family_history` | 1:N / 1:N `members[]` | match (V4 sends `members[]` only) |
| Blood Pressure & Pulse | `mer.blood_pressure_and_pulse` | 1:1 with 4 readings / 1:1 + `readings[]` `{ readingId, readingSeq, systolic, diastolic }` | correlated |
| Question Table | `mer.question_table.questions` | 1:N, API-owned list / 1:N, 47 questions (flat, no children) | correlated |

Key cardinality decisions:
- **Family history:** V4 sends `members[]` only (`{ memberId, relationType, age, deadOrAlive, healthStatus }`); the flat slots are gone.
- **BP (V4):** `readings[]` of `{ readingId, readingSeq, systolic, diastolic }`. `readingId` is a row id, so the UI maps by `readingSeq` (falling back to array position when `readingSeq` is missing). Mock: `mock/medical/medical-data-fetch.json`. The legacy split `systolic[]` / `diastolic[]` (keyed by `readingId` 1-4) is still read when `readings[]` is absent.
  The UI is flexible: slots 1-4 are always shown, and any extra `readingSeq` the API returns (5, 6, ...) adds a "Systolic n" / "Diastolic n" field, sorted by sequence. The grid gets one column per reading plus the average. Systolic 1 and Diastolic 1 are required, every other reading is optional, and the average uses every reading shown.
- **Question table:** the API owns the list (open question 6). V4 returns 47 flat questions (IDs `1.a` to `21.c`) and the UI shows all of them.

MER prototype check (`design-reference/ui-prototypes/Retail/CUW/cuw-mr-view-medical.html`, embedded `medicalGroups` JSON):

| Check | Result |
|---|---|
| Field labels and order (22 fields) | Match `MEDICAL_MER_FIELDS` in `medical.config.ts` |
| `required` flags (`firstName`, `isMerNameSameAsProposalName`, `placeOfExamination`, `gender`, `nameOfMe`, `meCode`, `examineeDob`, `examineePhotoIdProof`, `dateOfExamination`) | Match |
| `required` flag for `applicationNo` (not required, read-only in prototype) | Match |
| `Is Identity Proof and Application Photo Match` (not required) | Match |

Open: confirm the API `mer` object supplies `applicationNo` and `firstName`. The UAT sample has placeholder identity values (see D-items above).


### Menu 3 — Tele-Video MER

| UI section | API key | Cardinality (UI / API) | Status |
|---|---|---|---|
| Tele/Video MER | `tele_mer` | 1:1 / 1:1 | correlated |
| Measurements | `tele_mer.measurement` | 1:1 / 1:1 | correlated |
| Family History | `tele_mer.family_history` | 1:N / 1:N `members[]` | match (V4 sends `members[]` only) |
| Habit & Addiction | `tele_mer.habit_and_addictions.value[]` | 1:1 / 1:N `{ habit, habitId, indicator, quantity, year }`, matched to UI rows by habit name | correlated |
| Question Table | `tele_mer.question_table.questions` | 1:N, API-owned list / 1:N, 210 questions (184 with a parent) | correlated |
| Disposition Details | `tele_mer.disposition` | 1:1 / 1:1 | correlated |

Key cardinality decisions:
- **Question table (questionnaire):** V4 returns the same list shape as MER (see "Questionnaire contract"), under `tele_mer.question_table.questions`. The UI shows what the API returns (open questions 6 and 7), so the earlier "6 questions" and the three missing prototype questions no longer matter.
- The UI field `Remarks2` has no API counterpart.

Tele Habit & Addiction check (`design-reference/ui-prototypes/Retail/CUW/cuw-mr-view-medical.html`, `habitAndAddictionMarkup`):

| Check | Result |
|---|---|
| Rows: Cigarette/beedis/cigar, Gutka/Snuff/Paan etc., Narrotic Consumption, Beer/Wine/Hard liquor | Match `MEDICAL_TELE_HABIT_ADDICTION_FIELDS` (12 fields, three per habit) |
| Columns: INDICATOR, QUANTITY, NO. OF YEAR | Match `HabitAddictionBody` |
| Indicator control | Dropdown `--Select--` / Yes / No. Match (`yesNo`) |
| Quantity and No. of Year control | Number. Match (`number`) |
| Labels | Prototype typo `Narrotic` is kept (prototype wins) |
| UI field to API key (YAML `tele_habit_addiction`) | 12 of 12 map 1:1 to `tele_mer.habit_and_addictions` (`cigarettesBeedisCigar`, `…Quant`, `…Year`, and the same for `gutkaSnuffPaan`, `narcoticConsumption`, `beerWineHardLiquor`) |
| Validation | Schema `createMedicalHabitAddictionsSchema` is shared with MER. Indicator is mandatory. Quantity and No. of Year are mandatory only when the Indicator is Yes. |

API fields with no UI counterpart: `…Freq` and `…Remarks` for each of the four habits (8 keys). `habits[]` is empty in the sample.

Tele Disposition Details check (`cuw-mr-view-medical.html`, `dispositionSection`):

| Check | Result |
|---|---|
| Fields and order: TUW Status, Remark, Note, Remarks2 | Match `MEDICAL_TELE_DISPOSITION_FIELDS` |
| Control kind | Prototype renders all four as plain text (`data-field-type="text"`, no options). Config falls through to `text`. Match |
| Validation | No schema entry for `tele_disposition`, so no field is mandatory. The prototype shows no required marker. Match |
| UI field to API key | `TUW Status` → `tuwStatus`, `Remark` → `remark`, `Note` → `note` |
| `Remarks2` | `api_missing`: no key in `tele_mer.disposition`. Stays in the UI, unmapped, until the API team confirms |

Open: `TUW Status` is shown as free text. The prototype sample is empty and gives no option list, so no dropdown is built.

### Menu 4 — Special Medical

All sections are **1:1** in the API. Each has a single result object with `findings`, plus test-specific fields.

| UI section | API key | Status | Notes |
|---|---|---|---|
| 2DECHO | `2decho` | correlated | Empty in sample |
| BLOOD UREA and NITRO | `blood_urea_and_nitro` | correlated | UI key `blood_urea_nitro` |
| CXR | `cxr` | match | |
| DOBUTAMINE STRESS ECHO | `dobutamine_stress_echocardiogram` | correlated | UI key `dobutamine_stress_echo` |
| EXERCISE STRESS ECHO | `exercise_stress_echocardiogram` | correlated | UI key `exercise_stress_echo` |
| ECG | `ecg` | correlated | `heartRateFinding` vs `heartRateFindings` |
| MAMMOGRAM | `mammogram` | match | |
| PAP SMEAR | `pap_smear` | match | `remarks` vs `remark` |
| PFT | `pft` | correlated | Empty in sample |
| STOOL TEST | `stool_test` | match | |
| TMT | `tmt` | correlated | |
| USG | `usg` | match | |
| Fundoscopy Test | `fundoscopy_test` | match | |

Shared header fields (all tests in this menu): Medical Type, Test Date, Examinee Name, Examinee Age, Diagnostic Centre Name, Doctor Name, Doctor Registration No, Remark.

Wired (mapper `SPECIAL_MEDICAL_SOURCES`): all 13 tests, read-only. Rules:
- Header fields use `medicalType`, `testDate`, `examineeName`, `examineeAge`, `diagnosticCentreName`, `doctorName` and `doctorRegistrationNo`. Older samples also sent `doctorRegNo`, `centreName`, `diagnosticCentreAddress` and similar duplicates; they are not read (R4, Q19). The UI has no Address or Pincode field in this menu.
- Remark spelling follows each test: `remark` for CXR, Mammogram, Blood Urea, ECG and both stress echos; `remarks` for 2DECHO, Pap Smear, Stool Test, TMT, USG and Fundoscopy. The mapper reads the API as it sends it (Q19).
- PFT reads `date` (the API also has `testDate`) and has no Findings field.
- Dropdowns (Medical Type, Findings, Axis, METS, Rejection Abnormality) match the API value to the section's option list, ignoring case. A value outside the list is left empty so the user re-selects it, not shown as a value the control cannot hold.
- Auto-populated fields (Ejection Result, Heart Rate Finding, Heart Rate Result, Result) show what the API returns; the UI does not calculate them here.
- The UAT sample has values only for ECG (header fields). Every other test is empty (`testDtlId` null), so those fields keep their empty default.

Open: the TMT `mets` format. The UI list is "1" to "18"; the API value format is unknown. A different format (for example "Good (>= 10 METS)") is left empty.
CMO decision (2DECHO, ECG, TMT): the UI shows a read-only "CMO decision" table from `cmo_decision.history[]` (API-team request 13; the mapper still accepts the earlier `cmoDecisions[]`). `{ userName, poolName, decision, remarks, updatedOn }` maps to the columns User Name, Pool Name, Decision, Comments/Remarks and Date Updated On. The mapper reads it for `2decho`, `ecg` and `tmt` only. A missing or empty array hides the table; the sample rows in `medical.config.ts` are no longer shown next to fetched data. `updatedOn` is shown as sent.
Open: confirm the `updatedOn` timezone, and whether the other ten Special Medical tests should show the table too.

### Menu 5 — Other Medical

Two shapes:
- **Single value (1 result row):** `value`, `labRangeValueStart`, `labRangeValueEnd`, `unitsValue`, `findings` at the section root.
- **Parameter list (N rows):** `parameters[]`, one row per analyte.

| UI section | Shape | API key | Cardinality | Status |
|---|---|---|---|---|
| Blood Sugar Random | single | `blood_sugar_random` | 1:1 | correlated |
| CBC Group | parameters | `cbc_group` | 1:N (25 UI rows / 25 mock rows; UAT sent 12) | correlated |
| COT | single | `cot` | 1:1 | correlated |
| GHB | single | `ghb` | 1:1 | correlated |
| HBA1C | single | `hba1c` | 1:1 | correlated |
| HBSAG | single | `hbsag` | 1:1 | correlated (V4 sends the result at the root; no `parameters[]`) |
| HIV Elisa | single | `hiv_elisa` | 1:1 | correlated |
| LFT | parameters | `lft` | 1:N (11 rows; 11 in the mock) | match |
| Lipids | parameters | `lipids` | 1:N (6 rows; 6 in the mock) | match |
| OGTT Group | parameters | `ogtt_group` | 1:N (3 rows; 3 in the mock) | match |
| PPBS | single | `ppbs` | 1:1 | correlated |
| RUA Group | parameters | `rua_group` | 1:N (21 rows; 21 in the mock) | match |
| Serum Cotinine | single | `serum_cotinine` | 1:1 | correlated |
| SMA12 Group | parameters | `sma12_group` | 1:N (22 rows) | match |
| TFT Group | parameters | `tft_group` | 1:N (3 rows; 3 in the mock) | match |
| FBS | single | `fbs` | 1:1 | match |
| S13 Group | parameters | `s13_group` | 1:N (22 rows, same list as SMA12) | correlated |
| HIV Western Blot | single | `hiv_western_blot` | 1:1 | match |
| HCV | single | `hcv` | 1:1 | match |
| Microalbuminuria | single | `microalbuminuria` | 1:1 | correlated |
| PSA | single | `psa` | 1:1 | correlated |

Key cardinality decisions:
- **CBC:** the UI has 25 rows and the UAT sample returned 12 (11 distinct, as Eosinophils appears twice). The mock now has all 25, using the UI names as `paramName`: the 11 UAT rows keep their real values, and the 14 missing ones (ESR, absolute counts, MPV, PDW, MCH, MCHC, RDW, morphology) carry sample values. Confirm whether those 14 are not performed or never sent.
- **HBsAg (V4, resolved):** the API now sends the result at the section root (`value`, `findings`, lab range, unit) and no `parameters[]`, as the UI expects. V4 `value` is `non_reactive`; the code list comes from the master (request 14).
- **S13:** the UI reuses the SMA12 analyte list, so S13 has the same 22 rows. The UI owns the row list (names and order); the API only fills Value, Normal Range and Unit by `paramName`. Confirm the S13 analyte list with the lab.

Mapper status for parameter-list tests: wired. Header fields (Medical Type, Date, Examinee, Diagnostic Centre, Doctor) come from the section root with the same keys as the single-value tests, and `Date` reads `date`. The UI owns the row list (names, order, required flags and dropdown options live in `medical.config.ts` and `medical.schema.ts`); the API only fills the values. Each UI row takes the `parameters[]` item with the same `paramName` and fills Value (`value`), Normal Range (`labRangeValueStart`, `labRangeValueEnd`) and Unit (`unitsValue`). A UI row with no item stays on screen, empty. An item with no UI row is dropped, so the API cannot add or remove a row (for example UAT's `Haemoglobin(Hb)` does not match the UI row `Hemoglobin(Hb)`, so that row stays empty). A dropdown Value (RUA rows) outside the row's list is left empty. Findings is not read: the UI computes it from the Value and the Normal Range (red "Abnormal" when outside, green "Normal" otherwise), so the API `findings` is ignored for these tests.

Mapper status for single-value tests: wired. The mapper reads the section root only (see open questions 25 to 28). HBsAg `Value` stays empty until the API returns the result at the root.

#### SMA12 and S13 parameters

`sma12_group` and `s13_group` return `parameters[]`, one item per UI row, matched by `paramName` (the UI name, exactly as written). The mock carries all 22 rows in both sections. The values, units and ranges in the mock are sample data, not UAT data. The mapper reads `parameters[]` by `paramName` (see "Mapper status for parameter-list tests").

Item shape: six keys, the same result keys as the single-value tests.

| Item key | UI column |
|---|---|
| `paramName` | Parameter |
| `value` | Value |
| `labRangeValueStart` | Lab Range Start (Normal Range from) |
| `labRangeValueEnd` | Lab Range End (Normal Range to) |
| `unitsValue` | Unit Value |
| `findings` | Findings |

API-team request 15 asks for this six-key item shape for every parameter-list test. The UAT CBC sample sends 24 keys per item (`paramValue`, `paramUnits`, `refRangeFrom`, `refRangeTo`, `ejectionFraction`, `axis`, `mets` and so on); most belong to other tests and the UI does not use them. The mock uses the six keys for all eight parameter-list tests and for HBsAg's `parameters[0]`.

| # | `paramName` (UI row) | Required in UI |
|---|---|---|
| 1 | `SGPT/ALT` | Yes |
| 2 | `SGOT/AST` | Yes |
| 3 | `GGT` | Yes |
| 4 | `Serum Bilirubin-Total` | Yes |
| 5 | `Direct` | Yes |
| 6 | `Indirect=(Total-Direct)` | Yes |
| 7 | `Serum Protein-Total` | Yes |
| 8 | `Albumin` | Yes |
| 9 | `Globulin=(Total-Albumin)` | Yes |
| 10 | `Albumin/Globulin_Ratio` | Yes |
| 11 | `Alkaline Phosphate` | Yes |
| 12 | `Serum Creatinine` | Yes |
| 13 | `Serum Calcium` | No |
| 14 | `Serum Uric Acid` | No |
| 15 | `RBS` | No |
| 16 | `FBS` | No |
| 17 | `Total Cholesterol: TC` | Yes |
| 18 | `Triglycerides: TG` | Yes |
| 19 | `HDL` | Yes |
| 20 | `LDL` | Yes |
| 21 | `VLDL` | No |
| 22 | `TC/HDL Ratio` | Yes |

Rows 1 to 11 overlap with the LFT analytes and rows 17 to 22 overlap with the Lipids analytes (a few names differ, for example `Indirect` in LFT). Confirm that the same analyte is not sent twice across groups.

### Menu 6 — Decision

| UI section | API key | Cardinality | Status |
|---|---|---|---|
| BRE Medical Decision | `bre_medical_decision` | 1:1 | correlated |
| Decision | `decision` | 1:1 | match |

Mapper status: wired, read-only.

| UI field | API key | Notes |
|---|---|---|
| Physical Medical Decision | `physicalMedicalDecision` | locked in the UI |
| Tele/Video MER Decision | `teleVideoMerDecision` | locked in the UI |
| MunichRe Medical Decision | `munichReMedicalDecision` | locked in the UI |
| MunichRe Rating | `munichReRating` | locked in the UI |
| BIU Medical Status | `biuMedicalStatus` | locked; no UI option list, shown as sent (open question 30) |
| Physical Medical Remark | `physicalMedicalRemark` | locked in the UI |
| Tele/Video MER Remark | `teleVideoMerRemark` | locked in the UI |
| Medical Decision (`decision`) | `medicalDecision` | dropdown `Standard` / `Non-Standard`; a value outside the list is left empty |

All eight values are `null` in the UAT sample (`biuMedicalStatus` is `N`). The mock carries sample values so the screen shows data; they are not UAT data. The CMO decision grid on 2DECHO, ECG and TMT is a separate fetch-only audit trail (no edit); it is not part of this step.

---

## Data-quality observations

| # | Observation | Where | Action |
|---|---|---|---|
| D1 | Placeholder identity: `Virat Kohli` / `UNKNOWN`, DOB `1900-01-01`, gender `U`, income `0`. | `mer` | Confirm for UAT. |
| D2 | Gender `U` is not in the UI enum (MALE / FEMALE / TRANSGENDER). | `mer` | Confirm the code list. |
| D3 | Platelets `290000` with unit `lakhs/cumm`, range `1.5–4.1`, flagged ABNORMAL. Value, unit and range are inconsistent. | `cbc_group` | Verify the lab feed. |
| D4 | `Eosinophils` and `Esinophils` both present (3%). | `cbc_group` | Remove the duplicate. |
| D5 | ECG centre name and address look inconsistent. | `ecg` | Verify source. |
| D6 | Empty tests show `testDtlId: null` and empty `parameters`. This is indistinguishable from "not done". | Multiple | Add a status field. |
| D7 | `table_of_medical_documents` lists `mer` twice (010 and 010.01) and includes group codes that are not sections. | Root | Clarify. |
| D8 | Measurements have duplicate keys (`heightCm`/`heightCms`, `weightKg`/`weightKgs`, `bmi`/`bmiCalculated`, etc.). | `measurement`, `tele_mer.measurement` | Keep one per measure. |
| D9 | Question IDs use different formats across MER (`1.a`) and Tele (`1`, `7.1.2`). | `question_table`, `tele_mer.answers` | Use one format. |
| D10 | `questionValue` is `YES`/`NO` in the API. UI uses `Yes`/`No`. | Question tables | Normalise in mapper. |

---

## API-team change requests (summary)

1. **Choose one source per duplicated key** (R4). Applies to DOB, gender, exam date, income, measurements, BMI, and doctor registration.
2. **Family history (list):** family history is a list, not fixed slots. Return `members[]` only, one array item per family member, with a row id (`memberId`). Return an empty array when there are no rows. Remove the flat slots (`fatherAge`, `motherAge`, `otherAge`, `fatherRelation`, etc.). The same list shape applies to every family-history section with this structure (MER `family_history` and Tele `tele_mer.family_history`).
3. **Habits:** choose flat fields or `habits[]`. Include Freq and Remarks if the UI should show them. `…Quant` / `quantity` must be a number (decision: Quantity is numeric, so V4's `"5/day"` and `"2 pegs/week"` must be sent as numbers). The UI shows a non-numeric Quantity empty. `…Year` / `year` is also a number.
4. **BP (V4, resolved):** `blood_pressure_and_pulse.readings[]` of `{ readingId, readingSeq, systolic, diastolic }`, plus `avgSystolic`, `avgDiastolic`, `pulseRate`. `readingId` is a row id (V4: 125, 126, ...); the UI orders and labels the readings by `readingSeq` (1, 2, 3, ...). The split `systolic[]` / `diastolic[]` form is still read as a fallback.
5. **Question tables (resolved):** the API owns the question set (open question 6). The UI shows every question returned. Open for the API team: `mandatory` is `null` on all 47 MER questions and `questionGroup` is `0` everywhere, so no question is treated as mandatory until they are filled.
6. **CBC:** send the 14 analytes missing from the UAT sample (or confirm they are not performed). Send one Eosinophil row, not both `Eosinophils` and `Esinophils`. The mock already has all 25 UI rows; the 14 added rows (ESR, absolute counts, MPV, PDW, MCH, MCHC, RDW, morphology) carry sample values, not UAT data.
7. **HBsAg and similar single-result tests:** return the result at the section root (`value`, `findings`, lab range, unit). The UI does not read `parameters[0]` for these tests (decided; see open question 25).
8. **Key naming:** align section keys with the UI (see the YAML for the list). Examples: `habit_and_addictions`, `family_history`, `blood_pressure_and_pulse`, `blood_urea_and_nitro`, `dobutamine_stress_echocardiogram`, `exercise_stress_echocardiogram`.
9. **Test status:** add `status: done | not_done` per test, so empty tests are not shown as results.
10. **Remark naming:** use one of `remark` or `remarks` across all tests.
11. **Date naming (optional):** the UI reads `testDate` for the Special Medical tests, Microalbuminuria and PSA, and `date` for PFT and the other Other Medical tests, which matches the prototype and V4 (open question 27, closed). Unifying them is a suggestion only; if the API team changes a key, the mapper key for that test changes with it.
12. **Doctor registration:** send `doctorRegistrationNo` (V3 does). The UI reads only this key; `doctorRegNo` is no longer read.
13. **CMO decision (V4, resolved for the shape):** every Special Medical test sends `cmo_decision { current, history[] }`. `history[]` item: `{ userName, ntid, poolName, decision, remarks, updatedOn }`, newest first, `updatedOn` ISO with microseconds and no timezone (`2026-11-25T07:25:51.696323`). `current` has the same data under `cmoDecision` / `cmoRemarks`. The UI shows the table for 2DECHO, ECG and TMT only, from `history[]`, and ignores `current`. Open: confirm the timezone, and whether the table should show on the other ten tests (V4 sends the object for all 13).
14. **Coded values:** the **master API** is the source of truth for every coded list, and the UI loads its dropdown options from the same master, so the fetch response and the UI options always use the same codes. The mapper does not translate codes. It matches the fetched value against the option list the UI holds and leaves a value outside that list empty. Applies to: Gender (MER, Tele, Examinee Gender on every Other Medical test; V4 sends `M` / `F`), Place of Examination (`RES_OFFICE`), Education and Occupation (`GRAD`, `PG`, `SAL`), Tele Adversity (`No Adversity`), the reactive tests (HBsAg, HIV Elisa, COT, Serum Cotinine, HIV Western Blot, HCV; V4 sends `non_reactive`, and a Findings text such as `NEGATIVE/NON REACTIVE`) and `biuMedicalStatus` (`N`). Until the UI loads the master lists, the hardcoded lists in `medical.schema.ts` are placeholders and these fields show empty on V4 data. This is expected, not a mapper defect.
15. **Parameter item shape:** for every parameter-list test (CBC, LFT, Lipids, OGTT, RUA, SMA12, TFT, S13, and HBsAg's `parameters[0]`) send each `parameters[]` item with six keys: `paramName`, `value`, `labRangeValueStart`, `labRangeValueEnd`, `unitsValue`, `findings`. These are the same result keys as the single-value tests (the Normal Range column is `labRangeValueStart` to `labRangeValueEnd`). The UAT CBC and HBsAg samples send 24 keys per item (`paramValue`, `paramUnits`, `refRangeFrom`, `refRangeTo`, `ejectionFraction`, `axis`, `mets`, `applicationNumber`, `partyId` and so on), most of which belong to other tests. The UI shows five columns: Parameter, Value, Normal Range, Unit, Findings. The mock already uses this shape for every parameter-list test and for HBsAg. Dropdown-valued rows (most of RUA) have no numeric range, so their range, unit and findings are `null`. Also send the UI names as `paramName` (for CBC, `Hemoglobin(Hb)` and `Differential_Neutrophil`, not UAT's `Haemoglobin(Hb)` and `Neutrophils`). In the YAML, search `CHANGE R15` to find every entry that changed.
16. **TMT `mets`:** send a whole number from 1 to 18, as a string or a number (for example `"10"` or `10`). The UI dropdown has only these 18 values; anything else (a decimal, or above 18) is shown empty.



---

## Questionnaire contract

> **Reference for API team:** this section is part of the medical fetch response. The matching YAML block is in [`design-reference/medical-data-fetch-mapping.yaml`](design-reference/medical-data-fetch-mapping.yaml) (search `QUESTIONNAIRE`). Share both together. The 47-question MER sample is in [`mock/medical/mer-question-table.json`](mock/medical/mer-question-table.json).

Common component: one questionnaire structure for every question table (MER `mer.question_table`, Tele `tele_mer.question_table`, and any future section). V4 returns it as the list `questions` (the mapper also accepts `answers` and `questionnaire`). The Medical screen renders one row per item, with `layout: "questionnaire"` in [`medical.config.ts`](apps/common/src/modules/Medical/medical.config.ts:363).

The API must return a **list of questions**, not one flat field per question. Child questions point to their parent through `parentId`.

| Field | Type | UI column | Notes |
|---|---|---|---|
| `id` | string | Question Id | Unique per section. Example: `1.a`, `2.b`, `6.1`. |
| `parentId` | string / `null` | Parent Id | `null` for top-level questions. A child points to its parent `id`. |
| `parentOption` | string / `null` | Parent option | Option `key` of `parentId` that shows this question. `null` when the child is shown on a `Y` answer of `parentId` (or when `parentId` is `null`). |
| `questionDesc` | string | Question | Question text shown in UI. |
| `questionDetails` | string / `null` | Question details | Hint text from `QUESTION_DETAILS` (e.g. `FOR FEMALE EXAMINEE ONLY`). `null` if none. |
| `questionGroup` | number | Question group | From `QUESTION_GROUP`. |
| `mandatory` | boolean | Mandatory | From `QUESTION_MANDATORY`. The question must be answered. |
| `questionType` | `TEXT` / `NUMBER` / `SINGLESELECT` / `MULTISELECT` | Question type | Decides the control in UI. |
| `answerType` | list of options / `null` | Response options | For SINGLESELECT / MULTISELECT. `null` for TEXT / NUMBER. Each option is described below. |
| `section` | `MER` / `TELEVMER` | Section | Which questionnaire the question belongs to. |
| `response` | string / `null` | Response | Selected option `key` (or entered value). `null` = not answered. |
| `remarkMandatory` | boolean | Remarks mandatory | Question-level flag in the earlier contract. V4 does not send it on the question; it sends it per option (see the option table). |
| `responseId` | number / `null` | (not shown) | V4 field, `null` in the sample. Not read by the UI yet; likely needed by the save path (open question 9). |
| `dropdownOptions` | list / `null` | (not shown) | V4 field, `null` in the sample. Not read by the UI. |
| `remarks` | string / `null` | Remarks | Free text. Required when `remarkMandatory` is `true`. |

**Option object** (each item of `answerType`):

| Field | Type | Notes |
|---|---|---|
| `key` | string | Option key from the master (MER mock: `Y`, `N`). |
| `label` | string | Option text shown in the Response select (e.g. `Yes`, `No`). |
| `remarkMandatory` | boolean | V4 form: `true` makes `remarks` mandatory when this option is selected. Set per option by the master (API output), not derived in the UI. |
| `remarksMandatory` | `"Y"` / absent | Earlier form of the same flag. The parser accepts both. |
| `subQuestionIds` | string[] | Child question ids this option triggers. Empty if none. Mirrors the children's `parentOption`. |

**Visibility rule (UI):** a child row is shown only when its parent is shown and its trigger is met. If `parentOption` is set, it must be one of the parent's selected keys. If `parentOption` is `null`, the parent's response must be `Y`. A hidden parent hides all its children.

**Multi-select answers:** for `MULTISELECT`, `response` is the selected option `key` values joined by `,` (e.g. `Chest Pain,Palpitations`). `null` or empty = nothing selected.

**MER example** (earlier contract form, with `remarksMandatory: "Y"`; V4 sends `remarkMandatory: true`. `data.sections.mer.question_table.questions` in `mock/medical/medical-data-fetch.json`):

```json
{
  "id": "1.a",
  "parentId": null,
  "questionDesc": "Are you the examinees medical attendant?",
  "questionDetails": null,
  "questionGroup": 1,
  "mandatory": true,
  "questionType": "SINGLESELECT",
  "answerType": [
    { "key": "Y", "label": "Yes", "remarksMandatory": "Y", "subQuestionIds": [] },
    { "key": "N", "label": "No", "subQuestionIds": [] }
  ],
  "section": "MER",
  "response": "N",
  "remarkMandatory": false,
  "remarks": null
}
```

**Tele example** (earlier contract form, `TELEVMER`; V4 sends `section: "TELE"` under `data.sections.tele_mer.question_table.questions`; Tele option keys are the source option labels until the master provides keys):

```json
[
  { "id": "6", "parentId": null, "parentOption": null, "questionDesc": "Any history of heart diseases-chest pain/palpitations/ Breathlessness on exertion?", "questionType": "MULTISELECT", "answerType": [ { "key": "Chest Pain", "label": "Chest Pain", "subQuestionIds": ["6.1.1", "6.1.2", "6.1.3", "6.1.4"] }, { "key": "Palpitations", "label": "Palpitations", "subQuestionIds": ["6.2.1", "6.2.2", "6.2.3", "6.2.4"] }, { "key": "Breathlessness on Exertion", "label": "Breathlessness on Exertion", "subQuestionIds": ["6.3.1", "6.3.2", "6.3.3", "6.3.4"] } ], "section": "TELEVMER", "response": null, "remarkMandatory": false, "remarks": null },
  { "id": "6.1.1", "parentId": "6", "parentOption": "Chest Pain", "questionDesc": "What were the complaints or sysmptoms?", "questionType": "TEXT", "answerType": null, "section": "TELEVMER", "response": null, "remarkMandatory": false, "remarks": null }
]
```

Open:
- Confirm the `id` scheme is the same for MER and Tele (sample uses `1.a` in MER and `1`, `1.1` in Tele).
- Confirm `null` means "not asked" or "not answered".
- Confirm the final names: sample has `questionDesc`, `questionValue` and `remark`; this contract uses `response` and `remarks`.
- Tele option `key` values are not provided by the master yet. The mock uses the source option labels as keys.
- Tele `6.1` ("Chest Pain - Since how many years?") is a v2 source row and is kept. Confirm.
- Confirm whether `remarkMandatory` is returned by the API or derived by the UI from the selected option. The contract assumes the API.


## Open questions

1. Resolved: a test can be repeated. The screen's **History** button on each section shows the earlier results, and the section is repeated once per past test. So `data.sections.<key>` stays one object per test (the current result) and past results are a separate concern. See open question 29.
2. Resolved: the Proposer uses the same endpoint. The call is made once per party, and the Life Assured and the Proposer each pass their own `partyId` (the screen already sends the selected applicant's `partyId`). No new API is needed.
3. Resolved: `medAppDtlId` stays in the response structure (root and `tele_mer`). The UI does not map it to any field. It is carried as-is and echoed back when the data is saved (the save path is open question 9).
4. Resolved: `Examination Time` (UI) and `examTime` (API) are the same concept. The mapper shows the value as sent. The API value is `null` in the sample, so the format (24-hour `HH:MM`, 12-hour, or with a date) goes to the API team to confirm.
5. Resolved (revised): the master API owns the code lists and the UI syncs its dropdown options to the same master (decision, replaces "UI lists are the source of truth"). Recorded as API-team request 14. The mapper does not translate codes; a value outside the UI list is left empty. Open: the master operation id, its response shape (code and label per option) and the list names for gender, place of examination, education, occupation, adversity, reactive result and BIU medical status. Not invented here. When supplied, the UI replaces the hardcoded lists in `medical.schema.ts` with the master options, matching on the code and showing the label.
6. Resolved: the API owns the question set, the sub-questions, the answer types and the options. The UI has no fixed question list or count. It renders what `questionnaire[]` returns, using the parent / sub-question logic (`parentId`, `parentOption`, `subQuestionIds`): a top-level question always shows, and a sub-question shows only when its parent is shown and the parent's answer triggers it. This is already built (`getVisibleMedicalQuestions`). The earlier counts (9 MER, 6 Tele, 47, 210) were from the prototype and no longer matter. The sample mock is flat for MER (47 top-level, no children), so the hide and show behaviour is not exercised by the MER mock; Tele does have children.
7. Resolved: no. The UI shows only the questions the API returns (see question 6). "Describe Build" and "abnormality in general appearance" are not in the Tele `questionnaire[]`, so they are not shown. If the business needs them, the API team adds them as questions.
8. Resolved (decision: keep as per the API): S13 keeps its current 22 rows (the same analytes as SMA12). The API sends the same 22 `parameters[]` items and each one fills its UI row by name; nothing is missing or dropped. If the lab later gives a different S13 list, that is a UI row change and the API fills values by `paramName`.
9. Confirm the save path for the screen's own editable data. This does not include the CMO decision grid: it is a read-only audit trail fetched from the API (what each CMO decided on 2DECHO, ECG and TMT), and nobody edits it on this screen, so it never goes in a save payload. Parked: the save path is out of scope until the fetch side is finished. No save endpoint or payload is designed yet.
10. Tele MER coded fields `Disclosure`, `MER Detail`, and `Tele Type` should be dropdowns, but have no option list and no control kind yet; today they stay free text. The prototype shows sample values only (`Material`, `Video MER`, `TMER`). Open until the master supplies the option lists; then I add a control kind and the options, and the mapper matches the API value against them (a value outside the list is left empty). The lists are not invented here. (`Adversity` is mapped to Yes/No.)
11. Resolved and built: `Time of Tele call` is a time in 12-hour form, for example `04:26 PM`, with no date. The screen stores `hh:mm AM/PM` and the input is a text field with that placeholder (typed text is upper-cased). The schema accepts only `hh:mm AM/PM` (`MEDICAL_TIME_12H`, hours 01-12). The mapper converts an API value of `HH:MM` (24-hour) or `hh:mm AM/PM` to that form and leaves anything else empty, including a value with a date such as `17-07-2026 04:26 PM`. Open for the API team: the format of `dateTimeOfTeleCall` (it is `null` in the V4 sample, and the key name says date and time) and whether the time is sent with a date. If a date is sent, the mapper needs a rule to drop it; that is not built.
12. **CLOSED.** `Annual Income` is a `currency` control kind. In read-only view it shows Indian digit grouping through `formatIndianCurrency` from `@insurance-poc/utils` (`2000000` shows as `₹ 20,00,000`, which includes the `₹ ` prefix the helper adds). In edit mode it is a plain number input, and the stored and validated value stays the plain number (`optionalNumeric`). A value that is not a number is shown as stored. The mapper keeps the API value as text. The prototype shows `2000000` with no grouping; this display follows the earlier decision, not the prototype.
13. Resolved: `calculateMedicalMeasurements` now gives `Inches` and `BMI` to two decimal places, matching the prototype (165 cm and 65 kg give 5 ft, 4.96 in, BMI 23.88). The function is shared, so MER Measurement uses the same rounding.
14. Tele Family History uses the shared family table (Relation Type, Age, Dead or alive, Health Status) with the Father / Mother starter rows. `Health Status` should be a dropdown, but has no option list yet, so today it is free text. Open until the master supplies the list; then I add the dropdown, and the mapper matches the API value against it (a value outside the list is left empty). Reference only, not a list to build: the prototype shows `GOOD`; typical alternatives to ask the master about are `GOOD`, `FAIR`, `POOR`, `CRITICAL`, `NOT KNOWN`. These are examples to start the conversation, not confirmed values, and they are not in the code. The API-side family mismatch is already tracked in the mapping section above.
15. Resolved: no code change.
   - `aliveStatus`: keep as is. Only `A` (Alive) has been seen, and the mapper does not guess the Dead code. The code list comes from the master configuration when it is added; the mapper is then matched to that list.
   - `relationType`: the API sending it in uppercase (`FATHER`) is fine. The UI title-cases it (`Father`) to match the relation options, as it does today.
16. Resolved (v2): `application_form_medical` added `hazardousOccupation`, `illnessImpairment`, and `adverse`. Mapped in `medical.mapper.ts`.
17. Resolved (v4): `blood_pressure_and_pulse` sends `readings: [{ readingId, readingSeq, systolic, diastolic }]` with `avgSystolic`, `avgDiastolic`, and `pulseRate`. Mapped dynamically in `medical.mapper.ts`.
18. Resolved: Special Medical `mets` (TMT). The UI list is "1" to "18". The API sends the value as a string or a number (`"10"` and `10` both show as `10`); the V3/V4 mock sends `"10"`. A value outside the list (for example `19` or `10.5`) is left empty. Recorded as API-team request 16. Covered by a mapper test.
19. Resolved: Special Medical and Other Medical `remark` / `remarks`, `date` / `testDate` and `doctorRegNo` / `doctorRegistrationNo`. The UI reads the API as it is (V4), with no fallback to another spelling. `Doctor Registration No` is read from `doctorRegistrationNo` for every test. `Test Date` / `Date` is read from `testDate` or `date`, whichever each test sends (Special Medical and Microalbuminuria / PSA: `testDate`; PFT and the Other Medical tests: `date`). `Remark` is read from `remark` for CXR, Mammogram, Blood Urea, ECG and both stress echos, and `Remarks` from `remarks` for 2DECHO, Pap Smear, Stool Test, TMT, USG and Fundoscopy.
20. Resolved (v4): CMO decision audit trail is provided in `cmo_decision.history[]` on 2DECHO, ECG, and TMT. Mapped in `medical.mapper.ts`.
21. Resolved (v2): `tele_mer.disposition` added `remarks2`. Mapped in `medical.mapper.ts`.
22. Retail: the mapper is shared, but only Group is wired. Retail wiring needs its own service and URL.
23. CLOSED: the screen shows only the sections the API returns. A section with no object in the response is not rendered, and a group left with no sections is hidden from the left panel and the page. A section sent as an empty object is still shown, with empty fields. Decision is always shown, because the reviewer fills it in. Not every test is done on every case, so a missing test is normal, not an error.
   Separate note: mock mode imports the 250 KB mock into the Group bundle. It goes away when mock mode is off, or if the import is made lazy.
24. The three tests `breRetrigger` (2) and `drsTaskContext` (1) in `apps/common` fail before and after this work. They are not related to Medical and were not touched.
25. HBsAg: resolved for the UI, no fallback. The mapper reads only the root `value`, which is `null` in the UAT sample, so `Value` stays empty on screen until the API sends the result at the section root (request 7). The data flows from the API; the UI does not read `parameters[0]`. Still to confirm, the code list: the UI dropdown has "Negative/Non Reactive" and "Positive/Reactive", and a code outside that list is left empty (this applies to COT, HIV Elisa, Serum Cotinine, HIV Western Blot and HCV too).
26. **CLOSED.** Microalbuminuria and PSA: the mapper reads the entered number from API `value` and the auto-calculated text from API `findings`. The prototype confirms this direction (`dvt-drs.html`, MICROALBUMINURIA: `value` is the required, editable numeric field and `findings` is the non-editable one). V4 carries real values (`value` `"12"` / `"3.4"`, `findings` `"NORMAL"`), shown as `Findings` = `12` / `3.4` and `Result` = `Normal`. The screen labels differ from the prototype: the screen shows the entered number as `Findings` and the auto text as `Result`, while the prototype labels them `Value` and `Findings`. Decision: keep the current screen labels. Only the wording differs; the data flow is the same.
27. **CLOSED.** Date key per test: each test sends and the mapper reads its own key, and the split matches the prototype (`dvt-drs.html`), V4, `medical-data-fetch-merged.json` and `medical-data-fetch.json` (checked on 26 tests, same result in all three). `testDate` (UI label "Test Date"): the 12 Special Medical tests other than PFT (2DECHO, Blood Urea, CXR, both stress echos, ECG, Mammogram, Pap Smear, Stool, TMT, USG, Fundoscopy), Microalbuminuria and PSA. `date` (UI label "Date"): PFT and the other 19 Other Medical tests (the 11 single-value tests and the 8 parameter-list tests). The mapper has no fallback from one key to the other (question 19). The UI does not force one key; unifying them is an optional API-team suggestion (request 11), not a UI defect.
28. **CLOSED.** Other Medical header keys: the mapper reads `medicalType`, `examineeName`, `examineeAge`, `examineeGender`, `diagnosticCentreName`, `diagnosticCentreAddress`, `diagnosticCentrePincode`, `doctorName` and `doctorRegistrationNo`. V4, `medical-data-fetch-merged.json` and `medical-data-fetch.json` all send these nine keys on all 21 Other Medical tests, and none of the older duplicates (`centreName`, `centreAddress`, `pincode`, `doctorRegNo`), which the mapper ignores. The prototype (`dvt-drs.html`) uses `diagnosticCentrePincode` and the same names. `examineeGender` is a coded value (V4 sends `M` / `F`) and shows empty until the master list is synced (request 14).
29. Resolved (v4): Historical repeat medical data is provided via `history: [ ... ]` arrays across all sections. The mapper extracts these into `MedicalFetchResult.history` (keyed by section) with `Report Received: <date>` labels, feeding the `<MedicalHistoryDialog>` in read-only mode.
30. Decision menu: `biuMedicalStatus` is `N` in the UAT sample and the UI has no option list for BIU Medical Status (a locked text field), so the mapper shows it as sent. Confirm the code list and what each code means (API team), then a display list can be added. The other BRE fields and `medicalDecision` are `null` in the UAT sample; confirm they are filled by the BRE / CMO flow. `Medical Decision` is a dropdown of `Standard` / `Non-Standard`: confirm these are the full list. The mock carries sample values (not UAT data).




---

Status: Draft
