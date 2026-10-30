# Screen Specifications

> Part of the [React Frontend Architecture & Engineering Specification](../README.md).

Screen specs translate the design-reference HTML prototypes into implementable React screen contracts.
Each spec defines the screen's purpose, URL, shared layout, component tree, data requirements, and
behaviour rules derived directly from the HTML prototypes.

## Contents

| File | Business Line | Workstream |
|---|---|---|
| [00-shared-layout.md](./00-shared-layout.md) | All | Shared layout, Header, Sidebar, design tokens |
| [shared-login.md](./shared-login.md) | All | Shared login screen (`apps/common`) — referenced by all workstreams |
| [retail-cuw.md](./retail-cuw.md) | Retail | Chief Underwriter (CUW) |
| [retail-pre-issuance-cuw.md](./retail-pre-issuance-cuw.md) | Retail | Pre-Issuance CUW |
| [retail-cvt.md](./retail-cvt.md) | Retail | Credit Verification Team (CVT) |
| [retail-pre-issuance-cvt.md](./retail-pre-issuance-cvt.md) | Retail | Pre-Issuance CVT |
| [retail-suw-reinstatement.md](./retail-suw-reinstatement.md) | Retail | SUW Reinstatement |
| [retail-mas.md](./retail-mas.md) | Retail | Medical Appointment Scheduling (MAS) |
| [retail-pivv.md](./retail-pivv.md) | Retail | PIVV |
| [retail-it-task.md](./retail-it-task.md) | Retail | IT Task |
| [retail-mmt-grievance.md](./retail-mmt-grievance.md) | Retail | MMT Grievance |
| [retail-claim-audit.md](./retail-claim-audit.md) | Retail | Claim Audit |
| [retail-ref-screens.md](./retail-ref-screens.md) | Retail | Referral Screens (HO-CMO, HOD, REF-CMO, SR-UW, Vendor-CMO) |
| [retail-reinsurer.md](./retail-reinsurer.md) | Retail | Reinsurer Screen |
| [group-dvt-informal.md](./group-dvt-informal.md) | Group | DVT Informal |
| [group-guw-formal.md](./group-guw-formal.md) | Group | GUW Formal |
| [group-guw-informal.md](./group-guw-informal.md) | Group | GUW Informal |
| [search-application.md](./search-application.md) | Cross | Read-only Search Application |

## Source prototypes location

All source HTML files live under `design-reference/ui-prototypes/` and are **never** imported into
the application build. See [`design-reference/README.md`](../../design-reference/README.md).

## Screen spec structure

Each spec follows this template:

```
## Overview
## URL & routing
## Layout
## Screens
  ### <ScreenName>
    #### Purpose
    #### Prototype file
    #### Component tree
    #### Data / API
    #### Behaviour & interactions
    #### Accessibility notes
```
