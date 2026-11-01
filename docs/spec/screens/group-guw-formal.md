# Group — GUW Formal Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Group/GUW Formal/`

---

## Overview

Group Underwriting (GUW) Formal covers the full underwriting review for Group
Insurance in the formal channel. This is the primary group underwriting workspace,
with member selection, medical and financial review, risk details, and audit.
Two variants of some screens exist (denoted by `_` suffix in prototype files).

---

## URL & Routing

| Route | Screen |
|---|---|
| `/group/guw-formal` | Landing |
| `/group/guw-formal/login` | Login |
| `/group/guw-formal/:schemeId` | DRS — GUW Formal |
| `/group/guw-formal/:schemeId/member-selection` | Member Selection |
| `/group/guw-formal/:schemeId/open-tasks` | Open Tasks |
| `/group/guw-formal/:schemeId/risk-details` | Risk Details |
| `/group/guw-formal/:schemeId/previous-policy` | Previous Policy |
| `/group/guw-formal/:schemeId/audit-trail` | Audit Trail |
| `/group/guw-formal/:schemeId/view-medical` | Group Medical Report |
| `/group/guw-formal/:schemeId/view-medical-alt` | Group Medical Report (alt) |
| `/group/guw-formal/:schemeId/view-financial` | Group Financial Report |
| `/group/guw-formal/:schemeId/view-financial-alt` | Group Financial Report (alt) |
| `/group/guw-formal/:schemeId/dvt-view-medical` | DVT Medical Report |
| `/group/guw-formal/:schemeId/dvt-view-financial` | DVT Financial Report |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `GROUP_GUW_FORMAL_USER`.

---

### Landing
**Prototype:** `landing-prototype.html`, `index.html`
Group-specific inbox layout. Task sections reflect GUW Formal queue.

#### Data / API
```ts
GET /api/group/guw-formal/tasks
Response: { sections: TaskSection[]; tasks: GroupTask[]; totalCount: number; }
```

---

### DRS — GUW Formal
**Prototype:** `guw-drs-screen-prototype.html`

#### Purpose
Primary underwriting workspace for group schemes. Underwriter reviews scheme risk,
member medical and financial data, and records the underwriting decision.

#### Key differences from Retail DRS
- Entity is a **Group Scheme** with multiple member lives.
- Banner shows scheme/employer data via `SchemeBanner`.
- Tabs include a "Member Data" tab for bulk member records.

#### Component tree
```
<GUWFormalDRSPage schemeId={...}>
  <AppHeader showBack onBack={navigate('/group/guw-formal')} />
  <main>
    <SchemeBanner scheme={scheme} />
    <TabNav tabs={['Summary','Member Data','Medical','Financial','Risk Details','Documents','Audit']} />
    <TabPanel tab="Summary">
      <SchemeRiskPanel grid={riskItems} />
      <AIRecommendationPanel recommendation={recommendation} />
    </TabPanel>
    <TabPanel tab="Member Data">
      <MemberDataTable members={members} onMemberSelect={navigateToMember} />
    </TabPanel>
    {/* ... other panels */}
    <DecisionFooter
      actions={['Approve','Decline','Refer','Postpone','Counter-offer']}
      onDecision={submitDecision}
    />
  </main>
</GUWFormalDRSPage>
```

#### Data / API
```ts
GET  /api/group/guw-formal/schemes/:schemeId
POST /api/group/guw-formal/schemes/:schemeId/decision
Body: { action: GroupDecisionAction; terms?: GroupTerms; remarks: string; }
```

---

### Member Selection
**Prototype:** `MemberSelection.html`
Selects a specific member life within the group scheme for individual-level review.

---

### Open Tasks
**Prototype:** `open-tasks.html`
Standard `DataTable`. Group task columns include scheme reference and employer name.

---

### Risk Details
**Prototype:** `risk-details.html`
Group-level risk factor breakdown. Shows aggregate loading and group risk score.

---

### Previous Policy
**Prototype:** `previous-policy.html`
Previous group schemes for the same employer/proposer.

---

### Audit Trail
**Prototype:** `audit-trail.html`
Standard `AuditTimeline`.

---

### Medical Report Views (Standard + Alternate)
**Prototypes:** `guw-mr-view-medical.html`, `guw-mr-view-medical_.html`

Group-level medical report view. The alternate variant (`_`) handles edge-case layouts.
Use `variant?: 'standard' | 'alternate'` prop on `GroupMedicalReportView`.

---

### Financial Report Views (Standard + Alternate)
**Prototypes:** `guw-nmr-view-financial.html`, `guw-nmr-view-financial_.html`

Same alt-variant pattern as Medical Reports.

---

### DVT Medical Report
**Prototype:** `dvt-mr-view-medical.html`
Read-only DVT medical report within the GUW Formal context.

---

### DVT Financial Report
**Prototype:** `dvt-nmr-view-financial.html`
Read-only DVT financial report within the GUW Formal context.

---

## Shared Rules (GUW Formal)

- All routes require `businessLine === 'GROUP'` and role `GROUP_GUW_FORMAL_USER`.
- Use `SchemeBanner` — not `ApplicantBanner`.
- Alternate variants (`_`) use the same component with `variant='alternate'` prop;
  do not create separate page components.
- Reuse shared `AppHeader`, `Sidebar`, `DataTable`, `AuditTimeline`, `DecisionFooter`.
