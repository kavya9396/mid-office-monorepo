# Group Underwriting (GUW) Informal DRS Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Group/GUW Informal/`
> High-fidelity updated reference: `CUW-updated-16-10.html`

---

## Overview

The Group Underwriting (GUW) Informal DRS screen is a comprehensive workspace for group insurance underwriters. It brings together financial, medical, and overall risk indicators for a specific proposal, automates rules verification via the Business Rules Engine (BRE), lists outstanding requirements, and supports an interactive, high-fidelity Case Underwriting Decision panel.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/group/inbox` | Group Underwriting Landing / Inbox |
| `/group/guw/drs?applicationNo=X` | GUW Informal DRS Page (this screen) |

---

## Layout

- **DRS Outer Shell:** Sticky `AppHeader` (57px height) + `<main>` element with `height: calc(100dvh - 57px)` and `overflowY: auto`.
- **Banner Shell:** Sticky `ApplicantBanner` positioned inside `<main>` at `top: 0` and `z-index: 20`.
- **Content Wrap:** Single-page summary grid with a customized 1px solid border `#f1d8c8`, border radius `6px`, and background `#fff8f3`.
- **Top Row Summary Grid:** A responsive CSS Grid containing the Risk Panel (3 columns) and the BRE Status Card.
- **SDT Row:** Horizontal strip containing summary decisions and action shortcuts.
- **Underwriting Decision Panel (`uw-panel`):** A fixed bottom block containing the overall BRE results and the rests of Case UW Decision dropdown.

---

## Component Reuse (Confirmed)

| Region | Component | Tag | Source | Fidelity Note |
|---|---|---|---|---|
| Header | `AppHeader` | `[shared]` | `@insurance-poc/common/app-header` | Sticky top, includes Back to Inbox button and logout. |
| Banner | `ApplicantBanner` | `[shared]` | `@insurance-poc/common/applicant-banner` | Contains the 4-line concatenated bio/plan string. |
| Banner Actions | `GrievanceHistory` | `[reuse]` | `@insurance-poc/common/grievance-history` | Rendered inside a `CustomDialog` on clicking Grievance History. |
| Risk Cards | `GuwRiskCards` | `[new]` | `apps/group/src/modules/guw/GuwRiskCards.tsx` | Sub-grid wrapping 3 detail cards for Financial, Medical, and Risk Parameters. |
| BRE Card | `BreCard` | `[new]` | `apps/common/src/components/BreCard.tsx` | Side block for BRE status, discrepancies, and status chips. |
| SDT Row | `GuwSdtRow` | `[new]` | `apps/group/src/modules/guw/GuwSdtRow.tsx` | Horizontal band with action triggers and quick modals. |
| UW Panel | `GuwUwPanel` | `[new]` | `apps/group/src/modules/guw/GuwUwPanel.tsx` | Interactive underwriting decision selector and multi-step dialog. |
| Quick Links | `QuickLinks` | `[reuse]` | `@insurance-poc/common/quick-links` | Floating bottom-right action bubble with rotational toggle and nav links. |

---

## Screens

### GUW Informal DRS Page

#### Purpose
Allows the Group Underwriter to review automated results, read comments, inspect risk levels, and post their official Underwriting Decision while walking through mandatory Underwriting Guidelines checklists.

#### Component Tree
```
<GuwDrsPage>
  <AppHeader showBack onBack={navigate('/group/inbox')} />
  <main style={{ height: 'calc(100dvh - 57px)', overflowY: 'auto' }}>
    <ApplicantBanner />
    <Box class="content">
      <Box class="summary-wrap">
        <Box class="top-row">
          <GuwRiskCards riskCards={...} />
          <BreCard ... />
        </Box>
        <GuwSdtRow ... />
      </Box>
    </Box>
    <GuwUwPanel ... />
    <QuickLinks items={...} />
  </main>
</GuwDrsPage>
```

