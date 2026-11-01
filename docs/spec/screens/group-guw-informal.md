# Group — GUW Informal Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Group/GUW Informal/`

---

## Overview

GUW Informal covers Group Underwriting in the informal channel (non-standard,
typically SME or non-employer group schemes). The screen set mirrors GUW Formal
but applies to simplified underwriting rules and has a different role guard.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/group/guw-informal` | Landing |
| `/group/guw-informal/login` | Login |
| `/group/guw-informal/:schemeId` | DRS |
| `/group/guw-informal/:schemeId/member-selection` | Member Selection |
| `/group/guw-informal/:schemeId/open-tasks` | Open Tasks |
| `/group/guw-informal/:schemeId/risk-details` | Risk Details |
| `/group/guw-informal/:schemeId/previous-policy` | Previous Policy |
| `/group/guw-informal/:schemeId/audit-trail` | Audit Trail |
| `/group/guw-informal/:schemeId/view-medical` | Medical Report |
| `/group/guw-informal/:schemeId/view-medical-alt` | Medical Report (alt) |
| `/group/guw-informal/:schemeId/view-financial` | Financial Report |
| `/group/guw-informal/:schemeId/view-financial-alt` | Financial Report (alt) |
| `/group/guw-informal/:schemeId/dvt-view-medical` | DVT Medical |
| `/group/guw-informal/:schemeId/dvt-view-financial` | DVT Financial |

---

## Screens

All screen structures and component trees follow the GUW Formal spec
([`group-guw-formal.md`](./group-guw-formal.md)).

Differences from GUW Formal:

| Aspect | GUW Formal | GUW Informal |
|---|---|---|
| Role guard | `GROUP_GUW_FORMAL_USER` | `GROUP_GUW_INFORMAL_USER` |
| API base | `/api/group/guw-formal/` | `/api/group/guw-informal/` |
| Decision actions | Approve, Decline, Refer, Postpone, Counter-offer | Approve, Decline, Refer |
| Underwriting rules | Standard group rules | Simplified informal rules |

### Prototype file mapping

| Prototype | Screen |
|---|---|
| `login.html` | Login |
| `landing-prototype.html` / `index.html` | Landing / Inbox |
| `guw-drs-screen-prototype.html` | DRS |
| `MemberSelection.html` | Member Selection |
| `open-tasks.html` | Open Tasks |
| `risk-details.html` | Risk Details |
| `previous-policy.html` | Previous Policy |
| `audit-trail.html` | Audit Trail |
| `guw-mr-view-medical.html` | Medical Report |
| `guw-mr-view-medical_.html` | Medical Report (alternate) |
| `guw-nmr-view-financial.html` | Financial Report |
| `guw-nmr-view-financial_.html` | Financial Report (alternate) |
| `dvt-mr-view-medical.html` | DVT Medical Report |
| `dvt-nmr-view-financial.html` | DVT Financial Report |

---

## Shared Rules (GUW Informal)

- All routes require `businessLine === 'GROUP'` and role `GROUP_GUW_INFORMAL_USER`.
- Use `SchemeBanner` — not `ApplicantBanner`.
- Reuse all shared components from `src/shared/`.
- Implement GUW Informal as a distinct route module (`apps/group/src/modules/guw-informal/`)
  that reuses shared GUW components, not a copy of GUW Formal.
