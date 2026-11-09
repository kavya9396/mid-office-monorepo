import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { BreCard } from "@insurance-poc/common/bre-card";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import {
  CustomBox,
  CustomDialog,
  CustomSnackbar,
  CustomTable,
  CustomTypography,
  type Column,
} from "@insurance-poc/ui";
import { GuwSdtRow } from "../guw/GuwSdtRow";
import { GuwSectionDialogs, type GuwSectionDialogKey } from "../guw/GuwSectionDialogs";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";
import {
  fetchReferralDecisionHistory,
  type ReferralDecisionHistoryRow,
  type ReferralRoleConfig,
} from "../../services/referralUwService";
import { ReferralDecisionSection } from "./ReferralDecisionSection";
import { REFERRAL_PROFILE_IMAGE_URL } from "./profileImage";

// Row 0 (Name / App No.) is already shown as the heading + badge; row 2 (product) is bold.
const REFERRAL_BANNER_OPTIONS: RowDetailsOptions = { skipRowIds: [0], emphasisRowIds: [2] };

// Underwriting Decision History columns (prototype `Mxe`).
const DECISION_HISTORY_COLUMNS: Column<ReferralDecisionHistoryRow>[] = [
  { key: "userName", header: "User Name", width: "12%" },
  { key: "userRole", header: "User Role", width: "10%" },
  { key: "firstUwDecision", header: "UW Decision", width: "12%" },
  { key: "firstUwRemarks", header: "UW Remarks", width: "19%" },
  { key: "date", header: "Date", width: "11%" },
  { key: "financialDecision", header: "Financial Decision", width: "12%" },
  { key: "medicalDecision", header: "Medical Decision", width: "12%" },
  { key: "smokerStatus", header: "Smoker Status", width: "12%" },
  { key: "referralReason", header: "Referral Reason", width: "14%" },
  { key: "referralRemarks", header: "Referral Remarks", width: "18%" },
];

const QUICK_ITEMS = [
  { id: "applicant-profile", label: "Applicant Profile" },
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "previous-policies", label: "Previous Policies" },
  { id: "open-tasks", label: "Open Tasks" },
  { id: "risk-details", label: "Risk Details" },
  { id: "audit-trail", label: "Audit Trail" },
  { id: "raise-grievance", label: "Raise Grievance" },
];

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

export interface ReferralDrsPageProps {
  /** HOD or Sr UW — drives the decision card labels and options. */
  config: ReferralRoleConfig;
}

/**
 * Member-level DRS page for the HOD and Sr UW tasks
 * (prototypes: hod-drs-prototype.html, sr-uw-drs-prototype.html).
 * Same top area as the GUW member DRS page (banner with photo, risk cards, BRE card, SDT row), followed by
 *  - BRE Overall Decision / Remarks strip
 *  - Underwriting Decision History table
 *  - decision card (ReferralDecisionSection)
 */
