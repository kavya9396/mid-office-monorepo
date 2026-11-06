import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { CustomDialog, CustomSnackbar } from "@insurance-poc/ui";
import { BreCard } from "@insurance-poc/common/bre-card";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { ClaimAudit, type ClaimAuditRow } from "@insurance-poc/common/claim-audit";
import { SpecialRemarks, type SpecialRemarksRow } from "@insurance-poc/common/special-remarks";
import { UwGuidelines, type UwGuidelineRow } from "@insurance-poc/common/uw-guidelines";
import { INITIAL_GUIDELINES } from "@insurance-poc/common/case-uw-decision";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { RequirementMgmt } from "@insurance-poc/common/requirement-mgmt";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import { GuwSdtRow } from "../guw/GuwSdtRow";
import { GuwUwPanel } from "../guw/GuwUwPanel";
import {
  requirementStatusVariants,
  requirementStatusOrder,
} from "../drs/requirementData";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";

// Placeholder profile image (inline SVG).
const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

// Row 0 (Name / App No.) is already shown as the heading + badge; row 2 (product) is bold.
const GUW_BANNER_OPTIONS: RowDetailsOptions = { skipRowIds: [0], emphasisRowIds: [2] };

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

// Mock rows for Claim Audit & Special Remarks dialogs.
const CLAIM_AUDIT_ROWS: ClaimAuditRow[] = [
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

const SPECIAL_REMARK_ROWS: SpecialRemarksRow[] = [
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

const QUICK_ITEMS = [
  { id: "applicant-profile", label: "Applicant Profile" },
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "previous-policies", label: "Previous Policies" },
  { id: "open-tasks", label: "Open Tasks" },
  { id: "risk-details", label: "Risk Details" },
  { id: "audit-trail", label: "Audit Trail" },
  { id: "raise-grievance", label: "Raise Grievance" },
];

const GuwUser = () => {
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";

  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [claimAuditOpen, setClaimAuditOpen] = useState(false);
  const [uwGuidelinesOpen, setUwGuidelinesOpen] = useState(false);
  const [specialRemarksOpen, setSpecialRemarksOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [guidelines, setGuidelines] = useState<UwGuidelineRow[]>(
    INITIAL_GUIDELINES.map((g) => ({ ...g })),
  );

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
    return () => { active = false; };
  }, [applicationNo]);

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
                    onGrievanceHistory={() => setHistoryOpen(true)}
                    onClaimAudit={() => setClaimAuditOpen(true)}
                    onUwGuidelines={() => setUwGuidelinesOpen(true)}
                    onSpecialRemarks={() => setSpecialRemarksOpen(true)}
                  />
                </Box>
              </Box>
            </Box>

            {/* UW panel: BRE overall decision + case UW decision */}
            <GuwUwPanel
              breOverallDecision={page.record.uwData?.breOverallDecision}
              breOverallRemarks={page.record.uwData?.breOverallRemarks}
              initialSubmittedDecision={page.record.uwData?.submittedDecision}
              onDecisionSubmit={(_decision: string, _remarks: string) => {
                // Submit API handler to be wired
              }}
              onSubmit={() => replaceUrl(groupPaths.inbox)}
            />

            {/* Quick Links */}
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
            headers={{ label: "BRE", initial: "Initial BRE", final: "Final BRE" }}
            rows={page.record.breData.detailRows}
          />
        ) : null}
      </CustomDialog>

      {/* Claim Audit dialog */}
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
            rows={CLAIM_AUDIT_ROWS}
            onValidate={(row) => notify(`Claim ${row.policyNo} validated successfully`)}
          />
        </Box>
      </CustomDialog>

      {/* Special Remarks dialog */}
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
            rows={SPECIAL_REMARK_ROWS}
            onValidate={() => notify("Special remark validated successfully")}
          />
        </Box>
      </CustomDialog>

      {/* UW Guidelines dialog */}
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