#### Data / API
All dropdown arrays, decision options, guidelines checklist questions, and detail documents are configured asynchronously from the Group services layer:
- `fetchGuwDrs(applicationNo)`: Retrieves complete applicant metadata, BRE data, risk parameters, and current decisions.
- `fetchCaseDecisionOptions()`: Fetches the 7 Case Underwriting Decision options (STD, BOR_STD, REJ, DC, POSTP, CO, EP). Raise Referral, Hold and Counter Sign are not dropdown options; they are separate action buttons.
- `fetchReferralTypeOptions()`, `fetchReferralReasonOptions()`: Retrieves the Raise Referral rows (IT, Reinsurer, Sr UW Opinion, HOD Opinion, HO CMO, CMO, Risk, Accuity, CUW Claim, Tele MER, Video MER) and their reason lists.
- `fetchLoadingClassOptions()`, `fetchLoadingReasonOptions()`: Retrieves numerical classes and medical loading explanations.
- `fetchReinsurerUwOptions()`, `fetchReferralDocuments()`: Fetches official underwriters and files for reinsurance submission.
- `loadGuwSubmittedDecision(key)`, `saveGuwSubmittedDecision(key, decision)`, `clearGuwSubmittedDecision(key)` (`guwService.ts`): Persist the saved Case UW Decision snapshot (including guidelines) in `sessionStorage` under `guwSubmittedDecision:<key>`. `key` is `<applicationNo>` for a single-life case, `guwMemberDecisionKey(applicationNo, memberId)` = `<applicationNo>:<memberId>` for a member DRS of a multi-life case, and `<applicationNo>:summary` for the Case UW Decision on the member summary page. `GuwUwPanel` takes `applicationNo` plus optional `storageKey` (overrides the key) and `redirectUrl`.
- Multi-life member DRS (`/guw/drs` with `roleType=GUW`, `memberId` and `memberCount > 1`) is rendered by `modules/drs/GuwUser.tsx`; `GuwDrsPage` renders the other cases. Both pass `redirectUrl` and, for multi-life, `storageKey`.
- Counter Sign "Assigned To" uses a placeholder list (UW001, UW002, UW003) until a user-lookup API is specified.

---

## Behaviour & Interactions

