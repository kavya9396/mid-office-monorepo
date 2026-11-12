import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { CustomDialog, CustomSnackbar } from "@insurance-poc/ui";
import { BreCard } from "@insurance-poc/common/bre-card";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { groupPaths } from "@insurance-poc/routes";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildQuickLinkItems } from "./guwQuickLinks";
import { RequirementMgmt } from "@insurance-poc/common/requirement-mgmt";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import { GuwSdtRow } from "../guw/GuwSdtRow";
import { GuwUwPanel } from "../guw/GuwUwPanel";
import { GuwSectionDialogs, type GuwSectionDialogKey } from "../guw/GuwSectionDialogs";
import {
  requirementStatusVariants,
  requirementStatusOrder,
} from "../drs/requirementData";
import {
  fetchGuwDrs,
  guwMemberDecisionKey,
  loadGuwSubmittedDecision,
  type GuwDrsRecord,
} from "../../services/guwService";

// Placeholder profile image (inline SVG).
const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

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

const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.guw;

const GuwUser = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = params.get("applicationNo")?.trim() || applicationNoParam?.trim() || "";
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
  // Multi-life: each member's decision is held under its own key so the summary page can show it per member
  const memberId = params.get("memberId")?.trim() ?? "";
  const memberStorageKey = isMultiLife ? guwMemberDecisionKey(applicationNo, memberId) : undefined;

  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  const [sectionDialog, setSectionDialog] = useState<GuwSectionDialogKey | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    if (!applicationNo) {
      setPage({ kind: "missing-id" });
      return;
    }
    let active = true;
    setPage({ kind: "loading" });
    void fetchGuwDrs(applicationNo, memberId).then((record) => {
      if (!active) return;
      setPage(record ? { kind: "ready", record } : { kind: "not-found" });
    });
    return () => { active = false; };
  }, [applicationNo, memberId]);

  return (
    <Box
      data-testid="guw-user-main"
      sx={{ minHeight: "100%", background: "#fff8f3", pb: 8 }}
    >
      <Box>
        {page.kind === "ready" ? (
          <>
            {/* Banner with photo */}
            <ApplicantBanner
              name={page.record.applicantName}
              photoUrl={PROFILE_IMAGE_URL}
              applicationNo={page.record.applicationNo}
              rowDetails={page.record.rowDetails}
              rowDetailsOptions={GUW_BANNER_OPTIONS}
            />

            {/* Summary wrap: risk cards + BRE card */}
            <Box sx={{ p: "6px 4px 0" }}>
              <Box
                sx={{
                  p: "6px",
                  border: "1px solid #f1d8c8",
                  borderRadius: "6px",
                  background: "#fff8f3",
                }}
              >
                {/* top-row: risk panel (3fr) + BRE card (1fr) */}
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
                  {/* risk panel — common RiskCards (panel + details dialog) */}
                  <RiskCards cards={page.record.riskCards} />

                  {/* BRE card — chips are clickable and open the Requirement Management dialog */}
                  <BreCard
                    decision={page.record.breData.breCode}
                    initialDiscrepancies={page.record.breData.initialDiscrepancy}
                    finalDiscrepancies={page.record.breData.finalDiscrepancy}
                    statusChips={page.record.breData.statusChips.map((c) => ({
                      key: c.label,
                      label: c.label,
                      count: c.count,
                    }))}
                    onStatusClick={() => setRequirementOpen(true)}
                    onViewDetail={() => setBreDetailOpen(true)}
                    onRefresh={() => { /* retrigger API TBD */ }}
                  />
                </Box>

                {/* SDT row: financial/medical decision + action buttons */}
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

            {/* UW panel: BRE overall decision + case UW decision */}
            <GuwUwPanel
              applicationNo={applicationNo}
              storageKey={memberStorageKey}
              redirectUrl={postSubmitUrl}
              breOverallDecision={page.record.uwData?.breOverallDecision}
              breOverallRemarks={page.record.uwData?.breOverallRemarks}
              initialSubmittedDecision={
                memberStorageKey
                  ? (loadGuwSubmittedDecision(memberStorageKey) ?? undefined)
                  : page.record.uwData?.submittedDecision
              }
              onDecisionSubmit={(_decision: string, _remarks: string) => {
                // Submit API handler to be wired
              }}
            />

            {/* Quick Links */}
            <QuickLinksModule
              items={buildQuickLinkItems(quickLinksConfig.items, notify)}
              title="Quick Links"
              applicationNo={applicationNo}
              roleType={params.get("role")?.trim() || quickLinksConfig.defaultRoleType}
              onNavigate={(path) => navigate(path)}
              onNotify={notify}
              dialogItemIds={["applicant-profile"]}
              onDialogItemClick={() => setApplicantProfileOpen(true)}
            />

            <ApplicantProfile
              open={applicantProfileOpen}
              onClose={() => setApplicantProfileOpen(false)}
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

      {/* Requirement Management dialog — opens on chip click */}
      {page.kind === "ready" && (
        <CustomDialog
          open={requirementOpen}
          onClose={() => setRequirementOpen(false)}
          title="Requirement Management"
          maxWidth="xl"
          fullWidth
        >
          <Box sx={{ p: 1 }}>
            <RequirementMgmt
              requirements={page.record.requirements}
              readOnly
              statusVariants={requirementStatusVariants}
              statusOrder={requirementStatusOrder}
            />
          </Box>
        </CustomDialog>
      )}

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
};

export default GuwUser;
