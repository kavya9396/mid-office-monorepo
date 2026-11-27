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

---

## Implementation notes (Reinsurer task, Retail + Group)

- Inbox pool key / DRS `roleType`: `REINSURER_TASK` → `screenType: "REINSURER"` in
  `apps/retail/src/config/drsTaskConfig.ts` and `apps/group/src/config/drsTaskConfig.ts`.
  Opened through the existing `/app/{applicationNo}/drs` dispatcher (`RetailDrsPage` / `GroupDrsPage`).
- Shared UI in `apps/common/src/components/` (`@insurance-poc/common/reinsurer`):
  `ReinsurerPanel` (Reinsurer Details, Assign Documents, Remarks, actions, Back dialog) and
  `ReinsurerDrsScreen` (banner + load/not-found/error states + snackbar).
- Retail and Group each own `ReinsurerUser.tsx`, `services/reinsurerService.ts` and a mock in
  `mock/drs/{retail,group}-reinsurer-drs.json`. Only mock mode is wired.
- The Group back action is labelled "Back TO GUW" (prototype only defines "Back TO CUW").

## Open questions

1. Real endpoints, request/response bodies and the complete-task decision code for the Reinsurer task
   (the routes in this file predate the DRS dispatcher and are not used). Live mode currently throws.
2. Group wording: is "Back TO GUW" correct, and does the Group Reinsurer screen use the same fields?
3. Are "Reinsurer Decision" and "Reinsurer-UW Decision Match" options (`Standard / Non Standard /
   Decline / Postpone`, `Yes / No`) and the Back reasons static, or from masters?
4. Required-field rules for the Reinsurer Details inputs and for Save & close (prototype defines none).
5. "Referral Sheet" action: the prototype has no behaviour; the button is rendered without a handler.
6. Mock inbox rows use `role: RETAIL_REINSURER_USER` / `GROUP_REINSURER_USER` — confirm real role names.

