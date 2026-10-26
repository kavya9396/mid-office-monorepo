# Retail — Pre-Issuance Chief Underwriter (Pre-Issuance CUW) Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/Pre issuance CUW/`

---

## Overview

Pre-Issuance CUW covers underwriting review that occurs **before** policy issuance.
The screen set mirrors the post-issuance CUW flow but operates on pre-issuance
application data and has additional variant screens for NMR (Non-Medical Review)
and MR (Medical Review) decisions.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/pre-issuance-cuw` | Inbox / Landing |
| `/retail/pre-issuance-cuw/login` | Login |
| `/retail/pre-issuance-cuw/:applicationId` | DRS |
| `/retail/pre-issuance-cuw/:applicationId/open-tasks` | Open Tasks |
| `/retail/pre-issuance-cuw/:applicationId/member-selection` | Member Selection |
| `/retail/pre-issuance-cuw/:applicationId/risk-details` | Risk Details |
| `/retail/pre-issuance-cuw/:applicationId/previous-policy` | Previous Policy |
| `/retail/pre-issuance-cuw/:applicationId/audit-trail` | Audit Trail |
| `/retail/pre-issuance-cuw/:applicationId/view-medical` | Medical Report View |
| `/retail/pre-issuance-cuw/:applicationId/view-medical-alt` | Medical Report View (alt) |
| `/retail/pre-issuance-cuw/:applicationId/view-financial` | Financial Report View |
| `/retail/pre-issuance-cuw/:applicationId/view-financial-alt` | Financial Report View (alt) |

---

## Screens

### Login
**Prototype:** `login.html`
Same structure as CUW login. Route guard: role `PRE_ISSUANCE_CUW_USER`.

---

### Inbox / Landing
**Prototype:** `landing-prototype.html`, `index.html`

Identical layout to CUW Landing. Task table columns and section groupings reflect
pre-issuance workflow stages.

#### Data / API
```ts
GET /api/retail/pre-issuance-cuw/tasks
Response: { sections: TaskSection[]; tasks: Task[]; totalCount: number; }
```

---

### DRS — Decision-Ready Screen
**Prototype:** `drs-screen-prototype.html`

Same component structure as CUW DRS. Decision actions differ:
- `Approve (Pre-Issuance)`, `Refer`, `Decline`, `Hold`.

#### Data / API
```ts
GET  /api/retail/pre-issuance-cuw/applications/:applicationId
POST /api/retail/pre-issuance-cuw/applications/:applicationId/decision
```

---

### Member Selection
**Prototype:** `MemberSelection.html`
Same as CUW Member Selection; navigates within `/retail/pre-issuance-cuw/:applicationId`.

---

### Open Tasks
**Prototype:** `open-tasks.html`
Same table structure as CUW Open Tasks.

```ts
GET /api/retail/pre-issuance-cuw/applications/:applicationId/open-tasks
```

---

### Risk Details
**Prototype:** `risk-details.html`
Same as CUW Risk Details. Pre-issuance may add a "Pre-issuance Flag" column.

---

### Previous Policy
**Prototype:** `previous-policy.html`
Same as CUW Previous Policy.

---

### Audit Trail
**Prototype:** `audit-trail.html`
Same as CUW Audit Trail.

---

### Medical Report View (Standard + Alternate)
**Prototypes:** `cuw-mr-view-medical.html`, `cuw-mr-view-medical_.html`

The alternate variant (`_`) shows a slightly different layout for edge-case medical data.
Both render via the same `MedicalReportView` component; a `variant?: 'standard' | 'alternate'`
prop controls the layout difference.

---

### Financial Report View (Standard + Alternate)
**Prototypes:** `cuw-nmr-view-financial.html`, `cuw-nmr-view-financial_.html`

Same pattern as Medical Report variants.

---

## Shared Rules (Pre-Issuance CUW)

- All routes require `businessLine === 'RETAIL'` and role `PRE_ISSUANCE_CUW_USER`.
- Reuse `AppHeader`, `Sidebar`, `ApplicantBanner`, `DataTable`, `AuditTimeline`
  from `src/shared/`.
- Do not duplicate CUW components; extend via props where the only difference is
  API endpoint or decision action labels.
