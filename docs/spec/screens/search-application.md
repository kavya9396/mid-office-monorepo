# Search Application Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/search-application/search-application/`

---

## Overview

The Search Application is a **read-only** cross-workstream search portal. It allows
authorised users (supervisors, auditors, compliance officers) to search for any
application across the system and view all underwriting artefacts in a non-editable
mode. No decisions or mutations are possible from this portal.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/search` | Landing / Search Inbox |
| `/search/login` | Login |
| `/search/:applicationId` | Application Search Result — DRS (read-only) |
| `/search/:applicationId/audit-trail` | Audit Trail (read-only) |
| `/search/:applicationId/previous-policy` | Previous Policy (read-only) |
| `/search/:applicationId/risk-details` | Risk Details (read-only) |
| `/search/:applicationId/open-tasks` | Open Tasks (read-only) |
| `/search/:applicationId/view-medical` | Medical Report (read-only) |
| `/search/:applicationId/view-financial` | Financial Report (read-only) |
| `/search/:applicationId/tpa-drs` | TPA DRS (read-only) |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `SEARCH_USER`.

---

### Landing / Search Inbox
**Prototype:** `landing-prototype.html`, `index.html`

#### Purpose
Full-text search across all applications. Results are shown in a paginated table.
No task assignment or action is available from this view.

#### Component tree
```
<SearchLandingPage>
  <AppHeader showBack={false} />
  <main>
    <SearchBar
      placeholder="Search by Application No, Name, Policy No..."
      onSearch={handleSearch}
    />
    <SearchResultsTable
      columns={[
        'Application No','Name','Product','Status',
        'Submitted Date','Business Line','Workstream'
      ]}
      rows={results}
      onRowClick={navigateToDetail}
      readOnly
    />
    <Pagination total={total} page={page} onChange={setPage} />
  </main>
</SearchLandingPage>
```

#### Data / API
```ts
GET /api/search/applications?q={query}&page={page}&limit={limit}
Response: {
  results: SearchResult[];
  total: number;
  page: number;
}
```

---

### DRS — Read-Only
**Prototype:** `cuw-drs-read-only.html`

Identical layout to the CUW DRS but with **all interactive controls disabled**.

#### Read-only rules
- All inputs, selects, and textareas: `disabled` or `readOnly`.
- `DecisionFooter` is **not rendered**.
- A read-only badge is shown in the header: `"View Only"`.
- Tab navigation remains functional for browsing.

#### Component tree
```
<SearchDRSPage applicationId={...} readOnly>
  <AppHeader showBack onBack={navigate('/search')} readOnlyBadge />
  <main>
    <ApplicantBanner {...} readOnly />
    <TabNav tabs={allTabs} />
    {/* All panels rendered in read-only mode */}
  </main>
  {/* No DecisionFooter */}
</SearchDRSPage>
```

---

### Audit Trail (Read-Only)
**Prototype:** `audit-trail-read-only.html`
Standard `AuditTimeline` with no action buttons.

---

### Previous Policy (Read-Only)
**Prototype:** `previous-policy-read-only.html`
Standard policy history table. Read-only.

---

### Risk Details (Read-Only)
**Prototype:** `risk-details-read-only.html`
Standard risk details view. Read-only.

---

### Open Tasks (Read-Only)
**Prototype:** `open-tasks-read-only.html`
Open tasks table. No action buttons in rows.

---

### Medical Report (Read-Only)
**Prototype:** `cuw-mr-view-medical-read-only.html`
Standard medical report view. Read-only.

---

### Financial Report (Read-Only)
**Prototype:** `cuw-nmr-view-financial-read-only.html`
Standard financial report view. Read-only.

---

### TPA DRS (Read-Only)
**Prototype:** `tpa-drs-prototype.html`

TPA (Third Party Administrator) DRS view. Read-only portal for TPA partners
to view application status and outcomes.

#### Component tree
```
<TPADRSPage applicationId={...} readOnly>
  <AppHeader showBack onBack={navigate('/search')} readOnlyBadge />
  <main>
    <ApplicantBanner {...} readOnly />
    <TabNav tabs={['TPA Summary','Medical Reports','Decision History']} />
    {/* TPA-specific panels */}
  </main>
</TPADRSPage>
```

---

## Read-Only Implementation Pattern

Use a `readOnly` prop at the page level. Pass it down to all form, table, and
banner components. Do not conditionally import or load decision-making logic
in read-only pages.

```tsx
// Shared pattern
function DRSPage({ applicationId, readOnly = false }: DRSPageProps) {
  return (
    <>
      <AppHeader readOnlyBadge={readOnly} />
      <ApplicantBanner readOnly={readOnly} />
      {/* panels */}
      {!readOnly && <DecisionFooter ... />}
    </>
  );
}
```

---

## Shared Rules (Search Application)

- Routes require role `SEARCH_USER` (cross-business-line role; not scoped to GROUP or RETAIL).
- No mutations are permitted from any search route — POST/PUT/DELETE calls must be blocked at
  the API layer; the frontend must not render any mutation controls.
- PII fields are visible but must not be copyable or exportable from the UI (no download,
  no copy-to-clipboard for sensitive fields).
- Reuse shared `AppHeader`, `ApplicantBanner`, `DataTable`, `AuditTimeline` in read-only mode.
