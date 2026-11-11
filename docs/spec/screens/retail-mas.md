# Retail — Medical Appointment Scheduling (MAS) Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/MAS/`
> App target: `apps/retail` → `src/modules/mas/`

---

## Overview

MAS handles the scheduling and tracking of medical examinations for life insurance proposals.
The workstream enables coordinators to schedule medical appointments, view DVT reports,
and track examination outcomes.

**Prototype notes:**
- `landing-prototype.html` and `mas-drs-prototype.html` are **minified React bundles** — annotated
  with `data-spec-note="minified-bundle; annotations not possible"`. Spec for these screens is
  derived from the bundle comment and existing knowledge; details are open questions.
- `audit-trail.html`, `dvt-mr-view-medical.html`, `dvt-nmr-view-financial.html` are hand-authored
  HTML prototypes — fully annotated and specced below.

**Login** — uses the shared platform login at `/login` (`apps/common`).
See [`docs/spec/screens/shared-login.md`](./shared-login.md) for the full spec.
The `login.html` prototype in this workstream folder is for standalone demo use only.
No workstream-specific login route exists.

---

## URL & Routing

| Route | Screen | App |
|---|---|---|
| `/login` | Login (shared) | `apps/common` — see [`shared-login.md`](./shared-login.md) |
| `/retail/mas` | Landing / Inbox | `apps/retail` |
| `/retail/mas/:applicationId` | DRS — MAS Task | `apps/retail` |
| `/retail/mas/:applicationId/audit-trail` | Audit Trail | `apps/retail` |
| `/retail/mas/:applicationId/view-medical` | DVT Medical Report | `apps/retail` |
| `/retail/mas/:applicationId/view-financial` | DVT Financial Report | `apps/retail` |

All routes require `businessType === 'RETAIL'` and role `MAS_COORDINATOR`.

---

## Shared design tokens

See [00-shared-layout.md](./00-shared-layout.md) for all design tokens, page shell patterns,
and shared component specs. Tokens used verbatim in this workstream:

| Token | Value |
|---|---|
| Page background (DRS) | `#fff8f3` |
| Page background (Landing) | `#f0f3f8` |
| Brand orange | `theme.palette.primary.main` (`#e45f14`) |
| Font | `Mulish, Arial, sans-serif` |
| Base font size | `12px` |

---

## Component reuse (confirmed)

*Confirmed by user — one row per decision across all three specced screens.*

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| App header (all screens) | `AppHeader` | `[shared]` | `00-shared-layout.md §2` | `showBack=true`; `onBack` → `/retail/mas/:applicationId`; applicant details from API as string array, multiple rows |
| Audit trail table | `CustomTable` | `[reuse]` | `@insurance-poc/ui` | 7 columns; paginated |
| Pagination | `CustomTable` built-in | `[reuse]` | `@insurance-poc/ui` | Handled internally |
| Pool filter pill-bar | — | **out of scope** | Independent development | Being developed independently; will be merged — leave placeholder region only |
| Applicant-type switcher (medical & financial) | `CustomRadioGroup` | `[reuse]` | `@insurance-poc/ui` | Tab-style radio; static `masPersonTypes` options |
| "View Documents" button (medical & financial) | — | **out of scope** | Extended screen | Developed independently; will be merged — leave placeholder only |
| Documents overlay (medical & financial) | — | **out of scope** | Extended screen | Same as above |
| Section search bar (medical & financial) | `SearchBar` | `[reuse]` | `@insurance-poc/ui` | With clear button; filters section navigator |
| Section navigator + content (medical & financial) | `DvtSectionViewer` | `[new]` | `apps/retail/src/modules/mas/` | Left nav (collapsible group list) + right content pane; shared between medical and financial screens; API-driven |
| Submit button (medical & financial) | `CustomButton` | `[reuse]` | `@insurance-poc/ui` | Primary action; triggers report-decision API |

---

## Screens

> **Login** — uses the shared platform login at `/login` (`apps/common`).
> See [`docs/spec/screens/shared-login.md`](./shared-login.md).
> The `login.html` prototype in this workstream folder is for standalone demo use only.
> No workstream-specific login route exists.

