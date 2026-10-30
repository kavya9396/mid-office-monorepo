import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { AppHeader } from "@insurance-poc/common/app-header";
import { ApplicantBanner } from "@insurance-poc/common/applicant-banner";
import { BreCard } from "@insurance-poc/common/bre-card";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { ClaimAudit, type ClaimAuditRow } from "@insurance-poc/common/claim-audit";
import { SpecialRemarks, type SpecialRemarksRow } from "@insurance-poc/common/special-remarks";
import { UwGuidelines, type UwGuidelineRow } from "@insurance-poc/common/uw-guidelines";
import { GuwRiskCards } from "./GuwRiskCards";
import { GuwSdtRow } from "./GuwSdtRow";
import { GuwUwPanel, INITIAL_GUIDELINES } from "./GuwUwPanel";
import { commonPaths, groupPaths, replaceUrl } from "@insurance-poc/routes";
import {
  CustomDialog,
  LogoutIcon,
  CustomSnackbar,
} from "@insurance-poc/ui";
import { clearToken, getSessionUser } from "@insurance-poc/utils";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";
import { QuickLinks } from "@insurance-poc/common/quick-links";

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

function signOut(): void {
  clearToken();
  replaceUrl(commonPaths.login);
}

/**
 * GUW Informal DRS page generated from CUW-updated-16-10.html
 * Outer Shell: AppHeader (57px) + scrollable main (calc(100dvh - 57px))
 * - Banner Shell: ApplicantBanner (sticky top 0)
 * - Content Wrap: .content > .summary-wrap
 *   - .top-row: .risk-panel (3 risk cards) + .bre-card
 *   - .sdt-row: Financial/Medical Decision labels + 4 action buttons
 * - Section: .uw-panel (BRE Overall Decision/Remarks + Case UW Decision select & dialog)
 */
