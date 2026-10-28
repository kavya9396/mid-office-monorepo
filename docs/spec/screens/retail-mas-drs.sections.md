# retail-mas-drs — section map
Prototype: Retail/MAS/mas-drs-prototype.html (minified bundle; no readable HTML structure)
Screen root: not yet annotated (annotation not possible: minified-bundle)
Spec file: docs/spec/screens/retail-mas.md (section "DRS — MAS Task")
App target: apps/retail

| # | Section id | Title (as in prototype) | Lines (start-end) | Tag | Annotate | Spec | Build | Check | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | header | App header | n/a (bundle) | [shared] | n/a | done | done | pending | `AppHeader` in `apps/common`; `showBack`, user name, Logout menu. See retail-mas.md OQ-7, OQ-8. Typecheck passes. |
| 2 | banner | Applicant banner | n/a (bundle) | [shared] | blocked: minified-bundle | pending | done | pending | Built from user-supplied screenshot (prototype is a minified bundle). `ApplicantBanner` in `apps/common` (export `./applicant-banner`); data via `masService.fetchMasBanner` + `mock/drs/mas-banner.json` (MAS1001 only). Lines are pre-composed strings. Styles approximated from screenshot + 00-shared-layout.md §4 — verify against rendered prototype. Typecheck passes. |
| 3 | tabs | DRS tabs | n/a (bundle) | [reuse] | blocked: minified-bundle | pending | pending | pending | Tab labels unknown (OQ-3) |
| 4 | footer | Decision footer | n/a (bundle) | [shared] | blocked: minified-bundle | pending | pending | pending | Decision options unknown (OQ-3) |
| 5 | decision-form | MAS decision form + Submit | n/a (bundle) | [new] | blocked: minified-bundle | pending | done | pending | `MasDecisionForm.tsx` in `apps/retail/src/modules/mas`. Labels/fields/options from prototype component `oSe` (Date of Premium Debit, Date of Email received from Frontline, Eops Reference number, MAS Decision [Accept, Reject, Raise Requirement, Refer to IT], Remarks) + "Confirm Submit" dialog. Local state only; no submit API in prototype. Prototype binds Eops Reference number and Remarks to the same state variable (looks like a prototype bug) — built as two independent fields; confirm. Prototype prefill from `masDetails` not wired (no mock data). Typecheck passes. |
