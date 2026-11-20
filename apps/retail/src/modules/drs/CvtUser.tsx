import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomLoader,
  CustomSnackbar,
  CustomTypography,
  DeleteIcon,
} from "@insurance-poc/ui";
import { drsRoutePath } from "@insurance-poc/routes";
import {
  canInvokeBreRetrigger,
  clearBreRetriggerCount,
  clearDrsTaskIds,
  formatDateTime,
  getDrsRoleLabel,
  getDrsRoleType,
  getMasterList,
  readApiErrorMessage,
  setBreRetriggerCount,
} from "@insurance-poc/utils";
import { Financial } from "@insurance-poc/common/financial";
import { Medical } from "@insurance-poc/common/medical";
import { QuickLinksModule, type QuickLinkItem } from "@insurance-poc/common/quick-links";
import { DecisionHistory, type DecisionHistoryRow } from "@insurance-poc/common/decision-history";
import { PivvDetails, type PivvDetailRow } from "@insurance-poc/common/pivv-details";
import {
  DecisionBar,
  DecisionComparisonTable,
  type ComparisonRow,
} from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { DecisionSection, type DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import { LifeAssured, type LifeAssuredTab } from "@insurance-poc/common/life-assured";
import {
  RequirementMgmt,
  isNewRequirement,
  type RequirementItem,
} from "@insurance-poc/common/requirement-mgmt";
import { getRetailDrsTaskConfig } from "../../config/drsTaskConfig";
import { useRetriggerRetailBreMutation } from "../../services/breRetriggerApi";
import { useCompleteRetailTaskMutation } from "../../services/completeTaskApi";
import {
  useGetRetailDrsQuery,
  useSaveRetailDrsApplicantMutation,
  useSaveRetailDrsRequirementsMutation,
} from "../../services/drsApi";
import { CvtEditApplicantDialog } from "./CvtEditApplicantDialog";
import { requirementStatusOrder, requirementStatusVariants } from "./requirementData";

/** PIVV Details rows. Static until the DRS response provides them (prototype data in cvt-drs-prototype.html). */
const CVT_PIVV_DETAILS: PivvDetailRow[] = [
  {
    id: "pivv-demo-1",
    fupCode: "PIV",
    profile: "Life Assured",
    raisedDate: "9 Sep 2026",
    raisedRemark: "-",
    decisions: ["Another person spoken", "Pre-recorded video", "Customer didn’t complete the full script"],
    pivvRemark: "Customer not speaking",
  },
];

/** Decision History rows. Static until the DRS response provides them (prototype data in cvt-drs-prototype.html). */
const CVT_DECISION_HISTORY: DecisionHistoryRow[] = [
  {
    date: "28 Sept 2026, 01:31:11 pm",
    userName: "Priya Sharma",
    userRole: "CVT",
    remarks: "Applicant details reviewed and forwarded for decision.",
  },
];

/** Quick links shown on the CVT DRS. Open Tasks and Audit Trail open their page; the other only notifies. */
const CVT_QUICK_LINKS: QuickLinkItem[] = [
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "open-tasks", label: "Open Tasks" },
  { id: "audit-trail", label: "Audit Trail" },
];

const CVT_DEFAULT_ROLE_TYPE = "CVT User";

/** `misc` master row type holding the CVT decision options. */
const CVT_DECISION_MISC_TYPE = "CVT_TERM_DESC";

/** Requirement save `lob` for Retail (see `resolveBreRetriggerLob` in `apps/common`). */
const RETAIL_LOB = "R";

/** Life assured profile tabs shown on the CVT DRS (as in the prototype). */
const CVT_LIFE_ASSURED_TABS: LifeAssuredTab[] = ["imageDetails", "personalKyc", "contactAddress", "paymentPayout"];

// Which BRE rows highlight differences between Initial and Final (as in the prototype)
const BRE_DIFF_BY_ROW_ID: Record<string, ComparisonRow["diff"]> = {
  decision: "value",
  discrepancy: "tokens",
};

