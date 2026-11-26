# Telemer Screen Implementation Plan

## Top-Level Overview
Design and implement the **Telemer (Tele/Video MER) Screen** for underwriting review of Telephonic and Video Medical Examination Reports across multiple lives (Life Assured 1, Life Assured 2, Proposer). The screen integrates with the existing medical fetch service, displays only the Overview and Tele/Video MER sections, provides multi-life tab navigation with edit/save controls, validates field data with existing Zod schemas, and sequentially triggers the Task Submission API upon completion to close the task and redirect to the Inbox.

---

## Sub-Tasks

### Sub-Task 1: Section Map & Screen Specification
- **Intent**: Define the formal section breakdown, field mappings, API payload contracts, and layout requirements.
- **Expected Outcomes**:
  - `docs/spec/screens/telemer-screen.sections.md` created with all 11 sections tracked.
  - `docs/spec/screens/telemer-screen.md` created with full UI/API specification.
- **Todo List**:
  1. [x] Create section map `telemer-screen.sections.md`.
  2. [x] Create screen spec `telemer-screen.md`.
- **Status**: `[x] done`

---

### Sub-Task 2: Interactive HTML Prototype Creation
- **Intent**: Deliver the standalone interactive prototype matching the ICICI design tokens, sticky headers, multi-life tabs, dynamic questionnaire, BMI calculation, and task submission modal.
- **Expected Outcomes**:
  - Prototype available at `design-reference/ui-prototypes/telemer/telemer-screen-prototype.html`.
- **Todo List**:
  1. [x] Create prototype HTML file under `design-reference/ui-prototypes/telemer/`.
  2. [x] Validate layout with sticky header (57px), banner, multi-life tabs, and sticky action footer.
  3. [x] Verify interactive edit/save toggle, dynamic question expansion, and mock task completion flow.
- **Status**: `[x] done`

---

### Sub-Task 3: Shared Medical Configuration & Filter Helpers
- **Intent**: Provide dedicated section grouping and filter configurations in `apps/common/src/modules/Medical/` so that the Telemer screen displays only the Overview and Tele-Video MER groups without physical MER or Special Medical lab tests.
- **Expected Outcomes**:
  - Export `TELEMER_GROUPS` / `TELEMER_SECTIONS` in `medical.config.ts`.
  - Ensure compatibility with `mapMedicalFetchPayload()`.
- **Todo List**:
  1. [x] Configure `TELEMER_SECTIONS` and `TELEMER_GROUPS` in `medical.config.ts`.
  2. [x] Add unit tests in `medical.mapper.test.ts` to verify Telemer payload filtering.
- **Status**: `[x] done`

---

### Sub-Task 4: Multi-Life Telemer Page & Task Submission Integration
- **Intent**: Implement the Telemer page component (`TelemerScreen.tsx`) consuming the shared `Medical.tsx` component, managing multi-life state, handling save validation, and executing the sequential task submission API upon final approval.
- **Expected Outcomes**:
  - Telemer module exported under `@insurance-poc/common/telemer`.
  - Multi-life tab switching with dirty/saved state counters.
  - Sequential invocation of task completion endpoint followed by redirection to Inbox.
- **Todo List**:
  1. [x] Scaffold `TelemerScreen.tsx` using `@insurance-poc/ui` and `Medical.tsx`.
  2. [x] Implement multi-applicant data state store and save handlers.
  3. [x] Wire Task Completion API mutation and route transition to Inbox.
  4. [x] Run `tsc --noEmit` across all apps to verify zero type errors.
- **Status**: `[x] done`
