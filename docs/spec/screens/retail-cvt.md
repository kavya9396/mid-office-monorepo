# Retail — Credit Verification Team (CVT) Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/CVT/`

---

## Overview

CVT handles financial and income verification for retail proposals.
The workstream has a focused two-screen flow: a landing inbox and a DRS verification screen.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/cvt` | Landing / Inbox |
| `/retail/cvt/:applicationId` | DRS Verification Screen |
| `/retail/cvt/:applicationId/audit-trail` | Audit Trail |

---

## Screens

### Landing / Inbox
**Prototype:** `landing-prototype.html`

Same layout as CUW Landing. Task sections are CVT-specific (income verification queue).

#### Data / API
```ts
GET /api/retail/cvt/tasks
Response: { sections: TaskSection[]; tasks: Task[]; totalCount: number; }
```

---

### DRS — CVT Verification Screen
**Prototype:** `cvt-drs-prototype.html`

#### Purpose
Displays income and financial documents for verification. Allows CVT officer to
accept, query, or reject documents and record a verification outcome.

#### Component tree
```
<CVTDRSPage applicationId={...}>
  <AppHeader showBack onBack={navigate('/retail/cvt')} />
  <main>
    <ApplicantBanner {...applicantData} />
    <TabNav tabs={['Documents','Income Details','Verification History']} />
    <TabPanel tab="Documents">
      <DocumentList documents={[...]} onAction={...} />
    </TabPanel>
    <TabPanel tab="Income Details">
      <IncomeDetailsGrid {...} />
    </TabPanel>
    <TabPanel tab="Verification History">
      <VerificationHistoryTable entries={[...]} />
    </TabPanel>
    <DecisionFooter
      actions={['Accept','Query','Reject']}
      onDecision={submitVerification}
    />
  </main>
</CVTDRSPage>
```

#### Source images
Logo at `source-images/ICICI Logo.svg` — use the shared logo component.

#### Data / API
```ts
GET  /api/retail/cvt/applications/:applicationId
POST /api/retail/cvt/applications/:applicationId/verification
Body: { outcome: 'ACCEPT' | 'QUERY' | 'REJECT'; remarks: string; }
```

---

### Audit Trail
**Prototype:** `audit-trail.html`
Same `AuditTimeline` component as CUW. Endpoint: `/api/retail/cvt/applications/:applicationId/audit`.

---

## Shared Rules (CVT)

- Routes require `businessLine === 'RETAIL'` and role `CVT_USER`.
- Reuse shared `AppHeader`, `ApplicantBanner`, `DataTable`, `DecisionFooter`.