export function ReferralDrsPage({ config }: Readonly<ReferralDrsPageProps>) {
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  // Multi-life case (more than one member): after submit go back to the member screen, else the inbox
  const isMultiLife = parseInt(params.get("memberCount") ?? "0", 10) > 1;
  const memberSummaryQuery = new URLSearchParams({
    applicationNo,
    roleType: params.get("roleType") ?? "",
  });
  const roleParam = params.get("role") ?? "";
  if (roleParam) memberSummaryQuery.set("role", roleParam);
  const postSubmitUrl = isMultiLife
    ? `${groupPaths.referralMemberSelection}?${memberSummaryQuery.toString()}`
    : groupPaths.inbox;

  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const [historyRows, setHistoryRows] = useState<ReferralDecisionHistoryRow[]>([]);

  const [sectionDialog, setSectionDialog] = useState<GuwSectionDialogKey | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const linkItems = QUICK_ITEMS.map((link) => ({
    ...link,
    onClick: () => notify(`Navigating to ${link.label}`),
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
    void fetchReferralDecisionHistory(applicationNo).then((rows) => {
      if (active) setHistoryRows(rows);
    });
    return () => {
      active = false;
    };
  }, [applicationNo]);

  return (
    <Box
      data-testid="referral-drs-main"
      sx={{ minHeight: "100%", background: "#fff8f3", pb: 8 }}
    >
      <Box>
        {page.kind === "ready" ? (
          <>
            <ApplicantBanner
              name={page.record.applicantName}
              photoUrl={REFERRAL_PROFILE_IMAGE_URL}
              applicationNo={page.record.applicationNo}
              rowDetails={page.record.rowDetails}
              rowDetailsOptions={REFERRAL_BANNER_OPTIONS}
            />

            {/* Summary wrap: risk cards + BRE card + SDT row */}
            <Box sx={{ p: "6px 4px 0" }}>
              <Box
                sx={{
                  p: "6px",
                  border: "1px solid #f1d8c8",
                  borderRadius: "6px",
                  background: "#fff8f3",
                }}
              >
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
                  <RiskCards cards={page.record.riskCards} />

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

            <Box sx={{ p: "4px 12px 0" }}>
              {/* BRE Overall Decision / Remarks */}
              <CustomBox
                role="group"
                aria-label="SDT decision details"
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    md: "minmax(130px, 0.65fr) minmax(0, 2fr)",
                  },
                  alignItems: "stretch",
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  border: "1px solid #E4DEDB",
                  borderLeft: "4px solid #E45F14",
                  borderRadius: "8px",
                  bgcolor: "#FCFAF9",
                  overflow: "hidden",
                  boxShadow: "0 2px 7px rgba(60, 42, 35, 0.04)",
                }}
              >
                {[
                  { label: "BRE Overall Decision", value: page.record.uwData?.breOverallDecision },
                  { label: "BRE Overall Remarks", value: page.record.uwData?.breOverallRemarks },
                ].map(({ label, value }, index) => (
                  <CustomBox
                    key={label}
                    sx={{
                      minWidth: 0,
                      px: 1.5,
                      py: 1,
                      borderLeft: { xs: "none", md: index > 0 ? "1px solid #E8E1DE" : "none" },
                      borderTop: { xs: index > 0 ? "1px solid #E8E1DE" : "none", md: "none" },
                    }}
                  >
                    <CustomTypography
                      sx={{
                        color: "#8B807B",
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.45,
                        lineHeight: 1.4,
                        mb: 0.4,
                      }}
                    >
                      {label}
                    </CustomTypography>
                    <CustomTypography
                      sx={{
                        color: index === 0 ? "#302A27" : "#4B433F",
                        fontSize: 11,
                        fontWeight: index === 0 ? 800 : 600,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value || "-"}
                    </CustomTypography>
                  </CustomBox>
                ))}
              </CustomBox>

              {/* Underwriting Decision History */}
              <CustomBox sx={{ mt: 0.75 }}>
                <CustomTable<ReferralDecisionHistoryRow>
                  title="Underwriting Decision History"
                  columns={DECISION_HISTORY_COLUMNS}
                  data={historyRows}
                />
              </CustomBox>

              {/* Role decision (HOD / Sr UW) */}
              <CustomBox sx={{ mt: 0.75 }}>
                <ReferralDecisionSection
                  roleLabel={config.label}
                  decisionOptions={config.decisionOptions}
                  onSubmit={() => {
                    // Submit API handler to be wired
                    replaceUrl(postSubmitUrl);
                  }}
                />
              </CustomBox>
            </Box>

            <QuickLinksModule items={linkItems} title="Quick Links" />
          </>
        ) : null}

        {page.kind === "missing-id" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            Application number is missing.
          </Box>
        ) : null}

        {page.kind === "not-found" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            No {config.label} record was found for application {applicationNo}.
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

export default ReferralDrsPage;
