# retail-mmt-grievance-drs — section map
Prototype: Retail/MMT Grievance/mmt-grievance-prototype.html (minified bundle, 280 lines; no readable HTML structure — sections located by component name / character offset)
Screen root: not yet annotated (annotation not possible: minified-bundle)
Spec file: docs/spec/screens/retail-mmt-grievance.md (new section "DRS — MMT Grievance Screen")
App target: apps/retail
Reference screen: retail-pivv-drs (apps/retail/src/modules/pivv/PivvDrsPage.tsx)

| # | Section id | Title (as in prototype) | Lines (start-end) | Tag | Annotate | Spec | Build | Check | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | header | App header with back button (`aria-label="Back to Inbox"`) | n/a (bundle) @~1824100 (`b5`) | [shared] | n/a | done | done | pending | `MmtGrievanceDrsPage.tsx` mirrors the `PivvDrsPage` shell (`AppHeader` + `CustomBox`). Route `/mmt-grievance/drs?applicationNo=…` (MMT-OQ-1 resolved); inbox `MMT_TASK` (NB0000021) added to `mock/inbox/inbox.json`. Typecheck passes. |
| 2 | banner | Applicant banner: name, App No. pill, personal summary, Product / Policy Term / Premium Term / SA line, "Riders: … View details ›" | n/a (bundle) @~1775700 (`i5`) | [shared] | blocked: minified-bundle | done | done | pending | Reused `ApplicantBanner` as is (confirmed by user). Riders rendered as a plain text line; no `View details` button (MMT-OQ-3). Data: `mmtGrievanceService.fetchMmtGrievanceDrs` + `mock/drs/mmt-grievance-drs.json` (NB0000021). Typecheck passes. |
| 3 | rider-dialog | "Rider Details" dialog (2-column cards: Sum assured / Premium / Policy term / Premium term) | n/a (bundle) @~1782960 | [new] | n/a | n/a | n/a | n/a | Not required — user confirmed rider dialog is not needed. MMT-OQ-3 closed. |
| 4 | grievance-history | "Grievance History" table + pagination | n/a (bundle) @~1781837 (`F8` usage) | [shared] (new common component, like `ApplicantBanner`) | blocked: minified-bundle | done | done | pending | Per user: the prototype's "Decision History" accordion wrapper is removed; Grievance History is a common component reused by other screens. Prototype data is empty. Built as `GrievanceHistory` (`@insurance-poc/common/grievance-history`) + new `CustomPagination` + existing `usePagination`; empty list, disabled pager. Typecheck passes (retail, ui); verified in browser. |
| 5 | grievance-decision | "TPA Grievance Details" table (9 columns, TPA Remark input) + pagination + Submit | n/a (bundle) @~1782228 | [new] | blocked: minified-bundle | done | done | pending | Built as `MmtGrievanceDecision.tsx` (CustomTable + CustomTextField with no sx override + CustomPagination + CustomButton). Typecheck passes; verified in browser (empty Submit -> error, typing clears it, no network call). Per user: this is the Grievance Decision grid. Rows come from `fetchGrievanceDecision` (mock by default; real API construct TBD - env `VITE_MMT_GRIEVANCE_DECISION_URL`). Submit only validates (empty remark → error); no API call in prototype; user will build the submit API later (MMT-OQ-6). |

Decisions from the user (build-like-v1 run 1):
- Drop the `Decision History` accordion header; do not build it.
- `Grievance History` is a common component (apps/common) reused across screens.
- `TPA Grievance Details` is the Grievance Decision grid.