1. **Grievance History:** Clicking the "Grievance History" action in the banner opens a `CustomDialog` containing the `GrievanceHistory` table in read-only mode.
2. **Case Underwriting Decision RESTING Styling:** The resting dropdown has a solid orange outline (`2px solid #e45f14`, `borderRadius: 8px`) and lists 7 decisions plus a "Clear" entry once a value is set. Below it, right-aligned (`padding-right: 70px`), sit the action buttons Raise Referral (`REFERRAL`), Hold (`HOLD`), Counter Sign (`APPROVER`) and Submit. Once a decision is saved, an orange eye icon beside the dropdown opens a read-only "Case UW Decision Details" dialog (decision fields, reconsideration, reinsurer details/documents, counter-offer rows, remarks and UW Guidelines). "Clear" resets the dropdown and removes the saved decision.
3. **Multi-Step Underwriting Popup Dialog:**
   - **Step 1 (Decision Details):** Choosing a decision (or an action button) prompts for decision-specific fields and mandatory UW Remarks (not required for Raise Referral). The standalone Smoker Flag field is removed. There is no Back button on this step (the ✕ closes the dialog); Back appears only on Counter Sign / Raise Referral when opened from UW Guidelines. Submitting validates the required details and calls the decision-validation service (`validateGuwDecision`; request `userId`, `role` = `CUW`, `applicationNo`; mock until the endpoint exists). Details: [group-guw-uw-submit-validation.md](./group-guw-uw-submit-validation.md).
   - **Validation result:** `SUCCESS` shows a popup "Decision validated successfully" with "Selected decision: <label>"; closing it performs the final submit. `FAIL` saves the decision as a draft (main dropdown linked to the Case UW Decision) and proceeds to Step 2.
   - **Step 2 (UW Guidelines):** The same 5-column table (Reason, Remark, System Action, Justification/Checklist, Justification Remarks) in a scrollable dialog (content `82vh`, paper `90vh`), filled from the validation response. The "Justification/Checklist" header has an info (i) icon whose tooltip reads "Select a reason for each justification and checklist item. A remark is mandatory when the justification reason is Other Reason." Each row starts with a category icon: Justification (`TaskIcon`), Checklist (`NoteIcon`), Hard Alert (`DangerIcon`), Soft Alert (`InfomationIcon`), shown in that order. Justification and Checklist rows are editable: the reason dropdown uses the API `reason[]` list, and a remark is mandatory only for an "Other Reason" justification. Hard and Soft Alert rows are locked ("Not applicable"). There is no Save button: "Confirm & Submit" is blocked until every justification and checklist row has a reason ("Please select a reason for all justifications and checklists"). If any Hard Alert has the system action "Blocker", the message "User is not allowed to provide terminal decisions,please modify the decision" is shown, "Confirm & Submit" is disabled and only Back stays enabled. Soft-alert-only results can be submitted directly. Reopening a saved decision restores the saved selections.
   - **Routing (after "Confirm & Submit"):** `referralReqd = Y` takes priority and shows "User is not allowed to provide terminal decisions, please refer the case to {targets}" (targets from the hard-alert "Refer to …" actions, e.g. "HOD, CMO, Reinsurer"), then opens Raise Referral with one row pre-selected (priority CMO / other, Sr UW Opinion, HOD Opinion, Reinsurer). Otherwise `counterSignReqd = Y` shows "User is not allowed to provide terminal decisions, please counter sign the case" and opens Counter Sign. The Case UW Decision stays the base decision for Counter Sign; for a referral it is replaced by Raise Referral only when the referral is finally submitted. Counter Sign / Raise Referral is then the final step; its Back button (back to UW Guidelines, saved justifications intact) is shown only when opened from UW Guidelines, never when opened from the main-page action buttons.
   - **Counter Sign (`APPROVER`):** Fields Reason (Counter signing / Medical assessment / Financial assessment / Other), Refer To (HOD or Sr UW) and Assigned To (UW001 / UW002 / UW003, placeholder). Validation order: Reason → Refer To → Assigned To, with messages "Please select Reason", "Please select Refer To", "Please select Assigned To". The earlier referral-purpose radio and 1st UW Decision fields are removed.
   - **Raise Referral (`REFERRAL`):** A table with columns checkbox, Refer To, Reason, UW Remarks, Assigned To and Action (Edit/Hide); rows IT, Reinsurer, Sr UW Opinion, HOD Opinion, HO CMO, CMO, Risk, Accuity, CUW Claim, Tele MER, Video MER. Reinsurer, Sr UW Opinion and HOD Opinion are mutually exclusive with every other row, and the header select-all skips them. Selecting HO CMO unchecks CMO, and CMO is disabled while HO CMO is selected. Tele MER and Video MER are mutually exclusive: selecting one disables the other, and the header select-all leaves both unchanged. The Assigned To dropdown (UW001 / UW002 / UW003, placeholder list) is enabled only when the Sr UW Opinion or HOD Opinion row is selected; the chosen value is shown as "Assigned To" in the Case UW Decision Details dialog. Tele MER / Video MER reasons ("Medical review", "Other") are placeholders pending a reason list from the business. Ticking Reinsurer opens the "Reinsurer Referral Sheet" (Reinsurer Details, Assign Documents, Generate Referral Sheet) and scrolls to it; Edit/Hide toggles it. Generate Referral Sheet requires remarks (the Reinsurer row remarks or the UW Remarks). Validation: "Please select at least one referral".
   - **Final Submission:** Submitting triggers a `CustomSnackbar` "Decision submitted successfully" toast, and issues a full browser redirect (`replaceUrl`) after exactly `700ms`: to the Group Inbox for a single-life case, or to the GUW member selection (summary) page (`/guw/member-selection`) when the DRS URL has `memberCount > 1`. A final submit made on the summary page itself (its own Case UW Decision panel) redirects to the Group Inbox. Counter-offer rows are saved only when the case decision is CO, BOR_STD or EP. The "Case UW Decision Details" (eye icon) dialog shows the saved UW Guidelines rows with the same category icons; snapshots saved before the validation API keep their older static guidelines list.
4. **Quick Links FAB:** Floating bottom-right red-maroon circle button with a link icon. Clicking it rotates the button 45 degrees, revealing a list of 7 items. Selecting an item displays a standard informative toast.

---

## Open Questions

All items from the HTML prototypes have been successfully implemented and integrated. No pending open questions remain.

Status: Approved
