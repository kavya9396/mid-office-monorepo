# Retail — Chief Underwriter (CUW) Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/CUW/`

---

## Overview

The CUW workstream is the core underwriting decision screen for Retail Insurance.
An underwriter reviews an applicant's risk summary, medical and financial data,
navigates referral tasks, inspects previous policies, and records a final decision.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/cuw` | Inbox / Landing |
| `/retail/cuw/login` | Login |
| `/retail/cuw/:applicationId` | DRS (Decision-Ready Screen) |
| `/retail/cuw/:applicationId/open-tasks` | Open Tasks |
| `/retail/cuw/:applicationId/member-selection` | Member Selection |
| `/retail/cuw/:applicationId/risk-details` | Risk Details |
| `/retail/cuw/:applicationId/previous-policy` | Previous Policy |
| `/retail/cuw/:applicationId/audit-trail` | Audit Trail |
| `/retail/cuw/:applicationId/view-medical` | View Medical Report |
| `/retail/cuw/:applicationId/view-financial` | View Financial Report |

---

## Screens

### Login

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/login.html`

#### Purpose
Authenticated entry point for CUW users.

#### Component tree
```
<LoginPage>
  <AppHeader showBack={false} />
  <LoginForm>
    <Input name="username" label="Username" />
    <Input name="password" label="Password" type="password" />
    <Button type="submit">Sign In</Button>
  </LoginForm>
</LoginPage>
```

#### Behaviour
- On success redirect to `/retail/cuw`.
- Show inline error on failed credentials.
- ICICI branding: gradient header, `Login-Image.svg` background illustration.

---

### Inbox / Landing

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/landing-prototype.html`, `index.html`

#### Purpose
Displays all underwriting tasks assigned to the logged-in CUW user, grouped by role and status.

#### Component tree
```
<LandingPage>
  <AppHeader showBack={false} userName={...} />
  <div className="inbox">
    <Sidebar sections={taskSections} activeTaskId={...} onTaskSelect={navigate} />
    <main>
      <DynamicRoleTable
        title="CUW Tasks"
        columns={[...]}
        rows={tasks}
        toolbar={<TaskToolbar filters={...} />}
        pagination={<Pagination />}
      />
    </main>
  </div>
</LandingPage>
```

#### Data / API
```ts
GET /api/retail/cuw/tasks
Response: {
  sections: TaskSection[];
  tasks: Task[];
  totalCount: number;
}
```

#### Behaviour
- Sidebar collapses to 60 px on toggle; state persisted in `sessionStorage`.
- Clicking a task row navigates to `/retail/cuw/:applicationId`.
- Table supports column sort and text search via toolbar.

---

### DRS — Decision-Ready Screen

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/drs-screen-prototype.html`

#### Purpose
Main underwriting workspace. Displays applicant summary, risk grid, AI recommendation,
section tabs (Medical, Financial, Proposal, Documents), and decision controls.

#### Component tree
```
<DRSPage applicationId={...}>
  <AppHeader showBack onBack={navigate('/retail/cuw')} />
  <main>
    <ApplicantBanner {...applicantData} />
    <TabNav tabs={['Summary','Medical','Financial','Proposal','Documents','Audit']} />
    <TabPanel tab="Summary">
      <RiskPanel grid={riskItems} />
      <AIRecommendationPanel recommendation={...} />
    </TabPanel>
    <TabPanel tab="Medical">
      <MedicalReportView {...} />
    </TabPanel>
    <TabPanel tab="Financial">
      <FinancialReportView {...} />
    </TabPanel>
    {/* ... other panels */}
    <DecisionFooter
      actions={['Approve','Decline','Refer','Postpone']}
      onDecision={submitDecision}
    />
  </main>
</DRSPage>
```

#### Data / API
```ts
GET /api/retail/cuw/applications/:applicationId
Response: ApplicationDetail

POST /api/retail/cuw/applications/:applicationId/decision
Body: { action: DecisionAction; remarks: string; }
```

