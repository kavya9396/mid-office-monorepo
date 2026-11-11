# retail-pivv-drs — section map
Prototype: Retail/PIVV/pivv-drs-prototype.html (minified bundle, 241 lines; no readable HTML structure — sections located by component name / character offset)
Screen root: not yet annotated (annotation not possible: minified-bundle)
Spec file: docs/spec/screens/retail-pivv.md (section "DRS — PIVV Verification Screen")
App target: apps/retail
Reference screen: retail-mas-drs (apps/retail/src/modules/mas/MasDrsPage.tsx)

| # | Section id | Title (as in prototype) | Lines (start-end) | Tag | Annotate | Spec | Build | Check | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | header | App header + `<main>` shell | n/a (bundle) | [shared] | n/a | done | done | pending | Reused `AppHeader` (`@insurance-poc/common/app-header`) unchanged. `PivvDrsPage.tsx` mirrors `MasDrsPage` shell. Quick Links (`PIVV_TASK:['quickLinks']`) out of scope, as in MAS. Typecheck passes. |
| 2 | banner | Applicant banner | n/a (bundle) @~2923800 (`Lbe`) | [shared] | blocked: minified-bundle | done | done | pending | Reused `ApplicantBanner` (`@insurance-poc/common/applicant-banner`) unchanged. Data via `pivvService.fetchPivvDrs` + `mock/drs/pivv-drs.json` (PIVV1001 only); lines pre-composed from user screenshot. Typecheck passes. |
| 3 | pivv-details | PIVV Details (table) + Submit + "Confirm Submit" dialog | n/a (bundle) @~2926400 (`Rbe`, `zbe`) | [new] | blocked: minified-bundle | done | done | pending | `PivvDecisionForm.tsx`. Orange header bar, columns FUP Code / Profile / Raised Date / Raised Remark / PIVV Decision (17 options from `Pbe`) / PIVV Remark. Local state only (prototype dialog Submit just closes). Typecheck passes. |

Note (build-like-v1 --go not used): submit/dialog merged into section 3 per user ("all 3 sections: header, applicant banner, decision").
