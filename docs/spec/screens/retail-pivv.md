# Retail — PIVV Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/PIVV/`

---

## Overview

PIVV (Pre-Issuance Video Verification) handles the video-based identity verification
step before policy issuance. The workstream has a landing page and a DRS verification screen.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/pivv` | Landing / Inbox |
| `/retail/pivv/:applicationId` | DRS — PIVV Verification |

---

## Screens

### Landing / Inbox
**Prototype:** `landing-prototype.html`

Standard inbox layout. Task table shows pending video verification queue.

#### Data / API
```ts
GET /api/retail/pivv/tasks
Response: { sections: TaskSection[]; tasks: Task[]; totalCount: number; }
```

---

### DRS — PIVV Verification Screen
**Prototype:** `pivv-drs-prototype.html`

#### Purpose
PIVV officer reviews the recorded video verification session, checks identity
document matches, and records an outcome (Pass / Fail / Incomplete).

#### Component tree
```
<PIVVDRSPage applicationId={...}>
  <AppHeader showBack onBack={navigate('/retail/pivv')} />
  <main>
    <ApplicantBanner {...} />
    <TabNav tabs={['Video Session','Identity Documents','Verification Checklist']} />
    <TabPanel tab="Video Session">
      <VideoSessionViewer sessionUrl={sessionUrl} sessionMeta={meta} />
    </TabPanel>
    <TabPanel tab="Identity Documents">
      <DocumentComparisonGrid submitted={submitted} captured={captured} />
    </TabPanel>
    <TabPanel tab="Verification Checklist">
      <ChecklistForm items={checklistItems} onChange={updateChecklist} />
    </TabPanel>
    <DecisionFooter
      actions={['Pass','Fail','Incomplete']}
      onDecision={submitVerification}
    />
  </main>
</PIVVDRSPage>
```

#### Data / API
```ts
GET  /api/retail/pivv/applications/:applicationId
POST /api/retail/pivv/applications/:applicationId/outcome
Body: {
  outcome: 'PASS' | 'FAIL' | 'INCOMPLETE';
  checklistResults: ChecklistResult[];
  remarks: string;
}
```

#### Assets
Logo at `source-images/ICICI Logo.svg` — use the shared logo component.

---

## Shared Rules (PIVV)

- Routes require `businessLine === 'RETAIL'` and role `PIVV_OFFICER`.
- Video session URL is served via a signed URL from the API — do not store it client-side.
- Reuse shared `AppHeader`, `Sidebar`, `ApplicantBanner`, `DecisionFooter`.
