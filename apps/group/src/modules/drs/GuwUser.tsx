import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  canInvokeBreRetrigger,
  clearBreRetriggerCount,
  getDrsApplicationNo,
  getDrsMemberCount,
  getDrsMemberId,
  getDrsRoleLabel,
  getDrsRoleType,
  readApiErrorMessage,
  setBreRetriggerCount,
} from "@insurance-poc/utils";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import {
  CustomButton,
  CustomDialog,
  CustomLoader,
  CustomSnackbar,
  DeleteIcon,
} from "@insurance-poc/ui";
import { BreCard } from "@insurance-poc/common/bre-card";
import { useRetriggerGroupBreMutation } from "../../services/breRetriggerApi";
import { formatBreTimestamp, splitDiscrepancies } from "./breFormat";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { drsRoutePath, groupPaths } from "@insurance-poc/routes";
import { Financial } from "@insurance-poc/common/financial";
import { Medical } from "@insurance-poc/common/medical";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildQuickLinkItems, withProposalFormLink } from "./guwQuickLinks";
import {
  RequirementMgmt,
  isNewRequirement,
  type RequirementItem,
} from "@insurance-poc/common/requirement-mgmt";
import { RiskCards, type RiskCardData } from "@insurance-poc/common/risk-cards";
import { GuwSdtRow } from "../guw/GuwSdtRow";
import { GuwUwPanel } from "../guw/GuwUwPanel";
import { GuwSectionDialogs, type GuwSectionDialogKey } from "../guw/GuwSectionDialogs";
import { GuwRaiseGrievanceDialog } from "../guw/GuwRaiseGrievanceDialog";
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
import { useSaveGroupDrsRequirementsMutation } from "../../services/drsApi";
import {
  useGetGroupFinancialDetailsQuery,
  useSaveGroupFinancialMutation,
} from "../../services/financialApi";
import { GROUP_FINANCIAL_ACTIONS_CONFIG } from "../config/financialActions.config";
import { getGroupDrsTaskConfig } from "../../config/drsTaskConfig";

// Placeholder profile image (inline SVG).
const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

// Row 0 is the member line (Name / App No. are shown in the banner header); row 1 is the product line (bold); row 2 is Riders; row 3 is Sum at Risk.
const GUW_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  valueOnlyRowIds: [0],
  skipFieldNames: ["Name", "App No.", "App No"],
  rowLabels: { 2: "Riders", 3: "Sum at Risk" },
};

type BreRetriggerFinalOverrides = Partial<
  Record<"status" | "decision" | "remarks" | "discrepancy" | "timestamp", string>
>;

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.guw;

