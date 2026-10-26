# Retail — Claim Audit Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/Claim Audit/`

---

## Overview

Claim Audit covers the post-claim underwriting audit workflow. Auditors review
claim decisions, inspect medical and financial evidence, and record audit outcomes.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/claim-audit` | Landing / Inbox |
| `/retail/claim-audit/login` | Login |
| `/retail/claim-audit/:claimId` | Claim Audit Task Screen |
| `/retail/claim-audit/:claimId/open-tasks` | Open Tasks |
| `/retail/claim-audit/:claimId/risk-details` | Risk Details |
| `/retail/claim-audit/:claimId/previous-policy` | Previous Policy |
| `/retail/claim-audit/:claimId/audit-trail` | Audit Trail |
| `/retail/claim-audit/:claimId/view-medical` | DVT Medical Report |
| `/retail/claim-audit/:claimId/view-financial` | DVT Financial Report |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `CLAIM_AUDITOR`.

---

### Landing / Inbox
**Prototype:** `landing-prototype.html`
Standard inbox. Task sections reflect claim audit queue (pending review, reviewed, escalated).

#### Data / API
```ts
GET /api/retail/claim-audit/tasks
Response: { sections: TaskSection[]; tasks: ClaimAuditTask[]; totalCount: number; }
```

---

### Claim Audit Task Screen
**Prototype:** `cuw-claim-audit-task-prototype.html`

#### Purpose
Auditor reviews the original underwriting decision against the claim evidence to
determine whether the decision was accurate and compliant.

#### Component tree
```
<ClaimAuditTaskPage claimId={...}>
  <AppHeader showBack onBack={navigate('/retail/claim-audit')} />
  <main>
    <ApplicantBanner {...} />
    <TabNav tabs={['Claim Details','UW Decision Review','Medical Evidence','Financial Evidence','Audit Checklist']} />
    <TabPanel tab="Claim Details">
      <ClaimMetaGrid claim={claim} />
    </TabPanel>
    <TabPanel tab="UW Decision Review">
      <UWDecisionReviewPanel originalDecision={originalDecision} />
    </TabPanel>
    <TabPanel tab="Medical Evidence">
      <MedicalReportView {...} />
    </TabPanel>
    <TabPanel tab="Financial Evidence">
      <FinancialReportView {...} />
    </TabPanel>
    <TabPanel tab="Audit Checklist">
      <AuditChecklistForm items={checklistItems} onChange={updateChecklist} />
    </TabPanel>
    <DecisionFooter
      actions={['Audit Pass','Audit Fail','Refer for Review']}
      onDecision={submitAuditOutcome}
    />
  </main>
</ClaimAuditTaskPage>
```

#### Data / API
```ts
GET  /api/retail/claim-audit/claims/:claimId
POST /api/retail/claim-audit/claims/:claimId/audit-outcome
Body: {
  outcome: 'PASS' | 'FAIL' | 'REFER';
  checklistResults: AuditChecklistResult[];
  remarks: string;
}
```

---

### Open Tasks, Risk Details, Previous Policy, Audit Trail, Medical Report, Financial Report

Follow the CUW screen patterns from [`retail-cuw.md`](./retail-cuw.md).

- API base: `/api/retail/claim-audit/`
- Role: `CLAIM_AUDITOR`
- DVT report variants: `dvt-mr-view-medical.html`, `dvt-nmr-view-financial.html`

---

## Shared Rules (Claim Audit)

- Routes require `businessLine === 'RETAIL'` and role `CLAIM_AUDITOR`.
- Reuse all shared components from `src/shared/`.
- Audit outcomes are immutable once submitted — do not offer edit or re-submit UI.
