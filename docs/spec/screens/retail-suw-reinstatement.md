# Retail — SUW Reinstatement Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/SUW/Reinstatement/`

---

## Overview

SUW (Senior Underwriter) Reinstatement covers the underwriting review process for
policies that have lapsed and are being reinstated by the customer. The flow includes
a PDR (Policy Data Review) section unique to this workstream.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/suw-reinstatement` | Inbox / Landing |
| `/retail/suw-reinstatement/login` | Login |
| `/retail/suw-reinstatement/:applicationId` | DRS |
| `/retail/suw-reinstatement/:applicationId/open-tasks` | Open Tasks |
| `/retail/suw-reinstatement/:applicationId/member-selection` | Member Selection |
| `/retail/suw-reinstatement/:applicationId/risk-details` | Risk Details |
| `/retail/suw-reinstatement/:applicationId/pdr-section` | PDR Section *(unique)* |
| `/retail/suw-reinstatement/:applicationId/previous-policy` | Previous Policy |
| `/retail/suw-reinstatement/:applicationId/audit-trail` | Audit Trail |
| `/retail/suw-reinstatement/:applicationId/view-medical` | Medical Report |
| `/retail/suw-reinstatement/:applicationId/view-financial` | Financial Report |

---

## Screens

### Login
**Prototype:** `login.html` — standard login, role `SUW_REINSTATEMENT_USER`.

---

### Inbox / Landing
**Prototype:** `landing-prototype.html`, `index.html`
Standard inbox layout; task sections reflect reinstatement queue.

---

### DRS
**Prototype:** `drs-screen-prototype.html`
Standard DRS; decision actions: `Reinstate`, `Decline`, `Refer`, `Hold`.

---

### PDR Section *(Unique to SUW Reinstatement)*
**Prototype:** `pdr-section.html`

#### Purpose
Displays Policy Data Review — a structured comparison of the original policy data
against the reinstatement request. The underwriter verifies data consistency before
proceeding.

#### Component tree
```
<PDRSectionPage applicationId={...}>
  <AppHeader showBack />
  <main>
    <ApplicantBanner {...} />
    <PDRComparisonTable
      originalData={originalPolicy}
      reinstatedData={reinstatedRequest}
      discrepancies={[...]}
    />
    <RemarkField label="PDR Remarks" name="pdrRemarks" />
    <ActionBar>
      <Button variant="primary" onClick={confirmPDR}>Confirm PDR</Button>
      <Button variant="secondary" onClick={goBack}>Back</Button>
    </ActionBar>
  </main>
</PDRSectionPage>
```

#### Data / API
```ts
GET  /api/retail/suw-reinstatement/applications/:applicationId/pdr
POST /api/retail/suw-reinstatement/applications/:applicationId/pdr/confirm
Body: { remarks: string; }
```

---

### Open Tasks, Member Selection, Risk Details, Previous Policy, Audit Trail, Medical Report, Financial Report

Follow the same patterns as [`retail-cuw.md`](./retail-cuw.md) with:
- Role: `SUW_REINSTATEMENT_USER`
- API base: `/api/retail/suw-reinstatement/`

---

## Shared Rules (SUW Reinstatement)

- All routes require `businessLine === 'RETAIL'` and role `SUW_REINSTATEMENT_USER`.
- The PDR Section is exclusive to this workstream; do not expose it in other routes.
- Reuse all shared components from `src/shared/`.
