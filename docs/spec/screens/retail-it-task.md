# Retail — IT Task Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/IT Task/`

---

## Overview

The IT Task workstream manages internal IT-raised tasks linked to Retail underwriting
applications. Users review application metadata, make an **IT Decision** via an accordion
panel inside the existing DRS shell, and navigate back to the inbox.

The workstream has **two screens**: Landing/Inbox and IT Task Detail (DRS shell
with an IT Decision accordion). Login is handled by the shared platform login in
`apps/common` — see [`docs/spec/screens/shared-login.md`](./shared-login.md).

---

## URL & Routing

| Route | Screen | App |
|---|---|---|
| `/login` | Login (shared) | `apps/common` — see [`shared-login.md`](./shared-login.md) |
| `/retail/it-task` | Landing / Inbox | `apps/retail` |
| `/retail/it-task/:taskId` | IT Task Detail | `apps/retail` |

---

## Screens

> **Login** — uses the shared platform login at `/login` (`apps/common`).
> See [`docs/spec/screens/shared-login.md`](./shared-login.md) for the full spec.
> The IT Task prototype ships its own `login.html` for standalone demo purposes only;
> in production, all workstreams share the single `apps/common` login.
> Post-login the user is redirected to `/retail/it-task` via the standard inbox redirect.

---

### Screen 1 — Landing / Inbox

#### Purpose
Displays the open IT tasks assigned to the logged-in user. Uses the standard
Retail inbox shell with `Sidebar` + `DynamicRoleTable`. The task pool key is `IT_TASK`.

#### Prototype file
[`design-reference/ui-prototypes/Retail/IT Task/landing-prototype.html`](../../design-reference/ui-prototypes/Retail/IT%20Task/landing-prototype.html)

#### Layout
Standard Retail inbox layout — identical to CUW/CVT landing:
```
<AppHeader showBack={false} userName={...} />
<div className="inbox">                      {/* display:flex; min-height:calc(100dvh - 57px) */}
  <Sidebar ... />                            {/* width:220px collapsed:60px */}
  <main className="main-area">
    <DynamicRoleTable ... />
  </main>
</div>
```

#### Sidebar sections
| Section | Items |
|---|---|
| (hidden) User Handle | User Management, Leave Management |
| Search Application | — |
| All Cases | count badge |
| Task list | IT Task (pool key: `IT_TASK`) |
| (hidden) Admin Screens Utility | AMR Medical, AMR Non Medical, Acuity, Risk, IIFL, Reconsideration, Hold, Payment & ATS, Wait for Combo Policy, Post Issuance Doc Wait, Pre Issuance Doc Wait, SPC DE |
| (hidden) Bulk Upload | — |

Active item on load: `IT_TASK`.

#### Table — IT Task Details
Title: `"IT TASK Details"` (orange title bar, `background: #e45f14`).

**Toolbar** (per standard landing pattern):
- `Download Excel` button
- Priority legend: High / At Risk / Normal with counts
- Search toggle (icon button)
- Filter icon button
- Customize Columns icon button

**Columns** (first 9 visible, `applicationNo` always first):

| Column key | Display label |
|---|---|
| `applicationNo` | Application No |
| `appliedSa` | Applied SA |
| `annualPremium` | Annual Premium |
| `productType` | Product Type |
| `medical` | Medical |
| `drc` | DRC |
| `hniFlag` | HNI Flag |
| `channel` | Channel |
| `breDecision` | BRE Decision |

Additional available columns: `munichReMedicalDecision`, `ptlr`, `createdDateAndTime`.

**Row data shape** (from `poolData["IT_TASK"]`):

```ts
interface ITTaskRow {
  id: number;
  taskId: string;
  instanceId: string;
  applicationNo: string;   // e.g. "NB0000021"
  appliedSa: number;       // e.g. 1500000
  annualPremium: number;
  productType: string;     // e.g. "I19"
  medical: boolean;
  drc: string;             // "Low" | "Medium" | "High"
  hniFlag: string;         // "Yes" | "No"
  channel: string;         // "Agency" | "Banca"
  breDecision: string;     // "Refer" | "Review" | "STD"
  munichReMedicalDecision: string;
  ptlr: string;
  roleType: "IT_TASK";
  role: "RETAIL_IT_USER";
  businessType: "RETAIL";
  createdDateAndTime: string; // ISO-8601
}
```

**Timing / priority** (applies to all Retail inboxes):
- `due_date < now` → "high" priority (red, overdue icon on Application No cell).
- `at_risk_time < now` → "risk" priority (amber).
- Otherwise "normal".
- If any row is overdue, clicking a non-high-priority row shows the priority snackbar.

**Pagination**: `pageSize` selector (25 default), prev/next buttons, row count label.

**Column customizer dialog**: Available ↔ Selected transfer list, max 9 columns, `applicationNo` always locked first; up/down reorder.

**Filter dialog**: column list → checkbox value list; Apply / Clear.

**Break-time dialog** (profile menu → Breaktime):
| Field | Type | Options |
|---|---|---|
| Break Duration | select | 15, 30, 45, 60, 90, 120 (minutes) |
| Break Reason | select | Tea / Coffee Break, Lunch Break, Personal Work, Internal Meeting, System Issue |
| Confirm | button | — |

