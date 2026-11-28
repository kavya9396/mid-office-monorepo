# Telemer (Tele/Video MER) Screen Specification

## Overview
The Telemer (Tele-Video MER) screen allows Underwriters and Data Verification Officers to review, edit, validate, and submit Tele-Medical Examination Report (Tele-MER / Video-MER) findings for one or more lives (multi-life scenario: Life Assured 1, Life Assured 2, Proposer). 

This screen focuses exclusively on the pre-MER overview and Tele/Video MER data sections (excluding physical MER clinical examination tests and Special Medical lab tests). After entering and saving valid data for all lives, the user can trigger the final Submit action, which sequentially calls the Task Submission API to complete the task and redirects back to the Inbox.

## URL & routing
- **Route**: `/telemer` or `/group/telemer` / `/retail/telemer`
- **Query Parameters**:
  - `applicationNo` (e.g. `23456789`)
  - `taskId` (e.g. `TSK-10293`)
  - `partyId` (optional, initial client identifier)

## Layout
- **Page Layout**: Sticky, compact layout per `docs/spec/screens/00-shared-layout.md` and GUW DRS conventions:
  - **Header**: Sticky top, `height: 57px`, GUW standard ICICI gradient `#f58220` → `#98252b`, 44px back button, date/session timer, user profile pill (z-index: 100).
  - **Main Container**: `height: calc(100dvh - 57px); overflow-y: auto; background: #fff8f3;` with dense vertical spacing to minimize scrolling.
  - **Applicant Banner**: Compact GUW-styled banner with avatar gradient, policy pills, product information, and quick history action (z-index: 20).
  - **Applicant Tabs**: Sub-header multi-life selector (LA1, LA2, Proposer) with distinct brand maroon (`#9a2529`) background on active selection and silent tab switching without popups.
  - **Form Grid & Border Spacing**: Dense 4 to 5 fields per row (`grid-5` / `grid-4`) with tight 5px–8px spacing and compact 25px form controls. Clean section headers without clutter badges.
  - **Content Body**: Flat, always-expanded section cards (non-collapsible) with an overall Edit / Save Telemer action bar.
  - **Footer**: Compact 44px sticky bottom action bar with "Save Current Life" and "Submit & Complete Task".

---

## Screens

### TelemerScreen
#### Purpose
Review and verify Telephonic and Video Medical Examination data, measurements, family medical history, lifestyle habits, questionnaire responses, and disposition remarks across all applicants on a policy.

#### Prototype file
`design-reference/ui-prototypes/telemer/telemer-screen-prototype.html`

#### Component tree
```text
TelemerScreen
├── AppHeader (Sticky, 57px)
│   ├── BackButton (navigates to previous / inbox)
│   ├── ICICILogo & AppTitle ("Tele-MER Verification")
│   └── UserSessionMenu (User avatar, name, logout)
├── ApplicantSummaryBanner
│   ├── Avatar & Name (e.g. "Rudra Prakash Sangha")
│   ├── ApplicationNumberPill ("App No. 23456789")
│   ├── DemographicsInfo (Age, Gender, Occupation, Income, City)
│   └── ProductDetails (Plan Name, Riders, TSA/TRSA Eligibility)
├── MultiLifeTabs
│   ├── Tab: Life Assured 1 (Status: Completed / In-Progress)
│   ├── Tab: Life Assured 2 (Status: Pending)
│   ├── Tab: Proposer (Status: Pending)
│   ├── ViewDocumentsButton ("View Documents" -> opens Document Viewer Dialog)
│   ├── HistoryButton ("History" -> opens Historical Tele-MER Dialog)
│   └── EditTelemerButton ("Edit Telemer" / "Cancel Edit")
├── DocumentViewerDialog
│   └── DocumentList (Application form, Telemer examiner report PDF, disability cert, prior policy letter, KYC)
├── HistoricalTelemerDialog
│   ├── AttemptSwitcher (Multiple historical attempts: Attempt #1, Attempt #2, etc.)
│   ├── AttemptMetadataBar (Examiner name, Reg ID, TPA, Duration)
│   └── ReadOnlyTelemerReplica (Exact 5-column and 4-column read-only replica of all Telemer sections)
│       ├── Section 1: Application Form Medical & Lifestyle (Read-only)
│       ├── Section 2: Tele/Video MER Details (Read-only)
│       ├── Section 3: Measurements & BMI (Read-only)
│       ├── Section 4: Family History (Read-only table)
│       ├── Section 5: Habit and Addiction (Read-only table)
│       ├── Section 6: Question Table with Disclosed Responses (Read-only)
│       └── Section 7: Disposition Details (Read-only)
├── SectionContainer
│   ├── Section 1: Application Form Medical & Lifestyle Details (Overview)
│   ├── Section 2: Tele/Video MER Details (Demographics, Call Details, Examiner)
│   ├── Section 3: Measurements (Height cm/ft/in, Weight kg, BMI)
│   ├── Section 4: Family History (Dynamic Members Grid: Relation, Age, Status)
│   ├── Section 5: Habit and Addiction (Smoking, Tobacco, Narcotics, Alcohol Grid)
│   ├── Section 6: Question Table (Dynamic Parent-Child Questionnaire)
│   └── Section 7: Disposition Details (TUW Status, Remarks, Notes)
└── ActionFooter (Sticky Bottom)
    ├── SaveApplicantButton ("Save Current Applicant")
    └── FinalSubmitButton ("Submit & Complete Task", enabled when all lives valid)
```