#### Design tokens (DRS-specific)
| Element | Value |
|---|---|
| Page background | `#fff8f3` |
| Banner background | `#ffead7` |
| Risk panel border | `#ded8d5` |
| Risk panel shadow | `0 2px 7px rgba(60,42,35,.07)` |
| Tab active underline | `2px solid #e45f14` |

#### Behaviour
- Back button returns to Landing.
- Applicant banner is sticky within `<main>`.
- Top-row layout: `grid-template-columns: minmax(0, 3fr) minmax(245px, 1fr)`.
- Decision footer is sticky at bottom of main.
- On decision submit: show confirmation modal, then redirect to Landing.

---

### Open Tasks

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/open-tasks.html`

#### Purpose
Lists all open service calls linked to this application, enabling the underwriter to action each item.

#### Component tree
```
<OpenTasksPage applicationId={...}>
  <AppHeader showBack onBack={navigate(`/retail/cuw/${applicationId}`)} />
  <main>
    <DataTable
      title="Open Tasks"
      countLabel={`${count} Open`}
      columns={[
        'Call log date','Service call ID','CT','ST',
        'Call Details','User Pool','Source'
      ]}
      rows={tasks}
      pagination
    />
  </main>
</OpenTasksPage>
```

#### Column widths (from prototype)
`15% | 14% | 8% | 8% | 30% | 15% | 10%`

#### Data / API
```ts
GET /api/retail/cuw/applications/:applicationId/open-tasks
Response: { tasks: OpenTask[]; total: number; }
```

---

### Member Selection

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/MemberSelection.html`

#### Purpose
Selects the life assured / proposer member when an application has multiple lives.

#### Behaviour
- Radio-group or clickable card list of family members.
- On selection navigates to DRS for that member.

---

### Risk Details

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/risk-details.html`

#### Purpose
Detailed breakdown of underwriting risk factors, scoring, and loaded premium.

#### Design tokens (Risk Details specific)
```css
--orange: #E45F14;
--border: #E3E3E3;
--text: #263238;
--muted: #68717A;
--bg: #F4F5F6;
--surface: #FFFFFF;
--success: #2F7D32;
--shadow: 0 5px 18px rgba(0,0,0,.06);
```

#### Component tree
```
<RiskDetailsPage>
  <AppHeader showBack />
  <main>
    <RiskScoreCard score={...} />
    <RiskFactorTable factors={[...]} />
    <LoadingTable loadings={[...]} />
  </main>
</RiskDetailsPage>
```

---

### Previous Policy

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/previous-policy.html`

#### Purpose
Shows historical policies held by the applicant for cross-reference.

#### Component tree
```
<PreviousPolicyPage>
  <AppHeader showBack />
  <main>
    <PolicyHistoryTable policies={[...]} />
  </main>
</PreviousPolicyPage>
```

---

### Audit Trail

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/audit-trail.html`

#### Purpose
Read-only chronological log of all actions taken on the application.

#### Component tree
```
<AuditTrailPage>
  <AppHeader showBack />
  <main>
    <AuditTimeline entries={[...]} />
  </main>
</AuditTrailPage>
```

---

### View Medical Report

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/cuw-mr-view-medical.html`

#### Purpose
Full-page view of the medical underwriting report for this application.

---

### View Financial Report

#### Prototype file
`design-reference/ui-prototypes/Retail/CUW/cuw-nmr-view-financial.html`

#### Purpose
Full-page view of the non-medical financial report for this application.

---

## Shared Rules (CUW)

- All pages use the shared `AppHeader` with the gradient defined in `00-shared-layout.md`.
- Font: `Mulish, Arial, sans-serif` at `12px` base.
- Focus ring: `2px solid #e45f14` on all interactive elements.
- Business-line guard: all routes under `/retail/cuw/` require `businessLine === 'RETAIL'` and
  role `CUW_USER` from the auth context before rendering. Redirect to `/unauthorized` otherwise.
