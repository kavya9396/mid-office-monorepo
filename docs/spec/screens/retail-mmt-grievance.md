# Retail — MMT Grievance Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/MMT Grievance/`

---

## Overview

MMT Grievance manages customer grievances raised during the underwriting process.
A dedicated grievance officer reviews, investigates, and resolves complaints linked
to retail insurance proposals.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/mmt-grievance` | Landing / Inbox |
| `/retail/mmt-grievance/login` | Login |
| `/retail/mmt-grievance/:grievanceId` | Grievance Detail Screen |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `MMT_GRIEVANCE_OFFICER`.

---

### Landing / Inbox
**Prototype:** `landing-prototype.html`

Standard inbox. Task table columns show grievance ID, category, status, and SLA breach indicators.

#### Data / API
```ts
GET /api/retail/mmt-grievance/tasks
Response: { sections: TaskSection[]; tasks: GrievanceTask[]; totalCount: number; }
```

---

### Grievance Detail Screen
**Prototype:** `mmt-grievance-prototype.html`

#### Purpose
Grievance officer reviews the full complaint, communicates with customer via
the platform, and records the resolution outcome.

#### Component tree
```
<GrievanceDetailPage grievanceId={...}>
  <AppHeader showBack onBack={navigate('/retail/mmt-grievance')} />
  <main>
    <GrievanceBanner grievance={grievance} />
    <TabNav tabs={['Grievance Details','Communication Log','Resolution']} />
    <TabPanel tab="Grievance Details">
      <GrievanceMetaGrid grievance={grievance} />
      <DocumentList documents={grievance.attachments} readOnly />
    </TabPanel>
    <TabPanel tab="Communication Log">
      <CommunicationTimeline entries={communications} />
    </TabPanel>
    <TabPanel tab="Resolution">
      <ResolutionForm
        categories={resolutionCategories}
        onSubmit={submitResolution}
      />
    </TabPanel>
    <DecisionFooter
      actions={['Resolve','Reject','Escalate']}
      onDecision={submitResolution}
    />
  </main>
</GrievanceDetailPage>
```

#### Data / API
```ts
GET  /api/retail/mmt-grievance/grievances/:grievanceId
POST /api/retail/mmt-grievance/grievances/:grievanceId/resolution
Body: {
  outcome: 'RESOLVE' | 'REJECT' | 'ESCALATE';
  category: string;
  remarks: string;
}
```

---

## Shared Rules (MMT Grievance)

- Routes require `businessLine === 'RETAIL'` and role `MMT_GRIEVANCE_OFFICER`.
- `GrievanceBanner` replaces `ApplicantBanner` — shows grievance ID, category, priority,
  and SLA deadline instead of applicant bio data.
- Reuse shared `AppHeader`, `Sidebar`, `AuditTimeline`, `DecisionFooter`.