---

### Landing / Inbox

**Prototype:** `landing-prototype.html` — minified bundle; readable structure not available.
**Intent (from bundle comment):** Standalone Axiom Inbox prototype built from existing Landing and
Header components. Search Applications is an inert placeholder; application links open matching
standalone task prototypes.

#### Purpose
Shows scheduled and pending MAS tasks in an inbox / task rail. Coordinators pick a task to open
the DRS.

#### Component tree
```
<MASLandingPage>                          {/* apps/retail/src/modules/mas/MASLandingPage.tsx */}
  <AppHeader showBack={false} />          {/* [shared] — 00-shared-layout.md §2 */}
  <div style={{ display: 'flex' }}>
    <Sidebar ... />                       {/* [shared] — 00-shared-layout.md §3 */}
    <main>
      <CustomTable                        {/* [reuse] — @insurance-poc/ui */}
        columns={masInboxColumns}
        rows={tasks}
      />
    </main>
  </div>
</MASLandingPage>
```

#### Data / API
```ts
// Placeholder — operation ID to be confirmed
GET  <env>/api/retail/mas/tasks
// data-api-config: { "operationId": "getMasTasks", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: MASTask[]
```

#### Open questions
- Column definitions for the inbox table (minified bundle — not readable).
- Filter/sort behaviour on the inbox table.

---

### DRS — MAS Task

**Prototype:** `mas-drs-prototype.html` — minified bundle; readable structure not available.
**Intent (from bundle comment):** Standalone MAS_TASK prototype. Original DRS, MAS, Header and
shared MUI components bundled. Mock data embedded. First sample applicant selected; original
controls, decision options and confirmation behavior preserved.

#### Purpose
Coordinator reviews application details and schedules or confirms the medical appointment.
Shows applicant data, selected medical vendor, appointment slot, and status tracking.

#### Component tree
```
<MASDRSPage>                              {/* apps/retail/src/modules/mas/MASDRSPage.tsx */}
  <AppHeader showBack={true}             {/* [shared] — 00-shared-layout.md §2 */}
    onBack={() => navigate('/retail/mas')} />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <ApplicantBanner {...} />             {/* [shared] — 00-shared-layout.md §4 */}
    <CustomTabs tabs={drsTabs} />         {/* [reuse] — @insurance-poc/ui */}
    {/* tab panels — details TBD from bundle */}
    <DecisionFooter ... />               {/* [shared] — 00-shared-layout.md */}
  </main>
</MASDRSPage>
```

#### Data / API
```ts
// Placeholders — operation IDs to be confirmed
GET  <env>/api/retail/mas/applications/:applicationId
// data-api-config: { "operationId": "getMasDrsApplication", "envs": { "dev": "", "sit": "", "prod": "" } }

POST <env>/api/retail/mas/applications/:applicationId/appointment
// data-api-config: { "operationId": "submitMasDrsDecision", "envs": { "dev": "", "sit": "", "prod": "" } }
Body: { action: 'CONFIRM' | 'RESCHEDULE' | 'CANCEL'; appointmentDate?: string; vendorCode?: string; remarks: string; }
```

#### Open questions
- Tab labels, field list, and decision options (minified bundle — not readable).
- Vendor selection flow details.

---

### SCR-01 — Audit Trail

**Prototype:** [`audit-trail.html`](../../design-reference/ui-prototypes/Retail/MAS/audit-trail.html)
**Route:** `/retail/mas/:applicationId/audit-trail`

#### Purpose
Read-only chronological log of all underwriting actions taken on the application.
Shows assessor comments, decisions, pool assignments, and timestamps.

#### Component tree
```
<MASAuditTrailPage>                       {/* apps/retail/src/modules/mas/MASAuditTrailPage.tsx */}
  <AppHeader                              {/* [shared] — 00-shared-layout.md §2 */}
    showBack={true}
    onBack={() => navigate(`/retail/mas/${applicationId}`)} />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <section>
      <h2>Assessment Comments</h2>
      {/* Pool filter pill-bar — placeholder only; out of scope, independent development */}
      <div data-region="pool-filter-placeholder" />
      <CustomTable                        {/* [reuse] — @insurance-poc/ui */}
        columns={auditColumns}
        rows={auditEntries}
        paginated
      />
    </section>
  </main>
</MASAuditTrailPage>
```

