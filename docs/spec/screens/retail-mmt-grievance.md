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

---

## DRS — MMT Grievance Task (build-like-v1 from `retail-pivv-drs`)

Prototype `mmt-grievance-prototype.html` is a minified bundle; structure taken from components `b5` (header), `i5` (banner), `a5` (page), `K8` (accordion) and `F8` (table). Section map: [`retail-mmt-grievance-drs.sections.md`](./retail-mmt-grievance-drs.sections.md).
Prototype entry: inbox key `MMT_TASK` (landing prototype), application `NB0000021`, in-memory route `/retail/app/NB0000021/grievance`.

### Section: header

#### Purpose
Sticky app header with back button ("Back to Inbox") above the scrollable `<main>`; same shell as PIVV.

#### Prototype file
`mmt-grievance-prototype.html` — component `b5` @~1824100 (back button `aria-label="Back to Inbox"`, ICICI logo 150px, session block, profile menu). `<main>` style: `backgroundColor #FFF8F3; minHeight calc(100dvh - 57px); padding 0 4px 12px`.

#### Component reuse (confirmed by user)

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| Header | `AppHeader` | [shared] | `@insurance-poc/common/app-header` | Reused as in PIVV DRS; `showBack`, `userName`, Logout menu item |
| Page shell | `CustomBox` (outer 100vh flex column, `main` with `calc(100dvh - 57px)` scroll) | [shared] | `@insurance-poc/ui` | Same as `PivvDrsPage`; bg `#fff8f3` |
| Composition | `MmtGrievanceDrsPage` | [new] | `apps/retail/src/modules/mmt-grievance` | Page wiring only; mirrors `PivvDrsPage` (loading / missing-id / not-found states, `applicationNo` from `useSearchParams`) |

User rule for this screen: anything in `packages/ui` / `apps/common` that is *similar but deviates slightly* is **not** silently reused — ask for confirmation first (treat `[reuse-with-gap]` as `[new]` unless confirmed).

#### Differences from `retail-pivv-drs`
- None for the header itself. Quick Links is absent from this prototype.

#### Open questions
| ID | Section | Question |
|---|---|---|
| MMT-OQ-1 | header | RESOLVED by user: route `/mmt-grievance/drs?applicationNo=...` (retail base `/retail`), opened from inbox `MMT_TASK` - same pattern as PIVV `/pivv/drs`. |
| MMT-OQ-2 | header | Old spec mentions role `MMT_GRIEVANCE_OFFICER`; not enforced in the retail app (same as PIVV-OQ-5). |

### Section: banner

#### Purpose
Applicant banner above the page content: avatar block, name, `App No.` pill, and three text lines (personal summary, product line, riders line).

#### Prototype file
`mmt-grievance-prototype.html` - component `i5` @~1775700 (screenshot provided). Same markup family as the PIVV/MAS banner.

#### Component reuse (confirmed by user)

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| Avatar, name, `App No. - OB90377122` pill | `ApplicantBanner` | [shared] | `@insurance-poc/common/applicant-banner` | Reused unchanged |
| Line 1 - personal summary | `ApplicantBanner` `lines[0]` | [shared] | same | Pre-composed string: `38 years / Male / Graduate / ₹50,00,000 p.a. / mumbai - maharashtra - 400064 / India / IND` |
| Line 2 - product (bold) | `ApplicantBanner` `lines[1]` (`emphasis`) | [shared] | same | `Product: … / Policy Term: 8 / Premium Term: 10 / SA - ₹10,68,000` |
| Line 3 - riders | `ApplicantBanner` `lines[2]` (plain text) | [shared] | same | Riders rendered as one plain-text line; the prototype's bold `Riders:` label and `View details ›` button are not rendered (rider dialog not required — MMT-OQ-3 closed) |
| Data | `fetchMmtGrievanceDrs` + `mock/drs/mmt-grievance-drs.json` | [new] | `apps/retail/src/services/mmtGrievanceService.ts` | Services wrap mock JSON with `wait(ms)`; returns `null` when not found |

#### Differences from `retail-pivv-drs`
- Three lines instead of PIVV's three (summary, bold product, TSA/TRSA string): third line is the riders list.

#### Open questions
| ID | Section | Question |
|---|---|---|
| MMT-OQ-3 | banner | CLOSED — rider dialog is not required. `View details ›` button and "Rider Details" dialog are not built. |
| MMT-OQ-4 | banner | Prototype derives the banner from store data and hard-codes `App No. - OB90377122`; mock mirrors the screenshot (NB0000021 only). |

### Section: grievance-history

#### Purpose
Common "Grievance History" table with a pager, shown below the banner. Reusable across screens (like `ApplicantBanner`). The prototype's "Decision History" accordion wrapper is dropped (user decision).

#### Prototype file
`mmt-grievance-prototype.html` - table `F8` (usage @~1781837), columns `X8`, data `J8` (empty), pager `Uq`, page size `Y8` = 5.

