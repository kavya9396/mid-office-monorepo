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

---

## DRS — PIVV Task (build-like-v1 from `retail-mas-drs`)

Prototype `pivv-drs-prototype.html` is a minified bundle; structure taken from components `zbe` (page), `Lbe` (banner), `Rbe` (PIVV Details) and `Pbe` (decision options), plus a user screenshot.
Route: `/retail/pivv/drs?applicationNo=…` (opened from Inbox `PIVV_TASK` → Open).

### Component reuse (confirmed by user)

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| Header | `AppHeader` | [shared] | `@insurance-poc/common/app-header` | Reused as in MAS DRS |
| Applicant banner | `ApplicantBanner` | [shared] | `@insurance-poc/common/applicant-banner` | Reused; lines are pre-composed strings |
| PIVV Details table | `CustomTable` (title "PIVV Details") | [shared] | `@insurance-poc/ui` → `packages/ui/src/Table/Table.tsx` | Columns via `Column<PivvRow>`; decision / remark cells use `render` |
| PIVV Decision dropdown | `CustomSelect` | [shared] | `@insurance-poc/ui` → `packages/ui/src/Select/Select.tsx` | `options` from `Pbe`; placeholder "Select PIVV decision" |
| PIVV Remark input | `CustomTextField` (multiline) | [shared] | `@insurance-poc/ui` → `packages/ui/src/TextField/TextField.tsx` | Placeholder "Enter PIVV remark" |
| Submit, Confirm Submit dialog | `CustomButton`, `CustomDialog` | [shared] | `@insurance-poc/ui` | Maroon `sx` overrides from prototype |
| Composition of the above | `PivvDecisionForm` | [new] | `apps/retail/src/modules/pivv` | PIVV-specific wiring only; no bare MUI table/select/dialog imports (layout via `CustomBox`, `CustomTypography`) |

> **Rule:** every component used here must come from `packages/ui/src` (via `@insurance-poc/ui`). See the note at the top of `@insurance-poc/ui` in `docs/spec/02-folder-structure.md` §2.

### Differences from `retail-mas-drs`

- Decision region is a 6-column table (FUP Code, Profile, Raised Date, Raised Remark, PIVV Decision select, PIVV Remark multiline) under an orange "PIVV Details" bar — not a field grid.
- PIVV Decision options (17) from prototype `Pbe`; placeholders "Select PIVV decision" / "Enter PIVV remark".
- Submit and dialog identical to MAS (local state only).
- Table, select and text field come from `packages/ui/src`, so their look follows `CustomTable` / `CustomSelect` styles (header weight, row borders, 40px select height, no 760px min-width scroll) rather than the prototype's inline MUI styles.

### Open questions

| ID | Section | Question |
|---|---|---|
| PIVV-OQ-1 | pivv-details | Prototype hard-codes FUP Code `PIV`, Profile `Life Assured`, Raised Date `9 Sep 2026`; real source (`requirementManagement` PIV row) is unconfirmed. Mock data used. |
| PIVV-OQ-2 | pivv-details | Prototype posts decision via `drs/completeTask` in a different component (`$pe`, "PIVV Pool Decision"); the `zbe` dialog Submit only closes. Built as local state, no submit call. |
| PIVV-OQ-3 | banner | Prototype hard-codes `App No. - OB90377122` and the TSA/TRSA parameters string; mock mirrors screenshot (PIVV1001 only). |
| PIVV-OQ-4 | header | Quick Links (`PIVV_TASK:['quickLinks']`) not built. |
| PIVV-OQ-5 | shell | Spec rules mention role `PIVV_OFFICER` and route `/retail/pivv/:applicationId`; built to `applicationNo` query-param pattern like MAS. |

Status: Draft

