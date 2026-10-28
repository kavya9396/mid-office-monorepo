# Group — DVT Informal Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Group/DVT Informal/`

---

## Overview

Group DVT Informal covers the Doctor Visit Team workflow for **Group Insurance**
in the informal (non-standard underwriting) channel. Screens allow DVT coordinators
to review group medical data, manage open tasks, and review previous policies.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/group/dvt-informal` | Landing |
| `/group/dvt-informal/login` | Login |
| `/group/dvt-informal/:schemeId` | DVT DRS |
| `/group/dvt-informal/:schemeId/open-tasks` | Open Tasks |
| `/group/dvt-informal/:schemeId/previous-policy` | Previous Policy |
| `/group/dvt-informal/:schemeId/audit-trail` | Audit Trail |
| `/group/dvt-informal/:schemeId/view-medical` | View Medical |
| `/group/dvt-informal/:schemeId/view-financial` | View Financial |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `GROUP_DVT_INFORMAL_USER`.

---

### Landing
**Prototype:** `landing.html`, `index.html`

Group-specific inbox. Task sections reflect group scheme queue.

#### Data / API
```ts
GET /api/group/dvt-informal/tasks
Response: { sections: TaskSection[]; tasks: GroupTask[]; totalCount: number; }
```

---

### DVT DRS
**Prototype:** `dvt-drs.html`

#### Purpose
DVT coordinator reviews group scheme medical data, views doctor reports,
and records the DVT outcome.

#### Key difference from Retail DRS
- Entity is a **Group Scheme** (schemeId), not an individual applicant.
- Banner shows scheme name, employer, member count, and sum assured range.
- Medical data covers bulk member records, not a single applicant.

#### Component tree
```
<GroupDVTDRSPage schemeId={...}>
  <AppHeader showBack onBack={navigate('/group/dvt-informal')} />
  <main>
    <SchemeBanner scheme={scheme} />
    <TabNav tabs={['Scheme Summary','Medical Reports','DVT Status','Documents']} />
    <TabPanel tab="Scheme Summary">
      <SchemeSummaryGrid scheme={scheme} />
    </TabPanel>
    <TabPanel tab="Medical Reports">
      <GroupMedicalReportList reports={medicalReports} />
    </TabPanel>
    <TabPanel tab="DVT Status">
      <DVTStatusTracker status={dvtStatus} history={dvtHistory} />
    </TabPanel>
    <TabPanel tab="Documents">
      <DocumentList documents={documents} />
    </TabPanel>
    <DecisionFooter
      actions={['Submit DVT Report','Request Retest','Escalate']}
      onDecision={submitDVTOutcome}
    />
  </main>
</GroupDVTDRSPage>
```

#### Data / API
```ts
GET  /api/group/dvt-informal/schemes/:schemeId
POST /api/group/dvt-informal/schemes/:schemeId/dvt-outcome
Body: { outcome: 'SUBMIT' | 'RETEST' | 'ESCALATE'; remarks: string; }
```

---

### Open Tasks
**Prototype:** `open-tasks.html`
Same `DataTable` pattern as Retail. Column set is group-specific.

---

### Previous Policy
**Prototype:** `previous-policy.html`
Shows previous group schemes held by the employer/proposer.

---

### Audit Trail
**Prototype:** `audit-trail.html`
Standard `AuditTimeline`.

---

### View Medical / View Financial
**Prototypes:** `view-medical.html`, `view-financial.html`
Read-only group medical and financial report views.

---

## Shared Rules (Group DVT Informal)

- All routes require `businessLine === 'GROUP'` and role `GROUP_DVT_INFORMAL_USER`.
- Use `SchemeBanner` instead of `ApplicantBanner` — group entity is a scheme, not an individual.
- Reuse shared `AppHeader`, `Sidebar`, `DataTable`, `AuditTimeline`, `DecisionFooter`.
