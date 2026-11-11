# Retail — Medical Appointment Scheduling (MAS) Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/MAS/`

---

## Overview

MAS handles the scheduling and tracking of medical examinations for life insurance proposals.
The workstream enables coordinators to schedule medical appointments, view DVT reports,
and track examination outcomes.

Note: The MAS DRS prototype (`mas-drs-prototype.html`) is a **bundled React build**
(MUI + React Router) embedded in a standalone HTML file. The spec below describes
the React implementation; do not import from the prototype bundle.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/mas` | Landing / Inbox |
| `/retail/mas/:applicationId` | DRS — MAS Task |
| `/retail/mas/:applicationId/audit-trail` | Audit Trail |
| `/retail/mas/:applicationId/view-medical` | DVT Medical Report |
| `/retail/mas/:applicationId/view-financial` | DVT Financial Report |

---

## Screens

### Landing / Inbox
**Prototype:** `landing-prototype.html`

#### Purpose
Shows scheduled and pending medical appointment tasks.

#### Component tree
```
<MASLandingPage>
  <AppHeader showBack={false} />
  <div className="inbox">
    <Sidebar sections={masSections} />
    <main>
      <DynamicRoleTable title="MAS Tasks" columns={masColumns} rows={tasks} />
    </main>
  </div>
</MASLandingPage>
```

#### Data / API
```ts
GET /api/retail/mas/tasks
```

---

### DRS — MAS Task
**Prototype:** `mas-drs-prototype.html`

#### Purpose
Coordinator reviews application details and schedules or confirms the medical appointment.
Shows applicant data, selected medical vendor, appointment slot, and status tracking.

#### Component tree
```
<MASDRSPage applicationId={...}>
  <AppHeader showBack onBack={navigate('/retail/mas')} />
  <main>
    <ApplicantBanner {...} />
    <TabNav tabs={['Appointment Details','Medical Vendor','Scheduling History']} />
    <TabPanel tab="Appointment Details">
      <AppointmentDetailsForm
        appointment={currentAppointment}
        onReschedule={handleReschedule}
      />
    </TabPanel>
    <TabPanel tab="Medical Vendor">
      <VendorInfoCard vendor={assignedVendor} />
    </TabPanel>
    <TabPanel tab="Scheduling History">
      <SchedulingHistoryTable entries={history} />
    </TabPanel>
    <DecisionFooter
      actions={['Confirm Appointment','Reschedule','Cancel']}
      onDecision={submitDecision}
    />
  </main>
</MASDRSPage>
```

#### Data / API
```ts
GET  /api/retail/mas/applications/:applicationId
POST /api/retail/mas/applications/:applicationId/appointment
Body: {
  action: 'CONFIRM' | 'RESCHEDULE' | 'CANCEL';
  appointmentDate?: string; // ISO 8601
  vendorCode?: string;
  remarks: string;
}
```

#### Assets
Logo at `assets/ICICI Logo.svg` — use the shared logo component.

---

### Audit Trail
**Prototype:** `audit-trail.html`
Standard `AuditTimeline` component. API: `/api/retail/mas/applications/:applicationId/audit`.

---

### DVT Medical Report
**Prototype:** `dvt-mr-view-medical.html`
Read-only view of the DVT (Doctor Visit Team) medical examination report.

---

### DVT Financial Report
**Prototype:** `dvt-nmr-view-financial.html`
Read-only view of the DVT financial report.

---

## Shared Rules (MAS)

- Routes require `businessLine === 'RETAIL'` and role `MAS_COORDINATOR`.
- Reuse shared `AppHeader`, `Sidebar`, `ApplicantBanner`, `AuditTimeline`.
- The MAS DRS is a **new implementation** — do not copy or import from the bundled prototype.