#### Component reuse (confirmed by user: all gaps treated as [new])

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| "Grievance History" bar + 9 columns + "No data available" | `CustomTable` | [shared] | `@insurance-poc/ui` | Widths: User Name 11%, FUP Code 8%, Profile 10%, Grievance Remarks 17%, TPA Remark 17%, Raised Date 9%, Updated Date 9%, Raised by 10%, Updated By 9% |
| Pager `‹ 1 ›` (rounded, small, disabled, selected white on #E45F14) | `CustomPagination` | [new] | `packages/ui/src/Pagination/Pagination.tsx` | MUI `Pagination` wrapper; `onChange(page)` receives the page number |
| Page slicing, page count | `usePagination` | [reuse] | `apps/common/src/components/Requirement Mgmt/usePagination.ts` | Used as is (relative import inside `apps/common`) |
| Composition | `GrievanceHistory` | [new] | `apps/common/src/components/GrievanceHistory.tsx`, export `@insurance-poc/common/grievance-history` | Props: `rows`, `pageSize` (5), `paginationDisabled` (true) |
| Data | `fetchGrievanceHistory(applicationNo)` | [new] | `apps/retail/src/services/mmtGrievanceService.ts`, `mock/drs/mmt-grievance-rows.json` (`records[].history`) | Empty list, as in the prototype. Mock by default; real mode via env vars (see "API construct" below) |

#### Differences from `retail-pivv-drs`
- PIVV has no history table. This section is new; table and pager follow `CustomTable` / `CustomPagination` styles, so row text size and pager size (`CustomPagination` default small) differ slightly from the prototype's inline MUI styles.
- Rendered outside the sticky banner wrapper, directly below it.

#### Open questions
| ID | Section | Question |
|---|---|---|
| MMT-OQ-5 | grievance-history | Prototype history data is an empty list and the pager is permanently disabled (`paginationDisabled=true`). Real API construct (URL, method, params, response shape, mapping) is TBD - user will supply it; only `callGrievanceApi` / `toGrievanceRows` in the service change. When to enable paging is unknown. |

### Section: grievance-decision

#### Purpose
Grievance Decision grid ("TPA Grievance Details"): the TPA enters a remark per grievance row, then presses Submit.

#### Prototype file
`mmt-grievance-prototype.html` - table `F8` with columns `X8`, data `q8` (one row), TPA Remark input (`C6`), pager `Uq` (disabled), `Submit` button (`T8`), handler `v`.

#### Component reuse (confirmed by user)

| Region | Component | Tag | Source | Fidelity note |
|---|---|---|---|---|
| "TPA Grievance Details" bar + 9 columns | `CustomTable` + `grievanceColumns` | [shared] | `@insurance-poc/ui`, `@insurance-poc/common/grievance-history` | Same columns/widths as Grievance History |
| TPA Remark input | `CustomTextField` | [shared] | `@insurance-poc/ui` | **No `sx` override (user choice):** 40px / 12px instead of the prototype's 32px / 10px. Placeholder `Enter TPA remark *`, `required`, error state after Submit |
| Pager `‹ 1 ›` | `CustomPagination` | [shared] | `@insurance-poc/ui` | Always disabled, as in the prototype |
| Page slicing | `usePagination` | [reuse] | `@insurance-poc/common/use-pagination` (new subpath export of the existing hook) | Page size 5 |
| Submit button | `CustomButton` | [shared] | `@insurance-poc/ui` | `sx` from prototype: min width 175, min height 32, radius 18px, bg `#B3262E` (hover `#941F26`), 12px bold |
| Composition | `MmtGrievanceDecision` | [new] | `apps/retail/src/modules/mmt-grievance/MmtGrievanceDecision.tsx` | Local state only |
| Data | `fetchGrievanceDecision(applicationNo)` | [new] | `apps/retail/src/services/mmtGrievanceService.ts`, `mock/drs/mmt-grievance-rows.json` (`records[].decision`) | One row: Premanand Sawant / ECG / Life Assured / "ECG graph is blurry" / 7 Sep 2026. Mock by default; real mode via env vars (see "API construct" below) |

#### API construct (history and decision rows)
- `fetchMmtGrievanceDrs` loads the banner from `mock/drs/mmt-grievance-drs.json`, then calls `fetchGrievanceHistory` and `fetchGrievanceDecision` in parallel.
- Switch: `useMock = import.meta.env.VITE_USE_MOCK !== "false"` - mock is the default; set `VITE_USE_MOCK=false` for real mode.
- Real mode env vars (typed in `apps/retail/src/vite-env.d.ts`): `VITE_MMT_GRIEVANCE_HISTORY_URL`, `VITE_MMT_GRIEVANCE_DECISION_URL`. Request is a placeholder GET with `?applicationNo=`; it throws if the URL is unset.
- The page shows an error alert if either call fails.

#### Behaviour
- Submit sets a `submitted` flag; any empty TPA Remark then shows the error state. Typing clears it.
- **No API call.** The prototype handler only validates (`v=()=>{d(!0),c.some(e=>!e.trim())}`). The submit API will be built later (user decision: "keep it as is").

#### Differences from `retail-pivv-drs`
- PIVV has a single-row decision table, a dropdown, a multiline remark and a confirm dialog. MMT has a per-row text input, a disabled pager and no confirm dialog.
- Submit is maroon like PIVV's but wider (175px) and has no dialog.

#### Open questions
| ID | Section | Question |
|---|---|---|
| MMT-OQ-6 | grievance-decision | Submit API (endpoint, payload, success/failure UI) is not defined. User will build it later; Submit currently validates only. |
| MMT-OQ-7 | grievance-decision | Source of the TPA grievance rows is hard-coded in the prototype (`q8`); mock mirrors it. Real API construct (URL, method, params, response shape, mapping) is TBD - user will supply it. |

Status: Draft