#### Behaviour & interactions
- Clicking `applicationNo` cell link navigates to `/retail/it-task/:taskId`.
- Profile menu: `Logout` → `/login` (shared Common login).
- Session countdown: 15 min; resets on mouse/key/scroll/touch.
- Date/time live-updates every second (IST, `en-GB` locale).
- Sidebar collapse toggle: `width` transitions `220px ↔ 60px` in 0.25 s; labels hidden in collapsed state.

#### Data / API
```ts
GET /api/retail/it-task/tasks
Response: ITTaskRow[]
```
Mock: `mock/inbox/inbox.json` filtered to `roleType === "IT_TASK"`.

#### Pattern
**Standard Retail Inbox** — same pattern as CUW and CVT landing screens.
Reuse `RetailInboxPage` structure; pass `poolKey="IT_TASK"` and task-specific column config.

#### Accessibility notes
- `<aside>` for sidebar with `aria-label="Task navigation"`.
- `<section>` with `aria-label` for main area.
- `role="status" aria-live="polite"` on priority snackbar.
- Table `<th>` elements carry `aria-sort` attributes for sorted column.
- Profile menu button: `aria-haspopup="true" aria-expanded={open}`.

---

### Screen 2 — IT Task Detail

#### Purpose
IT user views the DRS shell for an application linked to the IT task, then submits an
**IT Decision** via a collapsible accordion in the page footer area. The comment at the
top of the prototype explicitly states it "contains only the existing Header and IT Decision
accordion" — the rest of the DRS shell (applicant banner, tabs, sections) is the shared
Retail DRS component.

#### Prototype file
[`design-reference/ui-prototypes/Retail/IT Task/it-task-prototype.html`](../../design-reference/ui-prototypes/Retail/IT%20Task/it-task-prototype.html)

> **Note:** The prototype is a minified React bundle (not annotated HTML). It is confirmed
> to render: AppHeader (with Back to Inbox), the standard DRS shell, and an IT Decision
> `MuiAccordion` section. The applicant banner is hidden in the prototype
> (`body main > div:first-child { display: none !important }`).

#### Layout
DRS sticky layout (shared constraint from `docs/spec/screens/00-shared-layout.md`):

```
<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppHeader showBack onBack={() => navigate('/retail/it-task')}
             aria-label="Back to Inbox" />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto',
                 background: '#FFF8F3' }}>
    <ApplicantBanner task={task} />        {/* sticky top:0 z-index:20 */}
    {/* shared DRS tab sections */}
    <ITDecisionAccordion task={task}
                         onClose={() => navigate('/retail/it-task')} />
  </main>
</div>
```

#### IT Decision Accordion
Rendered as a `MuiAccordion` (maps to `CustomAccordion` from `@insurance-poc/ui`).
Title: **"IT Decision"**.

Contents (to be confirmed against full spec — see Open Questions):
- Summary / metadata read-only fields for the linked application.
- A remarks / decision text area.
- A **Close** button that navigates back to `/retail/it-task`.

Navigation:
- Header **Back button** (`aria-label="Back to Inbox"`) → `window.location.assign('/retail/it-task')`.
- IT Decision accordion **Close button** → same destination.

#### Data / API
```ts
GET  /api/retail/it-task/tasks/:taskId
Response: ITTaskDetail

POST /api/retail/it-task/tasks/:taskId/decision
Body: { decision: string; remarks: string; }
```
Mock: keyed entry in `mock/drs/retail-drs.json` by `applicationNo`.

#### Pattern
**DRS Detail Screen** — same pattern as CUW DRS (`RetailDrsPage`). The only
IT-Task-specific addition is the `ITDecisionAccordion` section replacing (or appending to)
the standard decision footer.

#### Accessibility notes
- Back button `aria-label="Back to Inbox"`.
- Accordion uses `aria-expanded` and keyboard-accessible toggle.
- Decision form fields must have associated `<label>` elements.

---

## Shared Rules (IT Task)

- Login is handled by `apps/common` at `/login` — **no workstream-specific login route**.
  See [`shared-login.md`](./shared-login.md).
- All IT Task routes require `businessType === "RETAIL"` and role `RETAIL_IT_USER`.
- Reuse `AppHeader`, `Sidebar`, `DynamicRoleTable`, `ApplicantBanner`, `CustomAccordion`
  from shared packages / `apps/common`.
- The applicant banner is hidden in the prototype demo only for visual clarity; it **must**
  be present in the implementation, as in all other Retail DRS screens.
- The IT Decision accordion is the only screen-specific component; it must be placed inside
  the `<main>` scroll area, not as a fixed footer.

---

## Open Questions

1. **IT Decision accordion fields**: The minified bundle does not expose the field list
   for the IT Decision section. What fields (text areas, dropdowns, radio buttons) does the
   IT Decision accordion contain beyond a remarks text area and Close button?

2. **POST action**: Is there a Submit / Save button inside the accordion in addition to
   Close, or does Close implicitly save?

3. **DRS tabs**: Which DRS tab sections (if any) appear for IT Task? Are they the same
   as CUW (Open Tasks, Member Selection, Risk Details, Previous Policy, Audit Trail,
   View Medical, View Financial) or a subset?

4. **ApplicantBanner fields**: Which application fields appear in the banner for IT Task
   (task ID, task type, priority, raised date vs. standard applicant fields)?

5. **Role guard**: Is the role `RETAIL_IT_USER` or `IT_TASK_USER` (both appear in the
   previous stub spec)?

---

Status: Draft