#### Data / API
1. **Fetch Data API**:
   - **Endpoint**: `POST /icic-medical-service/v1/medical-data/fetch`
   - **Request Payload**:
     ```json
     {
       "applicationNumber": "23456789",
       "partyId": "PARTY-001",
       "sections": ["tele_mer", "application_form_medical_lifestyle"]
     }
     ```
   - **Response**: Mapped via `mapMedicalFetchPayload()` yielding `tele_mer`, `tele_measurements`, `tele_family_history`, `tele_habit_addiction`, `tele_question_table`, `tele_disposition`.

2. **Save Data API**:
   - **Endpoint**: `POST /icic-medical-service/v1/medical-data/save`
   - **Request Payload**:
     ```json
     {
       "applicationNumber": "23456789",
       "partyId": "PARTY-001",
       "applicantKey": "lifeAssured1",
       "tele_mer": { ... },
       "tele_measurements": { ... },
       "tele_family_history": [ ... ],
       "tele_habit_addiction": { ... },
       "tele_questionnaire": [ ... ],
       "tele_disposition": { ... }
     }
     ```

3. **Task Submission API**:
   - **Endpoint**: `POST /icic-task-service/v1/task/submit` or `POST /icic-task-service/v1/task/complete`
   - **Request Payload**:
     ```json
     {
       "taskId": "TSK-10293",
       "applicationNumber": "23456789",
       "taskType": "TELE_MER_REVIEW",
       "status": "COMPLETED",
       "completedBy": "UW001",
       "remarks": "Tele-MER verification completed for all lives."
     }
     ```
   - **Response**: `{ "success": true, "message": "Task completed successfully" }`

#### Behaviour & interactions
1. **Multi-Life Switching**:
   - Switching applicant tabs instantly switches the active applicant's data store without blocking alert popups.
   - Selected tab features a prominent active background (`#9a2529` maroon with white text).
   - Real-time status indicators (green dot for completed/saved, amber for dirty/pending).
2. **Editing & Validation**:
   - Dense, space-optimized 4/5-column layout with 25px control height and tight card padding to reduce scrolling.
   - All section cards are flat, static, and always expanded (non-collapsible). Clean section titles without "Read-Only (Application Source)" or extraneous tags.
   - Clicking **Edit Telemer** on the overall action bar unlocks all editable Telemer sections simultaneously.
   - Clicking **Save Telemer** or **Save Current Life** runs Zod schema validation across all sections for the active applicant.
   - Inline red validation errors are displayed beneath invalid fields.
   - Height / Weight changes automatically recalculate the BMI field.
3. **Questionnaire Parent-Child Triggers**:
   - Selecting "YES" on trigger questions displays nested sub-questions.
   - Questions requiring mandatory remarks display a red asterisk and validate on save.
4. **Final Task Submission**:
   - The "Submit & Complete Task" button is enabled only when all required applicant profiles have been saved without validation errors.
   - On click, a loading spinner is shown, the task submission API is called sequentially, a success toast notification appears, and the browser navigates back to the Inbox.

#### Accessibility notes
- Standard keyboard navigation (`Tab`, `Shift+Tab`, `Space`, `Enter`) across tabs, accordion cards, and inputs.
- ARIA live region for validation error announcements.
- Form inputs have associated `<label>` elements and `aria-invalid` attributes.

---

## Open questions
1. Confirmation of exact save endpoint URL and schema if separate from the unified medical save service.
2. Confirm whether `tele_disposition` TUW Status options should be populated from master enum data or static dropdown list.

Status: Draft