type BreRetriggerFinalOverrides = Partial<
  Record<"status" | "decision" | "remarks" | "discrepancy" | "timestamp", string>
>;

/** The selected applicant travels in the router's navigation state, so the URL stays `/financial` / `/medical`. */
type ApplicantRouteState = { applicantId?: string };

const readApplicantId = (state: unknown): string | undefined => {
  if (typeof state !== "object" || state === null || !("applicantId" in state)) return undefined;
  const { applicantId } = state as ApplicantRouteState;
  return typeof applicantId === "string" && applicantId.trim().length > 0 ? applicantId.trim() : undefined;
};

function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to load the Retail DRS.";
}

/** Retail DRS for `roleType` `CVT_TASK`. */
const CvtUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const navigate = useNavigate();
  const { pathname, search, state: locationState } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const isFinancialRoute = lowerPath.includes("/drs/financial");
  const isMedicalRoute = lowerPath.includes("/drs/medical");
  const drsBasePath = applicationNo.length > 0 ? drsRoutePath(applicationNo) : "";
  const financialPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "financial") : "";
  const medicalPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "medical") : "";
  const currentApplicantId = readApplicantId(locationState);

  const drsTaskConfig = getRetailDrsTaskConfig(getDrsRoleType());
  const drsQueryArg = { applicationNo, ...drsTaskConfig };
  const drs = useGetRetailDrsQuery(drsQueryArg, {
    skip: applicationNo.length === 0,
    // Always hit the DRS API when the screen mounts instead of serving the cached result.
    refetchOnMountOrArgChange: true,
  });
  const [saveRetailDrsRequirements] = useSaveRetailDrsRequirementsMutation();
  const [saveRetailDrsApplicant] = useSaveRetailDrsApplicantMutation();
  const [completeRetailTask, completeRetailTaskState] = useCompleteRetailTaskMutation();
  const [retriggerRetailBre, retriggerRetailBreState] = useRetriggerRetailBreMutation();

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [breRetriggerFinals, setBreRetriggerFinals] = useState<BreRetriggerFinalOverrides>({});
  const [breRetriggerBarDecision, setBreRetriggerBarDecision] = useState<string | null>(null);
  const [breRetriggerLimitDialogOpen, setBreRetriggerLimitDialogOpen] = useState(false);
  // Requirement Management has edits that were not saved yet.
  const [requirementsDirty, setRequirementsDirty] = useState(false);
  const [saveRequirementsNoticeOpen, setSaveRequirementsNoticeOpen] = useState(false);
  const decisionOptions = useMemo(
    () =>
      getMasterList("misc", CVT_DECISION_MISC_TYPE)
        .filter((entry) => entry.isActive === "Y")
        .map((entry) => ({ label: entry.description, value: entry.code })),
    [],
  );
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    setBreRetriggerFinals({});
    setBreRetriggerBarDecision(null);
  }, [applicationNo]);

  const goToInbox = () => {
    clearBreRetriggerCount();
    navigate("/inbox", { replace: true });
  };

  const handleBreRetrigger = async () => {
    if (applicationNo.length === 0) {
      setSnackbarMessage("Application number is missing.");
      return;
    }
    if (retriggerRetailBreState.isLoading) return;

    if (!canInvokeBreRetrigger()) {
      setBreRetriggerLimitDialogOpen(true);
      return;
    }

    try {
      const mapped = await retriggerRetailBre({ applicationNumber: applicationNo }).unwrap();
      setBreRetriggerCount(mapped.reTriggerCount);
      setBreRetriggerBarDecision(mapped.barDecision);
      setBreRetriggerFinals(mapped.rows);
    } catch (reason: unknown) {
      setBreRetriggerFinals((previous) => ({ ...previous, status: "" }));
      const message = readApiErrorMessage(reason);
      setSnackbarMessage(message.length > 0 ? message : "Unable to retrigger BRE.");
    }
  };

  const handleDecisionSubmit = async (payload: DecisionSubmitPayload) => {
    if (requirementsDirty) {
      setSaveRequirementsNoticeOpen(true);
      return;
    }
    if (applicationNo.length === 0) {
      setSnackbarMessage("Application number is missing.");
      return;
    }
    try {
      await completeRetailTask({
        appNo: applicationNo,
        decision: payload.decision,
        remarks: payload.remarks,
      }).unwrap();
      clearDrsTaskIds();
      goToInbox();
    } catch (reason: unknown) {
      const apiMessage = readApiErrorMessage(reason);
      if (apiMessage.length > 0) setSnackbarMessage(apiMessage);
    }
  };

  const handleSaveRequirements = async (updatedRequirements: RequirementItem[]) => {
    try {
      await saveRetailDrsRequirements({
        applicationNo,
        roleType: drsTaskConfig.roleType,
        lob: RETAIL_LOB,
        requirements: updatedRequirements,
        queryArg: drsQueryArg,
      }).unwrap();
      setSnackbarMessage("Requirements saved successfully.");
    } catch (reason: unknown) {
      setSnackbarMessage(readApiErrorMessage(reason) || "Failed to save requirements.");
    }
  };

  if (drs.isLoading) {
    return <CustomLoader message="Loading application" />;
  }

  if (drs.isError || !drs.data) {
    return (
      <CustomBox sx={{ p: 2 }}>
        <CustomTypography>{readQueryError(drs.error)}</CustomTypography>
      </CustomBox>
    );
  }

  const { cardDetails, breDecision, requirements, applicants, editValues } = drs.data;
  const selectedApplicant = applicants.find((applicant) => applicant.id === currentApplicantId) ?? applicants[0];
  const applicantOptions = applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }));

  const handleSaveEditApplicant = async (applicantId: string, values: Parameters<typeof saveRetailDrsApplicant>[0]["values"]) => {
    const applicant = applicants.find((item) => item.id === applicantId);
    try {
      await saveRetailDrsApplicant({
        applicationNo,
        applicantId,
        partyId: applicant?.partyId,
        memberType: applicant?.memberType ?? applicantId,
        values,
        initialValues: editValues[applicantId],
        roleType: drsTaskConfig.roleType,
        screenType: drsTaskConfig.screenType,
        businessType: drsTaskConfig.businessType,
        queryArg: drsQueryArg,
      }).unwrap();
      setSnackbarMessage("Applicant details updated successfully.");
    } catch (reason: unknown) {
      setSnackbarMessage(readApiErrorMessage(reason) || "Failed to update applicant details.");
    }
  };

  const openFinancial = (applicantId: string) => {
    navigate({ pathname: financialPath, search }, { state: { applicantId } satisfies ApplicantRouteState });
  };
  const openMedical = (applicantId: string) => {
    navigate({ pathname: medicalPath, search }, { state: { applicantId } satisfies ApplicantRouteState });
  };
  const closeSubPage = () => navigate({ pathname: drsBasePath, search });
  const handleFinancialApplicantChange = (applicantKey: string) => {
    navigate(
      { pathname: financialPath, search },
      { replace: true, state: { applicantId: applicantKey } satisfies ApplicantRouteState },
    );
  };

  const detailCards = (
    <CustomBox
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 2,
      }}
    >
      {cardDetails.map((card) => (
        <DetailCard
          key={card.type}
          title={card.type}
          attributes={card.attributes}
          expandedAttributes={card.expandedAttributes}
          tables={card.tables}
        />
      ))}
    </CustomBox>
  );

  if (isFinancialRoute) {
    return (
      <Financial
        applicationNumber={applicationNo}
        summary={detailCards}
        applicants={applicantOptions}
        initialApplicantKey={selectedApplicant?.id}
        onApplicantChange={handleFinancialApplicantChange}
        onBack={closeSubPage}
        onSubmit={(payload) => console.log("Submit financial", payload)}
      />
    );
  }

  if (isMedicalRoute) {
    return (
      <Medical
        summary={detailCards}
        applicants={applicantOptions}
        initialApplicantKey={selectedApplicant?.id}
        onBack={closeSubPage}
        onSubmit={(payload) => console.log("Submit medical", payload)}
      />
    );
  }

  const readBreRowFinal = (rowId: string, defaultFinal: string): string => {
    if (Object.hasOwn(breRetriggerFinals, rowId)) {
      return breRetriggerFinals[rowId as keyof BreRetriggerFinalOverrides] ?? "";
    }
    return defaultFinal;
  };

  const breRows: ComparisonRow[] = breDecision.rows.map((row) => {
    const finalRaw = readBreRowFinal(row.id, row.final);
    return {
      label: row.label,
      initial: row.id === "timestamp" ? formatDateTime(row.initial) : row.initial,
      final: row.id === "timestamp" ? formatDateTime(finalRaw) : finalRaw,
      diff: BRE_DIFF_BY_ROW_ID[row.id],
    };
  });
  const breDiscrepancyRow = breDecision.rows.find((row) => row.id === "discrepancy");

  return (
    <CustomBox
      sx={{
        position: "relative",
        minHeight: "100%",
        p: 2,
        display: "flex",
        gap: 2,
        flexDirection: "column",
      }}
    >
      {retriggerRetailBreState.isLoading && <CustomLoader message="Retriggering BRE" fullScreen />}

      {detailCards}

      <QuickLinksModule
        items={CVT_QUICK_LINKS}
        applicationNo={applicationNo}
        roleType={getDrsRoleLabel() || CVT_DEFAULT_ROLE_TYPE}
        onNavigate={(path) => navigate(path)}
        onNotify={(message) => setSnackbarMessage(message)}
        title="Quick Links"
      />

      <DecisionBar
        title="BRE Decision"
        items={[
          { label: "Initial", value: breDecision.initialDecision },
          { label: "Final", value: breRetriggerBarDecision ?? breDecision.decision, tone: "success" },
        ]}
        onRefresh={handleBreRetrigger}
        refreshLabel="BRE Retrigger"
        onViewDetail={() => setBreDetailOpen(true)}
      />

      <DecisionBar
        title="BRE Discrepancy"
        items={[{ label: "Final", value: breDiscrepancyRow?.final ?? "", tone: "success" }]}
      />

      <RequirementMgmt
        applicationKey={applicationNo}
        requirements={requirements}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
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
        onDirtyChange={setRequirementsDirty}
      />

      <LifeAssured
        applicants={applicants}
        tabs={CVT_LIFE_ASSURED_TABS}
        onViewMedical={openMedical}
        onViewFinancial={openFinancial}
        renderEditDialog={(applicant, onClose) => {
          const initialValues = editValues[applicant.id];
          if (!initialValues) return null;
          return (
            <CvtEditApplicantDialog
              key={applicant.id}
              initialValues={initialValues}
              onClose={onClose}
              onSave={(values) => {
                void handleSaveEditApplicant(applicant.id, values);
                onClose();
              }}
            />
          );
        }}
      />

      <PivvDetails rows={CVT_PIVV_DETAILS} />

      <DecisionHistory rows={CVT_DECISION_HISTORY} />

      <DecisionSection
        ariaLabel="CVT Decision"
        remarksLabel="CVT Remarks"
        decisionLabel="CVT Decision"
        decisionOptions={decisionOptions}
        decision={decision}
        remarks={remarks}
        onDecisionChange={setDecision}
        onRemarksChange={setRemarks}
        onSubmit={handleDecisionSubmit}
        isSubmitting={completeRetailTaskState.isLoading}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <CustomSnackbar
        open={saveRequirementsNoticeOpen}
        message="Please save the requirements before submitting."
        severity="warning"
        onClose={() => setSaveRequirementsNoticeOpen(false)}
      />

      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title={
          <CustomTypography
            component="span"
            sx={{ fontSize: 16, fontWeight: 700 }}
          >
            BRE Decision
          </CustomTypography>
        }
        maxWidth="lg"
      >
        <DecisionComparisonTable
          headers={breDecision.headers}
          rows={breRows}
        />
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
    </CustomBox>
  );
};

export default CvtUser;