const GuwUser = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo =
    applicationNoParam?.trim() || getDrsApplicationNo() || "";
  const isFinancialRoute = pathname.toLowerCase().includes("/drs/financial");
  const isMedicalRoute = pathname.toLowerCase().includes("/drs/medical");
  const drsBasePath = applicationNo ? drsRoutePath(applicationNo) : "";
  const financialPath = applicationNo ? drsRoutePath(applicationNo, "financial") : "";
  const medicalPath = applicationNo ? drsRoutePath(applicationNo, "medical") : "";
  const memberCount = getDrsMemberCount();
  const isMultiLife = memberCount > 1;
  const postSubmitUrl = isMultiLife ? groupPaths.guwMemberSelection : groupPaths.inbox;
  const memberId = getDrsMemberId();
  const roleLabel = getDrsRoleLabel();
  const roleType = getDrsRoleType();
  const memberStorageKey = isMultiLife ? guwMemberDecisionKey(applicationNo, memberId) : undefined;
  const drsTaskConfig = getGroupDrsTaskConfig(roleType);
  const [saveGroupDrsRequirements] = useSaveGroupDrsRequirementsMutation();
  const [retriggerGroupBre, retriggerGroupBreState] = useRetriggerGroupBreMutation();
  const [saveFinancial] = useSaveGroupFinancialMutation();

  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const activePartyId = page.kind === "ready" ? page.record.partyId : "";
  const financialQuery = useGetGroupFinancialDetailsQuery(
    { applicationNumber: applicationNo, partyId: activePartyId },
    { skip: !isFinancialRoute || !applicationNo || !activePartyId },
  );

  const [sectionDialog, setSectionDialog] = useState<GuwSectionDialogKey | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [breRetriggerFinals, setBreRetriggerFinals] = useState<BreRetriggerFinalOverrides>({});
  const [breRetriggerBarDecision, setBreRetriggerBarDecision] = useState<string | null>(null);
  const [breRetriggerLimitDialogOpen, setBreRetriggerLimitDialogOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [raiseGrievanceOpen, setRaiseGrievanceOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const openCardPage = (card: RiskCardData) =>
    navigate({ pathname: card.id === "MEDICAL" ? medicalPath : financialPath, search });
  const closeFinancial = () => navigate({ pathname: drsBasePath, search });
  const closeMedical = () => navigate({ pathname: drsBasePath, search });

  const goToInbox = () => {
    clearBreRetriggerCount();
    navigate(groupPaths.inbox, { replace: true });
  };

  const handleBreRetrigger = async () => {
    const appNo = applicationNo.trim();
    if (appNo.length === 0) {
      notify("Application number is missing.");
      return;
    }
    if (retriggerGroupBreState.isLoading) return;

    if (!canInvokeBreRetrigger()) {
      setBreRetriggerLimitDialogOpen(true);
      return;
    }

    try {
      const mapped = await retriggerGroupBre({ applicationNumber: appNo }).unwrap();
      setBreRetriggerCount(mapped.reTriggerCount);
      setBreRetriggerBarDecision(mapped.barDecision);
      setBreRetriggerFinals(mapped.rows);
    } catch (reason: unknown) {
      setBreRetriggerFinals((previous) => ({ ...previous, status: "" }));
      const message = readApiErrorMessage(reason);
      notify(message.length > 0 ? message : "Unable to retrigger BRE.");
    }
  };

  const readBreRowFinal = (rowLabel: string, defaultFinal: string): string => {
    const labelLower = rowLabel.toLowerCase();
    if (labelLower.includes("status") && breRetriggerFinals.status !== undefined) return breRetriggerFinals.status;
    if (labelLower.includes("decision") && breRetriggerFinals.decision !== undefined) return breRetriggerFinals.decision;
    if (labelLower.includes("remark") && breRetriggerFinals.remarks !== undefined) return breRetriggerFinals.remarks;
    if (labelLower.includes("discrepancy") && breRetriggerFinals.discrepancy !== undefined) return breRetriggerFinals.discrepancy;
    if (labelLower.includes("timestamp") && breRetriggerFinals.timestamp !== undefined) return formatBreTimestamp(breRetriggerFinals.timestamp);
    return defaultFinal;
  };

  const handleSaveRequirements = async (updatedRequirements: RequirementItem[]) => {
    try {
      const saved = await saveGroupDrsRequirements({
        applicationNo,
        roleType: drsTaskConfig.roleType,
        lob: "G",
        requirements: updatedRequirements,
      }).unwrap();
      setPage((prev) =>
        prev.kind === "ready"
          ? { kind: "ready", record: { ...prev.record, requirements: saved } }
          : prev,
      );
      notify("Requirements saved successfully.");
    } catch (err: unknown) {
      notify(readApiErrorMessage(err) || "Failed to save requirements.");
    }
  };

  useEffect(() => {
    setBreRetriggerFinals({});
    setBreRetriggerBarDecision(null);
  }, [applicationNo]);

  useEffect(() => {
    if (!applicationNo) {
      setPage({ kind: "missing-id" });
      return;
    }
    let active = true;
    setPage({ kind: "loading" });
    void fetchGuwDrs(applicationNo, memberId, roleType).then((record) => {
      if (!active) return;
      setPage(record ? { kind: "ready", record } : { kind: "not-found" });
    });
    return () => { active = false; };
  }, [applicationNo, memberId, roleType]);

  return (
    <Box
      data-testid="guw-user-main"
      sx={{ minHeight: "100%", background: "#fff8f3", pb: 8 }}
    >
      {retriggerGroupBreState.isLoading && (
        <CustomLoader message="Retriggering BRE" fullScreen />
      )}
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

            {/* View Financial / View Medical: the banner above stays; the page is appended below it */}
            {isMedicalRoute ? (
              <Medical
                applicants={[
                  {
                    key: memberId || page.record.applicantName,
                    label: memberId || page.record.applicantName,
                  },
                ]}
                onBack={closeMedical}
                onSubmit={(payload) => console.log("Submit medical", payload)}
              />
            ) : isFinancialRoute ? (
              <Financial
                applicationNumber={applicationNo}
                partyId={page.record.partyId || undefined}
                applicants={[
                  {
                    key: memberId || page.record.applicantName,
                    label: memberId || page.record.applicantName,
                    partyId: page.record.partyId || undefined,
                  },
                ]}
                sections={financialQuery.data}
                actions={GROUP_FINANCIAL_ACTIONS_CONFIG.guw}
                onBack={closeFinancial}
                onSaveSection={(saveRequest) => saveFinancial(saveRequest).unwrap()}
                onSubmit={(payload) => console.log("Submit financial", payload)}
              />
            ) : (
            <>
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
                  <RiskCards
                    cards={page.record.riskCards}
                    onView={openCardPage}
                    viewCardIds={["FINANCIAL", "MEDICAL"]}
                  />

                  {/* BRE card — chips are clickable and open the Requirement Management dialog */}
                  <BreCard
                    decision={breRetriggerBarDecision ?? page.record.breData.breCode}
                    initialDiscrepancies={page.record.breData.initialDiscrepancy}
                    finalDiscrepancies={
                      breRetriggerFinals.discrepancy !== undefined
                        ? splitDiscrepancies(breRetriggerFinals.discrepancy)
                        : page.record.breData.finalDiscrepancy
                    }
                    statusChips={page.record.breData.statusChips.map((c) => ({
                      key: c.label,
                      label: c.label,
                      count: c.count,
                    }))}
                    onStatusClick={() => setRequirementOpen(true)}
                    onViewDetail={() => setBreDetailOpen(true)}
                    onRefresh={handleBreRetrigger}
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
              drsApplicationNo={page.record.applicationNo}
              partyId={page.record.partyId}
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
              items={buildQuickLinkItems(
                withProposalFormLink(quickLinksConfig.items, page.record.quickLinks.proposalFormLink),
                notify,
                ["applicant-profile", "raise-grievance"],
              )}
              title="Quick Links"
              applicationNo={applicationNo}
              roleType={roleLabel || quickLinksConfig.defaultRoleType}
              onNavigate={(path) => navigate(path)}
              onNotify={notify}
              dialogItemIds={["applicant-profile", "raise-grievance"]}
              onDialogItemClick={(item) => {
                if (item.id === "raise-grievance") setRaiseGrievanceOpen(true);
                else setApplicantProfileOpen(true);
              }}
            />

            <GuwRaiseGrievanceDialog
              open={raiseGrievanceOpen}
              onClose={() => setRaiseGrievanceOpen(false)}
              data={page.record.quickLinks.raiseGrievance}
              context={{
                applicationNo: page.record.applicationNo || applicationNo,
                partyId: page.record.partyId || undefined,
                lifeNumber: page.record.lifeNumber || undefined,
                transactionId: page.record.transactionId || null,
              }}
              notify={notify}
            />

            <ApplicantProfile
              applicants={page.record.quickLinks.applicantProfile ?? []}
              memberTabs
              variant="guw"
              open={applicantProfileOpen}
              onClose={() => setApplicantProfileOpen(false)}
            />
            </>
            )}
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
              applicationKey={applicationNo}
              requirements={page.record.requirements}
              statusVariants={requirementStatusVariants}
              statusOrder={requirementStatusOrder}
              fieldOptions={{
                profile:
                  page.record.memberTypes.length > 0
                    ? page.record.memberTypes.map((type) => ({ label: type, value: type }))
                    : undefined,
              }}
              addButton={{
                label: "+ Add Requirement",
                onClick: () => console.log("Add Requirement clicked"),
              }}
              rowActions={[
                {
                  key: "delete",
                  label: "Remove requirement",
                  icon: <DeleteIcon width={16} height={16} />,
                  tone: "danger",
                  hidden: (row) => !isNewRequirement(row),
                  onClick: (row, { removeRow }) => {
                    console.log("Delete requirement", row.id);
                    removeRow();
                  },
                },
              ]}
              onSave={handleSaveRequirements}
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
            rows={page.record.breData.detailRows.map((row) => ({
              ...row,
              final: readBreRowFinal(row.label, row.final),
            }))}
          />
        ) : null}
      </CustomDialog>

      <CustomDialog
        open={breRetriggerLimitDialogOpen}
        onClose={() => setBreRetriggerLimitDialogOpen(false)}
        showCloseIcon={false}
        disableEscapeKeyDown
        title="BRE Retrigger"
        actions={
          <CustomButton variant="contained" onClick={goToInbox}>
            Ok
          </CustomButton>
        }
      >
        Kindly raise ticket with IT team
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