#### Data / API
```ts
GET <env>/api/retail/mas/applications/:applicationId/audit-trail
// data-api-config: { "operationId": "getMasAuditTrail", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: MASAuditEntry[]
```

#### Table columns

| Column | Field | Notes |
|---|---|---|
| User ID | `userId` | — |
| User Name | `userName` | — |
| Pool Name | `poolName` | — |
| Case Status | `caseStatus` | — |
| Decision | `decision` | — |
| Date Updated On | `dateUpdatedOn` | Format: `DD/MM/YYYY HH:mm:ss` |
| Comments / Remarks | `comments` | May be multiline |

#### Behaviour & interactions
- Table is paginated (10 rows per page).
- Pool filter pill-bar region is a **placeholder** — leave a clearly commented empty `<div>` with
  `data-region="pool-filter-placeholder"`; the independent component will be merged in.
- `applicationId` comes from `useSearchParams()` — not route params.

#### Accessibility notes
- `AppHeader` — see [00-shared-layout.md §2](./00-shared-layout.md#2-appheader-component).
- Table: `scope="col"` on `<th>` cells; pagination buttons have `aria-label`.

---

### SCR-02 — DVT Medical Report

**Prototype:** [`dvt-mr-view-medical.html`](../../design-reference/ui-prototypes/Retail/MAS/dvt-mr-view-medical.html)
**Route:** `/retail/mas/:applicationId/view-medical`

#### Purpose
Read-only view of the DVT (Doctor Visit Team) medical examination report for an applicant.
Coordinator can switch between Life Assured and Proposer, search sections, and submit a decision.

#### Component tree
```
<MASMedicalReportPage>                    {/* apps/retail/src/modules/mas/MASMedicalReportPage.tsx */}
  <AppHeader                              {/* [shared] — 00-shared-layout.md §2 */}
    showBack={true}
    onBack={() => navigate(`/retail/mas/${applicationId}`)} />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    {/* Applicant details — API returns string[], displayed as multiple rows */}
    <div data-region="applicant-details">
      {applicantDetails.map(line => <Typography key={line}>{line}</Typography>)}
    </div>
    <div className="topbar">
      <CustomRadioGroup                   {/* [reuse] — @insurance-poc/ui */}
        name="applicant.personType"
        options={masPersonTypes}          {/* static — see static-data */}
        value={personType}
        onChange={setPersonType}
      />
      {/* "View Medical Documents" button — placeholder only; out of scope, independent development */}
      <div data-region="view-documents-placeholder" />
    </div>
    <SearchBar                            {/* [reuse] — @insurance-poc/ui */}
      value={searchQuery}
      onChange={setSearchQuery}
      onClear={() => setSearchQuery('')}
      placeholder="Search medical section..."
    />
    <DvtSectionViewer                     {/* [new] — apps/retail/src/modules/mas/ */}
      type="medical"
      applicationId={applicationId}
      personType={personType}
      searchQuery={searchQuery}
      onSubmit={handleSubmit}
    />
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px' }}>
      <CustomButton                       {/* [reuse] — @insurance-poc/ui */}
        variant="contained"
        onClick={handleSubmit}>
        Submit
      </CustomButton>
    </div>
  </main>
</MASMedicalReportPage>
```

#### Static data
```ts
// src/data/static-data.ts
export const masPersonTypes = [
  { value: 'lifeAssured1', label: 'Life Assured1' },
  { value: 'proposer',     label: 'Proposer' },
];
```

#### Data / API
```ts
// Applicant details (array of strings for multi-row display)
GET <env>/api/retail/mas/applications/:applicationId/applicant-details
// data-api-config: { "operationId": "getMasApplicantDetails", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: string[]

// DVT section groups (shared with financial screen)
GET <env>/api/retail/mas/dvt/section-groups
// data-api-config: { "operationId": "getMasDvtSectionGroups", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: DvtSectionGroup[]   // open question — confirm op ID

// DVT medical report data
GET <env>/api/retail/mas/applications/:applicationId/dvt/medical?personType={personType}
// data-api-config: { "operationId": "getMasDvtMedicalReport", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: DvtMedicalReport

// Submit medical report decision
POST <env>/api/retail/mas/applications/:applicationId/dvt/medical/submit
// data-api-config: { "operationId": "submitMasDvtMedicalReport", "envs": { "dev": "", "sit": "", "prod": "" } }
Body: { personType: string; decision: string; remarks?: string; }
```

#### Behaviour & interactions
- `applicationId` comes from `useSearchParams()`.
- Switching `personType` re-fetches the report for the selected person.
- `SearchBar` filters the section navigator by section name (client-side).
- "View Medical Documents" region is a **placeholder** — leave a clearly commented empty
  `<div data-region="view-documents-placeholder" />` for the independent merge.
- Submit calls `submitMasDvtMedicalReport`; show `CustomSnackbar` on success/error.

#### Accessibility notes
- `CustomRadioGroup`: `role="radiogroup"`, `aria-label="Select applicant type"`.
- `SearchBar`: `aria-label="Search medical section"`.
- `DvtSectionViewer` nav: `role="navigation"`, `aria-label="Medical sections"`.

---

### SCR-03 — DVT Financial Report

**Prototype:** [`dvt-nmr-view-financial.html`](../../design-reference/ui-prototypes/Retail/MAS/dvt-nmr-view-financial.html)
**Route:** `/retail/mas/:applicationId/view-financial`

#### Purpose
Read-only view of the DVT financial report for an applicant. Mirrors SCR-02 structure exactly —
same layout, same component set, different report type and API operation IDs.

#### Component tree
```
<MASFinancialReportPage>                  {/* apps/retail/src/modules/mas/MASFinancialReportPage.tsx */}
  <AppHeader                              {/* [shared] — 00-shared-layout.md §2 */}
    showBack={true}
    onBack={() => navigate(`/retail/mas/${applicationId}`)} />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    {/* Applicant details — API returns string[], displayed as multiple rows */}
    <div data-region="applicant-details">
      {applicantDetails.map(line => <Typography key={line}>{line}</Typography>)}
    </div>
    <div className="topbar">
      <CustomRadioGroup                   {/* [reuse] — @insurance-poc/ui */}
        name="applicant.personType"
        options={masPersonTypes}
        value={personType}
        onChange={setPersonType}
      />
      {/* "View Financial Documents" button — placeholder only; out of scope, independent development */}
      <div data-region="view-documents-placeholder" />
    </div>
    <SearchBar                            {/* [reuse] — @insurance-poc/ui */}
      value={searchQuery}
      onChange={setSearchQuery}
      onClear={() => setSearchQuery('')}
      placeholder="Search financial section..."
    />
    <DvtSectionViewer                     {/* [new] — apps/retail/src/modules/mas/ */}
      type="financial"
      applicationId={applicationId}
      personType={personType}
      searchQuery={searchQuery}
      onSubmit={handleSubmit}
    />
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <CustomButton                       {/* [reuse] — @insurance-poc/ui */}
        variant="contained"
        onClick={handleSubmit}>
        Submit
      </CustomButton>
    </div>
  </main>
</MASFinancialReportPage>
```

#### Data / API
```ts
// Applicant details — same operation as SCR-02
GET <env>/api/retail/mas/applications/:applicationId/applicant-details
// data-api-config: { "operationId": "getMasApplicantDetails", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: string[]

// DVT section groups — same operation as SCR-02 (shared)
GET <env>/api/retail/mas/dvt/section-groups
// data-api-config: { "operationId": "getMasDvtSectionGroups", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: DvtSectionGroup[]   // open question — confirm op ID

// DVT financial report data
GET <env>/api/retail/mas/applications/:applicationId/dvt/financial?personType={personType}
// data-api-config: { "operationId": "getMasDvtFinancialReport", "envs": { "dev": "", "sit": "", "prod": "" } }
Response: DvtFinancialReport

// Submit financial report decision
POST <env>/api/retail/mas/applications/:applicationId/dvt/financial/submit
// data-api-config: { "operationId": "submitMasDvtFinancialReport", "envs": { "dev": "", "sit": "", "prod": "" } }
Body: { personType: string; decision: string; remarks?: string; }
```

#### Behaviour & interactions
- Identical to SCR-02 — switching `personType` re-fetches; `SearchBar` filters client-side.
- "View Financial Documents" region is a **placeholder** — `<div data-region="view-documents-placeholder" />`.
- Submit calls `submitMasDvtFinancialReport`; show `CustomSnackbar` on success/error.

#### Accessibility notes
- Same as SCR-02 — substitute "financial" for "medical" in `aria-label` values.

---

## New components to build

| Component | File | Shared between |
|---|---|---|
| `DvtSectionViewer` | `apps/retail/src/modules/mas/DvtSectionViewer.tsx` | SCR-02 and SCR-03 |
| `MASAuditTrailPage` | `apps/retail/src/modules/mas/MASAuditTrailPage.tsx` | SCR-01 |
| `MASMedicalReportPage` | `apps/retail/src/modules/mas/MASMedicalReportPage.tsx` | SCR-02 |
| `MASFinancialReportPage` | `apps/retail/src/modules/mas/MASFinancialReportPage.tsx` | SCR-03 |

---

## API config pattern

All API operation IDs follow this placeholder shape (set during annotation, fill env URLs at config stage):

```ts
// data-api-config attribute shape
{
  "operationId": "<opId>",
  "envs": { "dev": "", "sit": "", "prod": "" }
}
```

Services must read the correct base URL from an environment config (e.g. `import.meta.env.VITE_API_BASE`)
rather than hardcoding. Mock services use the `wait(ms)` pattern from `docs/spec/02-folder-structure.md §3`.

---

## Open questions

| # | Screen | Decision | Remaining action |
|---|---|---|---|
| OQ-1 | All | `data-api-config` env URLs filled at config stage via `import.meta.env.VITE_API_BASE` | None — handled at config stage |
| OQ-2 | SCR-02, SCR-03 | `getMasDvtSectionGroups` kept as BFF placeholder | Tag with actual operation ID when available |
| OQ-3 | Landing / DRS | **Do not build** — blocked on bundle owners providing tab labels, column definitions, field list, and decision options | Blocked on bundle owners |
| OQ-4 | SCR-02, SCR-03 | `<div data-region="view-documents-placeholder" />` in built screens; no spec detail now | Blocked on independent team merge |
| OQ-5 | SCR-01 | `<div data-region="pool-filter-placeholder" />` in built screen; no spec detail now | Blocked on independent team merge |
| OQ-6 | DRS — MAS Task (shell) | Built as header + empty `<main>` only at `/retail/mas/drs?applicationNo=…`, opened from Inbox `MAS_TASK` → Open. Does not follow the `/retail/mas/:applicationId` route in the routing table (spec rule: `applicationNo` comes from `useSearchParams()`). | Confirm final route shape |
| OQ-7 | AppHeader | `dvt-mr-view-medical.html` and `dvt-nmr-view-financial.html` contain header **CSS only**; the header markup is not in either file. `AppHeader` was built from the financial prototype's CSS (the medical file states its chrome is "aligned with the Financial prototype") plus `00-shared-layout.md §2`. Unconfirmed: back-button glyph (uses `KeyLeftArrowIcon`; prototype CSS suggests a text glyph at 26px), session block text (currently date + time from `Intl.DateTimeFormat("en-IN")`), profile menu items (only "Logout" supplied by `MasDrsPage`), logo asset (`ICICI_Logo.svg` — no `<img>` source in prototype). | Provide header markup or confirm these |
| OQ-8 | DRS — MAS Task | `AppHeader` `showBack` target is Inbox (`/inbox`); spec text says `/retail/mas`. Applicant banner, tabs, and decision footer are not built (OQ-3). | Confirm back target |

---

Status: Approved