export function GuwDrsPage() {
  const [params] = useSearchParams();
  const userName = getSessionUser()?.displayName ?? "";
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState("All");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [claimAuditOpen, setClaimAuditOpen] = useState(false);
  const [uwGuidelinesOpen, setUwGuidelinesOpen] = useState(false);
  const [specialRemarksOpen, setSpecialRemarksOpen] = useState(false);

  // UW Guidelines checklist (edited through the shared UwGuidelines component)
  const [guidelines, setGuidelines] = useState<UwGuidelineRow[]>(
    INITIAL_GUIDELINES.map((g) => ({ ...g })),
  );

  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Mock rows for Claim Audit & Special Remarks
  const claimAuditRows: ClaimAuditRow[] = [
    {
      id: "1",
      policyNo: "POL-2026-001845",
      productCode: "IPRU123",
      claimKey: "CLM-000783",
      canonicalId: "CAN-874152",
      patientName: "Rohan Mehta",
      ailment: "Acute Myocardial Infarction",
      claimType: "Death",
      subType: "Natural",
      intimationDate: "18/08/2026",
      doa: "20/08/2026",
      dod: "22/08/2026",
      status: "Approved",
    },
    {
      id: "2",
      policyNo: "POL-2026-002196",
      productCode: "IPRU456",
      claimKey: "CLM-000921",
      canonicalId: "CAN-874338",
      patientName: "Nisha Kapoor",
      ailment: "Chronic Kidney Disease",
      claimType: "Critical Illness",
      subType: "Medical",
      intimationDate: "02/09/2026",
      doa: "04/09/2026",
      dod: "-",
      status: "Under Review",
    },
    {
      id: "3",
      policyNo: "POL-2026-002418",
      productCode: "IPRU789",
      claimKey: "CLM-001038",
      canonicalId: "CAN-874519",
      patientName: "Amit Verma",
      ailment: "Road Traffic Accident",
      claimType: "Accidental",
      subType: "Hospitalization",
      intimationDate: "12/09/2026",
      doa: "12/09/2026",
      dod: "-",
      status: "Approved",
    },
  ];

  const specialRemarkRows: SpecialRemarksRow[] = [
    {
      id: "1",
      comments: "Medical documents require verification before the final decision.",
      updatedDate: "07/09/2026 11:36:09",
      updatedBy: "ipru75474",
    },
    {
      id: "2",
      comments: "Customer was contacted for additional financial information.",
      updatedDate: "07/09/2026 10:52:41",
      updatedBy: "CUW Team",
    },
    {
      id: "3",
      comments: "Previous claim history reviewed and no adverse concern identified.",
      updatedDate: "08/09/2026 09:18:27",
      updatedBy: "DRS Reviewer",
    },
  ];
  const quickItems = [
    { id: "applicant-profile", label: "Applicant Profile" },
    { id: "proposal-documents", label: "Proposal Form & Documents" },
    { id: "previous-policies", label: "Previous Policies" },
    { id: "open-tasks", label: "Open Tasks" },
    { id: "risk-details", label: "Risk Details" },
    { id: "audit-trail", label: "Audit Trail" },
    { id: "raise-grievance", label: "Raise Grievance" },
  ];

  const handleQuickLinkClick = (item: { id: string; label: string }) => {
    setSnackbarMessage(`Navigating to ${item.label}`);
    setSnackbarOpen(true);
  };

  const linkItems = quickItems.map((link) => ({
    ...link,
    onClick: () => handleQuickLinkClick(link),
  }));

  useEffect(() => {
    if (!applicationNo) {
      setPage({ kind: "missing-id" });
      return;
    }

    let active = true;
    setPage({ kind: "loading" });
    void fetchGuwDrs(applicationNo).then((record) => {
      if (!active) return;
      setPage(record ? { kind: "ready", record } : { kind: "not-found" });
    });

    return () => {
      active = false;
    };
  }, [applicationNo]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff8f3",
      }}
    >
      <AppHeader
        showBack
        onBack={() => replaceUrl(groupPaths.inbox)}
        userName={userName}
        menuItems={[
          { label: "Logout", icon: <LogoutIcon />, onSelect: signOut },
        ]}
      />

      <Box
        component="main"
        data-testid="guw-drs-main"
        sx={{
          height: "calc(100dvh - 57px)",
          overflowY: "auto",
        }}
      >
        {page.kind === "ready" ? (
          <>
            {/* Banner Shell */}
            <ApplicantBanner
              applicantName={page.record.applicantName}
              applicationLabel={page.record.applicationLabel}
              lines={page.record.lines}
            />

            {/* .content > .summary-wrap */}
            <Box sx={{ p: "6px 4px 0" }}>
              <Box
                sx={{
                  p: "6px",
                  border: "1px solid #f1d8c8",
                  borderRadius: "6px",
                  background: "#fff8f3",
                }}
              >
                {/* .top-row (3fr risk-panel + 1fr bre-card) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "minmax(0, 3fr) minmax(245px, 1fr)",
                    },
                    gap: "6px",
                    alignItems: "stretch",
                  }}
                >
                  {/* .risk-panel */}
                  <Box
                    sx={{
                      minWidth: 0,
                      p: "8px",
                      border: "1px solid #ded8d5",
                      borderRadius: "12px",
                      background: "#fff",
                      boxShadow: "0 2px 7px rgba(60, 42, 35, .07)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gridAutoRows: "1fr",
                        gap: "6px",
                        flex: 1,
                      }}
                    >
                      <GuwRiskCards riskCards={page.record.riskCards} />
                    </Box>
                  </Box>

                  {/* .bre-card */}
                  <BreCard
                    breCode={page.record.breData.breCode}
                    initialDiscrepancy={page.record.breData.initialDiscrepancy}
                    finalDiscrepancy={page.record.breData.finalDiscrepancy}
                    statusChips={page.record.breData.statusChips}
                    activeStatus={activeStatus}
                    onStatusFilter={setActiveStatus}
                    onViewDetail={() => setBreDetailOpen(true)}
                    onRetrigger={() => {
                      /* retrigger API TBD */
                    }}
                  />
                </Box>

                {/* .sdt-row */}
                <Box sx={{ mt: "7px" }}>
                  <GuwSdtRow
                    data={page.record.sdtRow}
                    onGrievanceHistory={() => setHistoryOpen(true)}
                    onClaimAudit={() => setClaimAuditOpen(true)}
                    onUwGuidelines={() => setUwGuidelinesOpen(true)}
                    onSpecialRemarks={() => setSpecialRemarksOpen(true)}
                  />
                </Box>
              </Box>
            </Box>

            {/* .uw-panel */}
            <GuwUwPanel
              breOverallDecision={page.record.uwData?.breOverallDecision}
              breOverallRemarks={page.record.uwData?.breOverallRemarks}
              initialSubmittedDecision={page.record.uwData?.submittedDecision}
              onDecisionSubmit={(_decision: string, _remarks: string) => {
                // Submit API handler to be wired
              }}
            />

            {/* Quick Links Floating Action Button */}
            <QuickLinks items={linkItems} title="Quick Links" />
          </>
        ) : null}

        {page.kind === "missing-id" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            Application number is missing.
          </Box>
        ) : null}

        {page.kind === "not-found" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            No GUW record was found for application {applicationNo}.
          </Box>
        ) : null}
      </Box>

      {/* Grievance History dialog */}
      <CustomDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <GrievanceHistory rows={[]} paginationDisabled />
      </CustomDialog>

      {/* BRE Detail dialog */}
      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title="BRE Decision"
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 1, color: "#302a27", fontSize: "12px" }}>
          BRE detail view — to be built in a later step.
        </Box>
      </CustomDialog>

      {/* Claim Audit dialog — GUW is editable: rows can be validated */}
      <CustomDialog
        open={claimAuditOpen}
        onClose={() => setClaimAuditOpen(false)}
        title="Claim Audit"
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <ClaimAudit
            variant="editable"
            rows={claimAuditRows}
            onValidate={(row) => notify(`Claim ${row.policyNo} validated successfully`)}
          />
        </Box>
      </CustomDialog>

      {/* Special Remarks dialog — GUW is editable: rows can be validated */}
      <CustomDialog
        open={specialRemarksOpen}
        onClose={() => setSpecialRemarksOpen(false)}
        title="Special Remarks"
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <SpecialRemarks
            variant="editable"
            rows={specialRemarkRows}
            onValidate={() => notify("Special remark validated successfully")}
          />
        </Box>
      </CustomDialog>

      {/* UW Guidelines dialog — GUW is editable: justifications can be edited */}
      <CustomDialog
        open={uwGuidelinesOpen}
        onClose={() => setUwGuidelinesOpen(false)}
        title="UW Guidelines"
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <UwGuidelines
            variant="editable"
            rows={guidelines}
            onClose={() => setUwGuidelinesOpen(false)}
            onValidationError={notify}
            onSubmit={(updated) => {
              setGuidelines(updated);
              setUwGuidelinesOpen(false);
              notify("Guidelines updated successfully");
            }}
          />
        </Box>
      </CustomDialog>

      {/* Snackbar alerts for Quick Links & standalone dialog validations */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity="info"
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={2000}
      />
    </Box>
  );
}
