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
- `fetchCaseDecisionOptions()`: Fetches the 11 Case Underwriting Decision options.
- `fetchReferralTypeOptions()`, `fetchReferralReasonOptions()`: Retrieves cascading options for Reinsurer, IT, or HO CMO referrals.
- `fetchLoadingClassOptions()`, `fetchLoadingReasonOptions()`: Retrieves numerical classes and medical loading explanations.
- `fetchReinsurerUwOptions()`, `fetchReferralDocuments()`: Fetches official underwriters and files for reinsurance submission.

---

## Behaviour & Interactions

1. **Grievance History:** Clicking the "Grievance History" action in the banner opens a `CustomDialog` containing the `GrievanceHistory` table in read-only mode.
2. **Case Underwriting Decision RESTING Styling:** The resting dropdown has a solid orange outline (`2px solid #e45f14`, `borderRadius: 8px`). The side-by-side read-only box has a centered vertical divider line and matched rounded corners.
3. **Multi-Step Underwriting Popup Dialog:**
   - **Step 1 (Decision Details):** Selection of specific actions prompts for remarks, smoker flags, counter-offer details, or referral criteria. Submitting validates that all required details (including mandatory Remarks) are provided, then proceeds to Step 2.
   - **Step 2 (UW Guidelines Checklist):** Displays a structured 7-row checklist table. For each row, selecting a *Justification Reason* enables and mandates the corresponding *Justification Remarks*.
   - **Final Submission:** Submitting performs full reason-remarks validation, triggers a `CustomSnackbar` success toast, and issues a full browser redirect (`replaceUrl`) back to the Group Inbox after exactly `700ms`.
4. **Quick Links FAB:** Floating bottom-right red-maroon circle button with a link icon. Clicking it rotates the button 45 degrees, revealing a list of 7 items. Selecting an item displays a standard informative toast.

---

## Open Questions

All items from the HTML prototypes have been successfully implemented and integrated. No pending open questions remain.

Status: Approved
