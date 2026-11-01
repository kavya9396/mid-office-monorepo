# Retail — Referral Screens Spec

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/Ref Screens/`

---

## Overview

Referral Screens are specialist review interfaces used when a CUW underwriter
refers a case to a specialist role. Each role has its own DRS variant.

| Role | Abbrev | Prototype |
|---|---|---|
| Head of Department | HOD | `hod-drs-prototype.html` |
| Head Office CMO (Chief Medical Officer) | HO-CMO | `ho-cmo-drs-prototype.html` |
| HO-CMO Referral Decision | HO-CMO-REF | `ho-cmo-drs-referral.html` |
| Referring CMO | REF-CMO | `ref-cmo-drs-prototype.html` |
| Senior Underwriter | SR-UW | `sr-uw-drs-prototype.html` |
| Vendor CMO | VENDOR-CMO | `vendor-cmo-drs-prototype.html` |
| Vendor CMO TMT | VENDOR-CMO-TMT | `vendor_cmo_tmt.html` |
| Inbox | — | `inbox-prototype.html` |

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/referral` | Inbox |
| `/retail/referral/:referralId/hod` | HOD DRS |
| `/retail/referral/:referralId/ho-cmo` | HO-CMO DRS |
| `/retail/referral/:referralId/ho-cmo/referral` | HO-CMO Referral Decision |
| `/retail/referral/:referralId/ref-cmo` | REF-CMO DRS |
| `/retail/referral/:referralId/sr-uw` | SR-UW DRS |
| `/retail/referral/:referralId/vendor-cmo` | Vendor CMO DRS |
| `/retail/referral/:referralId/vendor-cmo/tmt` | Vendor CMO TMT |
| `/retail/referral/:referralId/audit-trail` | Audit Trail |
| `/retail/referral/:referralId/view-medical` | DVT Medical Report |
| `/retail/referral/:referralId/view-financial` | DVT Financial Report |

---

## Shared Referral DRS Pattern

All referral DRS screens share the same structure. Only the decision actions and
specialist-specific data panels differ.

```tsx
<ReferralDRSPage referralId={...} role={ReferralRole}>
  <AppHeader showBack onBack={navigate('/retail/referral')} />
  <main>
    <ApplicantBanner {...} />
    <TabNav tabs={roleSpecificTabs(role)} />
    {/* Role-specific panels */}
    <DecisionFooter
      actions={roleDecisionActions(role)}
      onDecision={submitReferralDecision}
    />
  </main>
</ReferralDRSPage>
```

### Role-specific tabs

| Role | Tabs |
|---|---|
| HOD | Risk Summary, UW History, HOD Decision |
| HO-CMO | Medical Summary, CMO Opinion, Referral Chain |
| HO-CMO Referral | Referral Details, CMO Decision |
| REF-CMO | Medical Summary, CMO Opinion |
| SR-UW | Risk Summary, UW Analysis, Decision |
| Vendor CMO | Medical Examination, Vendor Report, Decision |
| Vendor CMO TMT | TMT Data, Stress Test Results, Decision |

### Role-specific decision actions

| Role | Actions |
|---|---|
| HOD | Approve, Decline, Refer Back |
| HO-CMO | Accept, Query, Defer |
| HO-CMO Referral | Approve Referral, Reject Referral |
| REF-CMO | Accept, Query, Refer to HO-CMO |
| SR-UW | Approve, Decline, Refer |
| Vendor CMO | Submit Report, Request Retest |
| Vendor CMO TMT | Submit TMT Report |

---

## Screens

### Inbox
**Prototype:** `inbox-prototype.html`

Standard inbox showing all referral tasks assigned to the logged-in specialist.
Tasks are grouped by referral type (HOD, CMO, SR-UW, Vendor).

#### Data / API
```ts
GET /api/retail/referral/tasks?role={role}
Response: { sections: TaskSection[]; tasks: ReferralTask[]; totalCount: number; }
```

---

### HOD DRS
**Prototype:** `hod-drs-prototype.html`
Role: `HOD_UNDERWRITER`.

---

### HO-CMO DRS
**Prototype:** `ho-cmo-drs-prototype.html`
Role: `HO_CMO`.

---

### HO-CMO Referral Decision
**Prototype:** `ho-cmo-drs-referral.html`
Role: `HO_CMO`. A sub-screen within the HO-CMO flow for recording the referral decision.

---

### REF-CMO DRS
**Prototype:** `ref-cmo-drs-prototype.html`
Role: `REF_CMO`.

---

### SR-UW DRS
**Prototype:** `sr-uw-drs-prototype.html`
Role: `SR_UNDERWRITER`.

---

### Vendor CMO DRS
**Prototype:** `vendor-cmo-drs-prototype.html`
Role: `VENDOR_CMO`.

---

### Vendor CMO TMT
**Prototype:** `vendor_cmo_tmt.html`
Role: `VENDOR_CMO`. Specific to Treadmill Test (TMT) reporting.

---

### DVT Medical Report
**Prototype:** `dvt-mr-view-medical.html`
Shared read-only view. Reuse `MedicalReportView` component.

### DVT Financial Report
**Prototype:** `dvt-nmr-view-financial.html`
Shared read-only view. Reuse `FinancialReportView` component.

### Audit Trail
**Prototype:** `audit-trail.html`
Standard `AuditTimeline`. API: `/api/retail/referral/referrals/:referralId/audit`.

---

## Assets
Logo at `assets/ICICI Logo.svg` — use the shared logo component.

---

## Shared Rules (Ref Screens)

- Route access is determined by the user's assigned specialist role from auth context.
- All routes under `/retail/referral/` require `businessLine === 'RETAIL'`.
- Use a single `ReferralDRSPage` component with a `role` prop — do not create separate
  page components per role.
- API data shapes differ per role; use discriminated union types for role-specific data.
