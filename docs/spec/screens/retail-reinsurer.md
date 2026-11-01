# Retail — Reinsurer Screen Spec

> Part of the [Screen Specifications](./README.md).
> Source prototype: `design-reference/ui-prototypes/Retail/reinsurer-screen-prototype.html`

---

## Overview

The Reinsurer Screen provides a reinsurance partner portal view for reviewing
retail life insurance applications that have been referred for reinsurance consideration.
The reinsurer reviews the risk, makes an acceptance or declination decision, and
records terms.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/reinsurer` | Reinsurer Inbox |
| `/retail/reinsurer/:applicationId` | Reinsurer Review Screen |

---

## Screens

### Reinsurer Inbox
Entry point for reinsurance tasks. Standard inbox layout.

#### Data / API
```ts
GET /api/retail/reinsurer/tasks
Response: { sections: TaskSection[]; tasks: ReinsurerTask[]; totalCount: number; }
```

---

### Reinsurer Review Screen
**Prototype:** `reinsurer-screen-prototype.html`

#### Purpose
Reinsurer reviews the full application risk profile and records reinsurance decision and terms.

#### Component tree
```
<ReinsurerReviewPage applicationId={...}>
  <AppHeader showBack onBack={navigate('/retail/reinsurer')} />
  <main>
    <ApplicantBanner {...} />
    <TabNav tabs={['Risk Profile','Reinsurance Details','Decision']} />
    <TabPanel tab="Risk Profile">
      <RiskPanel grid={riskItems} />
    </TabPanel>
    <TabPanel tab="Reinsurance Details">
      <ReinsurerTermsForm terms={currentTerms} />
    </TabPanel>
    <TabPanel tab="Decision">
      <ReinsurerDecisionForm />
    </TabPanel>
    <DecisionFooter
      actions={['Accept','Decline','Counter-offer']}
      onDecision={submitReinsurerDecision}
    />
  </main>
</ReinsurerReviewPage>
```

#### Data / API
```ts
GET  /api/retail/reinsurer/applications/:applicationId
POST /api/retail/reinsurer/applications/:applicationId/decision
Body: {
  decision: 'ACCEPT' | 'DECLINE' | 'COUNTER';
  terms?: ReinsurerTerms;
  remarks: string;
}
```

---

## Shared Rules (Reinsurer)

- Routes require `businessLine === 'RETAIL'` and role `REINSURER_PARTNER`.
- Reuse shared `AppHeader`, `ApplicantBanner`, `DecisionFooter`.
- Reinsurer data may contain commercially sensitive terms — do not log or cache
  reinsurer-specific API responses in browser storage.
