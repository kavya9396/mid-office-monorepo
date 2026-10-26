# Retail — Pre-Issuance CVT Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/Pre issuance CVT/`

---

## Overview

Pre-Issuance CVT mirrors the post-issuance CVT flow but applies to applications
before policy issuance. Includes additional Medical and Financial report views
and alternate layout variants.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/pre-issuance-cvt` | Inbox / Landing |
| `/retail/pre-issuance-cvt/login` | Login |
| `/retail/pre-issuance-cvt/:applicationId` | DRS |
| `/retail/pre-issuance-cvt/:applicationId/open-tasks` | Open Tasks |
| `/retail/pre-issuance-cvt/:applicationId/member-selection` | Member Selection |
| `/retail/pre-issuance-cvt/:applicationId/risk-details` | Risk Details |
| `/retail/pre-issuance-cvt/:applicationId/previous-policy` | Previous Policy |
| `/retail/pre-issuance-cvt/:applicationId/audit-trail` | Audit Trail |
| `/retail/pre-issuance-cvt/:applicationId/view-medical` | Medical Report |
| `/retail/pre-issuance-cvt/:applicationId/view-financial` | Financial Report |
| `/retail/pre-issuance-cvt/:applicationId/view-financial-alt` | Financial Report (alt) |

---

## Screens

All screen structures follow the same patterns as Pre-Issuance CUW.
Refer to [`retail-pre-issuance-cuw.md`](./retail-pre-issuance-cuw.md) for
component tree, data/API, and behaviour specs.

Differences from Pre-Issuance CUW:

| Aspect | Pre-Issuance CUW | Pre-Issuance CVT |
|---|---|---|
| Role guard | `PRE_ISSUANCE_CUW_USER` | `PRE_ISSUANCE_CVT_USER` |
| API base path | `/api/retail/pre-issuance-cuw/` | `/api/retail/pre-issuance-cvt/` |
| Decision actions | Approve, Refer, Decline, Hold | Accept, Query, Reject |
| Medical alt variant | Yes | No |
| Financial alt variant | No | Yes (`cuw-nmr-view-financial_.html`) |

### Prototype file mapping

| Prototype | Screen |
|---|---|
| `login.html` | Login |
| `landing-prototype.html` / `index.html` | Inbox / Landing |
| `drs-screen-prototype.html` | DRS |
| `MemberSelection.html` | Member Selection |
| `open-tasks.html` | Open Tasks |
| `risk-details.html` | Risk Details |
| `previous-policy.html` | Previous Policy |
| `audit-trail.html` | Audit Trail |
| `cuw-mr-view-medical.html` | Medical Report View |
| `cuw-nmr-view-financial.html` | Financial Report View |
| `cuw-nmr-view-financial_.html` | Financial Report View (alternate layout) |

---

## Shared Rules (Pre-Issuance CVT)

- All routes require `businessLine === 'RETAIL'` and role `PRE_ISSUANCE_CVT_USER`.
- Reuse all shared components from `src/shared/`.
