import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { BreCard } from "@insurance-poc/common/bre-card";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import { GuwSdtRow } from "./GuwSdtRow";
import { GuwUwPanel } from "./GuwUwPanel";
import { GuwSectionDialogs, type GuwSectionDialogKey } from "./GuwSectionDialogs";
import { groupPaths } from "@insurance-poc/routes";
import { CustomDialog, CustomSnackbar } from "@insurance-poc/ui";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";
import   { QuickLinksModule }  from "@insurance-poc/common/quick-links";
import { buildQuickLinkItems } from "../drs/guwQuickLinks";

// Row 1 (Product line) is bold; row 2 is Riders; row 4 is Sum at Risk; row 0 values rendered without repeating Name / App No. in the line.
const GUW_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  skipFieldNames: ["Name", "App No.", "App No"],
  valueOnlyRowIds: [0],
  rowLabels: { 2: "Riders", 4: "Sum at Risk" },
};

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

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
  const navigate = useNavigate();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  // Multi-life case (more than one member): after submit go to the member summary page, else the inbox
  const isMultiLife = parseInt(params.get("memberCount") ?? "0", 10) > 1;
  const memberSummaryQuery = new URLSearchParams({
    applicationNo,
    roleType: params.get("roleType") ?? "",
  });
  const roleParam = params.get("role") ?? "";
  if (roleParam) memberSummaryQuery.set("role", roleParam);
  const postSubmitUrl = isMultiLife
    ? `${groupPaths.guwMemberSelection}?${memberSummaryQuery.toString()}`
    : groupPaths.inbox;
  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const [sectionDialog, setSectionDialog] = useState<GuwSectionDialogKey | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const quickItems = [
    { id: "applicant-profile", label: "Applicant Profile" },
    { id: "proposal-documents", label: "Proposal Form & Documents" },
    { id: "previous-policies", label: "Previous Policies" },
    { id: "open-tasks", label: "Open Tasks" },
    { id: "risk-details", label: "Risk Details" },
    { id: "audit-trail", label: "Audit Trail" },
    { id: "raise-grievance", label: "Raise Grievance" },
  ];

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
      data-testid="guw-drs-main"
      sx={{
        minHeight: "100%",
        background: "#fff8f3",
        pb: 8,
      }}
    >
      <Box>
        {page.kind === "ready" ? (
          <>
            {/* Banner Shell */}
            <ApplicantBanner
              name={page.record.applicantName}
              applicationNo={page.record.applicationNo}
              rowDetails={page.record.rowDetails}
              rowDetailsOptions={GUW_BANNER_OPTIONS}
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
                      md: "minmax(0, 3fr) minmax(245px, 1fr)",
                    },
                    gap: "6px",
                    alignItems: "stretch",
                  }}
                >
                  {/* .risk-panel — common RiskCards (panel + details dialog) */}
                  <RiskCards cards={page.record.riskCards} />

                  {/* .bre-card */}
                  <BreCard
                    decision={page.record.breData.breCode}
                    initialDiscrepancies={page.record.breData.initialDiscrepancy}
                    finalDiscrepancies={page.record.breData.finalDiscrepancy}
                    statusChips={page.record.breData.statusChips.map((c) => ({
                      key: c.label,
                      label: c.label,
                      count: c.count,
                    }))}
                    onViewDetail={() => setBreDetailOpen(true)}
                    onRefresh={() => { /* retrigger API TBD */ }}
                  />
                </Box>

                {/* .sdt-row */}
                <Box sx={{ mt: "7px" }}>
                  <GuwSdtRow
                    data={page.record.sdtRow}
                    onGrievanceHistory={() => setSectionDialog("grievanceHistory")}
                    onClaimAudit={() => setSectionDialog("claimAudit")}
                    onUwGuidelines={() => setSectionDialog("uwGuidelines")}
                    onSpecialRemarks={() => setSectionDialog("specialRemarks")}
                  />
                </Box>
              </Box>
            </Box>

            {/* .uw-panel */}
            <GuwUwPanel
              applicationNo={applicationNo}
              redirectUrl={postSubmitUrl}
              breOverallDecision={page.record.uwData?.breOverallDecision}
              breOverallRemarks={page.record.uwData?.breOverallRemarks}
              initialSubmittedDecision={page.record.uwData?.submittedDecision}
              onDecisionSubmit={(_decision: string, _remarks: string) => {
                // Submit API handler to be wired
              }}
            />

            {/* Quick Links Floating Action Button */}
            <QuickLinksModule
              items={buildQuickLinkItems(quickItems, notify)}
              title="Quick Links"
              applicationNo={applicationNo}
              onNavigate={(path) => navigate(path)}
              onNotify={notify}
            />
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

      {/* BRE Detail dialog */}
      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title={
          <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
            BRE Decision
          </Typography>
        }
        maxWidth="lg"
        contentSx={{ p: { xs: 1, sm: 1.5 } }}
      >
        {page.kind === "ready" ? (
          <DecisionComparisonTable
            headers={page.record.breData.detailHeaders}
            rows={page.record.breData.detailRows}
          />
        ) : null}
      </CustomDialog>

      {page.kind === "ready" ? (
        <GuwSectionDialogs
          sections={page.record.sections}
          open={sectionDialog}
          onClose={() => setSectionDialog(null)}
          notify={notify}
        />
      ) : null}

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
