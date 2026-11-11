import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { drsRoutePath } from "@insurance-poc/routes";
import { clearDrsTaskIds, formatDateTime, readApiErrorMessage } from "@insurance-poc/utils";

import { Box, Typography } from "@mui/material";
import { CustomSnackbar, CustomDialog, DeleteIcon, EditIcon } from "@insurance-poc/ui";
import {
  DecisionBar,
  DecisionComparisonTable,
  type ComparisonRow,
} from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { DecisionSection, type DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import {
  hasPendingPanPendcode,
  LifeAssured,
  PAN_INVALID_SUBMIT_BLOCKED_MESSAGE,
  type LifeAssuredApplicant,
  type PanStatus,
  type PanValidationInput,
  type PanValidationResult,
} from "@insurance-poc/common/life-assured";
import { Financial } from "@insurance-poc/common/financial";
import { Medical } from "@insurance-poc/common/medical";
import { RequirementMgmt } from "@insurance-poc/common/requirement-mgmt";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import {
  requirementStatusOptions,
  requirementStatusOrder,
  requirementStatusVariants,
} from "./requirementData";
import { useCompleteGroupTaskMutation } from "../../services/completeTaskApi";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import {
  useGetGroupFinancialDetailsQuery,
  useSaveGroupFinancialMutation,
} from "../../services/financialApi";
import type { CardType } from "../../services/drsService";
import { useValidateNsdlPanMutation } from "../../services/nsdlApi";
import { createNsdlPanValidateRequest, resolveNsdlOutcome } from "../../services/nsdlService";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";

const CARD_TITLES: Record<CardType, string> = {
  APPLICATION: "Application Detail",
  SOURCE: "Source Detail",
  GROUP: "Group Detail",
  RISK: "Risk Detail",
};


const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.dvt;

const APPLICANT_ID_PARAM = "applicantId";

export interface DvtUserProps {
  previousPolicyMode?: "page" | "modal";
}


function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to load the Group DRS.";
}

// Which BRE rows highlight differences between Initial and Final (as in the prototype)
const BRE_DIFF_BY_ROW_ID: Record<string, ComparisonRow["diff"]> = {
  decision: "value",
  discrepancy: "tokens",
};

const readApplicantName = (applicant: LifeAssuredApplicant | undefined): string => {
  const value = applicant?.personalFields.find((field) => field.label === "Applicant Name")?.value;
  return value === null || value === undefined ? "" : String(value);
};

const DvtUser = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { applicationNo: applicationNoParam } = useParams();
  const lowerPath = pathname.toLowerCase();
  const isFinancialRoute = lowerPath.includes("/drs/financial");
  const isMedicalRoute = lowerPath.includes("/drs/medical");
  const requestedApplicationNo = applicationNoParam?.trim() ?? "";
  const drs = useGetGroupDrsQuery(requestedApplicationNo, { skip: requestedApplicationNo.length === 0 });
  const applicationNo = requestedApplicationNo || drs.data?.applicationNo || "";
  const drsBasePath = applicationNo.length > 0 ? drsRoutePath(applicationNo) : "";
  const financialPath =
    applicationNo.length > 0 ? drsRoutePath(applicationNo, "financial") : "";
  const medicalPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "medical") : "";

  const applicants = drs.data?.applicants ?? [];
  const currentApplicantParam = params.get(APPLICANT_ID_PARAM)?.trim();
  const selectedApplicant =
    applicants.find((a) => a.id === currentApplicantParam) ?? applicants[0];
  const activePartyId = selectedApplicant?.partyId ?? "";

  const financialQuery = useGetGroupFinancialDetailsQuery(
    { applicationNumber: applicationNo, partyId: activePartyId },
    { skip: !isFinancialRoute || !applicationNo || !activePartyId },
  );
  const [saveFinancial] = useSaveGroupFinancialMutation();

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [completeGroupTask, completeGroupTaskState] = useCompleteGroupTaskMutation();
  const [validateNsdlPan] = useValidateNsdlPanMutation();
  // Last NSDL result per applicant; kept here so it survives closing the dialog and the submit step can read it.
  const [panStatusByApplicant, setPanStatusByApplicant] = useState<Record<string, PanStatus>>({});
  // Applicants whose PAN NSDL found invalid (API ok, pan_validation false). Any of them blocks case submission.
  // Cleared when that applicant's PAN or Birthdate changes, or when a later validation succeeds.
  const [invalidPanByApplicant, setInvalidPanByApplicant] = useState<Record<string, PanValidationInput>>({});
  const [panBlockedNoticeOpen, setPanBlockedNoticeOpen] = useState(false);
  const handlePanStatusChange = (applicantId: string, status: PanStatus) => {
    setPanStatusByApplicant((current) => ({ ...current, [applicantId]: status }));
    setInvalidPanByApplicant((current) => {
      const invalid = current[applicantId];
      if (!invalid || (invalid.panNumber === status.panNumber && invalid.dob === status.dob)) return current;
      const { [applicantId]: _removed, ...rest } = current;
      return rest;
    });
  };
  const handleValidatePan = async (
    applicantId: string,
    input: PanValidationInput,
  ): Promise<PanValidationResult> => {
    const applicant = applicants.find((item) => item.id === applicantId);
    const request = createNsdlPanValidateRequest({
      applicationNumber: applicationNo,
      pan: input.panNumber,
      name: readApplicantName(applicant),
      dob: input.dob,
      fatherName: "",
    });
    const pendingPanPendcode = hasPendingPanPendcode(drs.data?.requirements ?? []);
    const response = await validateNsdlPan(request);
    // A failed call is an API error: the message is the API's, or the error text.
    const result =
      "data" in response && response.data
        ? response.data
        : {
            apiSuccess: false,
            panValid: false,
            message: readApiErrorMessage(response.error),
            matches: { nameMatching: false, dobMatching: false, aadharSeeding: false },
          };
    const outcome = resolveNsdlOutcome(result, pendingPanPendcode);
    if (outcome === "blocked") {
      setInvalidPanByApplicant((current) => ({ ...current, [applicantId]: input }));
    } else if (outcome !== "apiErrorShowMessage") {
      setInvalidPanByApplicant((current) => {
        const { [applicantId]: _removed, ...rest } = current;
        return rest;
      });
    }
    return {
      message: result.message,
      matches: result.matches,
      panValid: outcome === "apiErrorShowMessage" ? undefined : outcome === "success",
      raisePendcode: outcome === "apiErrorRaisePendcode",
    };
  };
  const openFinancial = (applicantId: string) => {
    const next = new URLSearchParams(params);
    next.set(APPLICANT_ID_PARAM, applicantId);
    navigate({ pathname: financialPath, search: `?${next.toString()}` });
  };
  const closeFinancial = () => {
    const next = new URLSearchParams(params);
    next.delete(APPLICANT_ID_PARAM);
    const query = next.toString();
    navigate({ pathname: drsBasePath, search: query ? `?${query}` : "" });
  };
  const openMedical = (applicantId: string) => {
    const next = new URLSearchParams(params);
    next.set(APPLICANT_ID_PARAM, applicantId);
    navigate({ pathname: medicalPath, search: `?${next.toString()}` });
  };
  const closeMedical = () => {
    const next = new URLSearchParams(params);
    next.delete(APPLICANT_ID_PARAM);
    const query = next.toString();
    navigate({ pathname: drsBasePath, search: query ? `?${query}` : "" });
  };

  const handleFinancialApplicantChange = (applicantKey: string) => {
    const next = new URLSearchParams(params);
    next.set(APPLICANT_ID_PARAM, applicantKey);
    navigate({ pathname: financialPath, search: `?${next.toString()}` }, { replace: true });
  };

  const handleBreRetrigger = () => console.log("BRE Retrigger clicked");
  const handleApplicantAction = (action: string) => (applicantId: string) =>
    console.log(`${action} clicked`, applicantId);
  const handleDecisionSubmit = async (payload: DecisionSubmitPayload) => {
    if (Object.keys(invalidPanByApplicant).length > 0) {
      setPanBlockedNoticeOpen(true);
      return;
    }
    const appNo = applicationNo.trim();
    if (appNo.length === 0) {
      setSnackbarMessage("Application number is missing.");
      return;
    }
    try {
      await completeGroupTask({
        appNo,
        decision: payload.decision,
        remarks: payload.remarks,
      }).unwrap();
      clearDrsTaskIds();
      navigate("/inbox", { replace: true });
    } catch (reason: unknown) {
      const apiMessage = readApiErrorMessage(reason);
      if (apiMessage.length > 0) {
        setSnackbarMessage(apiMessage);
      }
    }
  };

  if (drs.isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading application...</Typography>
      </Box>
    );
  }

  if (drs.isError || !drs.data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>{readQueryError(drs.error)}</Typography>
      </Box>
    );
  }

  const { cardDetails, breDecision, dvtDecision, requirements } = drs.data;

  const detailCards = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 2,
      }}
    >
      {cardDetails.map((card) => (
        <DetailCard
          key={card.type}
          title={CARD_TITLES[card.type]}
          attributes={card.attributes}
          expandedAttributes={card.expandedAttributes}
          tables={card.tables}
        />
      ))}
    </Box>
  );

  if (isFinancialRoute) {
    const financialApplicants = applicants.map((applicant) => ({
      key: applicant.id,
      label: applicant.label,
      partyId: applicant.partyId,
    }));
    return (
      <Financial
        applicationNumber={applicationNo}
        partyId={selectedApplicant?.partyId}
        summary={detailCards}
        applicants={financialApplicants.length > 0 ? financialApplicants : undefined}
        initialApplicantKey={selectedApplicant?.id || undefined}
        sections={financialQuery.data}
        onApplicantChange={handleFinancialApplicantChange}
        onBack={closeFinancial}
        onSaveSection={(saveRequest) => saveFinancial(saveRequest).unwrap()}
        onSubmit={(payload) => console.log("Submit financial", payload)}
      />
    );
  }

  if (isMedicalRoute) {
    const medicalApplicants = applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }));
    return (
      <Medical
        summary={detailCards}
        applicants={medicalApplicants.length > 0 ? medicalApplicants : undefined}
        initialApplicantKey={params.get(APPLICANT_ID_PARAM)?.trim() || undefined}
        onBack={closeMedical}
        onSubmit={(payload) => console.log("Submit medical", payload)}
      />
    );
  }

  const breRows: ComparisonRow[] = breDecision.rows.map((row) => ({
    label: row.label,
    initial: row.id === "timestamp" ? formatDateTime(row.initial) : row.initial,
    final: row.id === "timestamp" ? formatDateTime(row.final) : row.final,
    diff: BRE_DIFF_BY_ROW_ID[row.id],
  }));

  return (
    <Box sx={{ position: "relative", minHeight: "100%", p:2, display: "flex", gap:2, flexDirection: "column" }}>
      {detailCards}

      <QuickLinksModule
        items={quickLinksConfig.items}
        applicationNo={applicationNo}
        roleType={params.get("role")?.trim() || quickLinksConfig.defaultRoleType}
        onNavigate={(path) => navigate(path)}
        onNotify={(message) => setSnackbarMessage(message)}
        dialogItemIds={["applicant-profile"]}
        onDialogItemClick={() => setApplicantProfileOpen(true)}
        title="Quick Links"
      />

      <ApplicantProfile
        open={applicantProfileOpen}
        onClose={() => setApplicantProfileOpen(false)}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <CustomSnackbar
        open={panBlockedNoticeOpen}
        message={PAN_INVALID_SUBMIT_BLOCKED_MESSAGE}
        severity="error"
        autoHideDuration={8000}
        onClose={() => setPanBlockedNoticeOpen(false)}
      />

      <DecisionBar
        title="BRE Decision"
        items={[
          { label: "Initial", value: breDecision.initialDecision },
          { label: "Final", value: breDecision.decision, tone: "success" },
        ]}
        onRefresh={handleBreRetrigger}
        refreshLabel="BRE Retrigger"
        onViewDetail={() => setBreDetailOpen(true)}
      />

      <RequirementMgmt
        requirements={requirements}
        statusOptions={requirementStatusOptions}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
        addButton={{
          label: "+ Add Requirement",
          onClick: () => console.log("Add Requirement clicked"),
        }}
        rowActions={[
          {
            key: "edit",
            label: "Edit requirement",
            icon: <EditIcon width={16} height={16} />,
            onClick: (row) => console.log("Edit requirement", row.id),
          },
          {
            key: "delete",
            label: "Remove requirement",
            icon: <DeleteIcon width={16} height={16} />,
            tone: "danger",
            onClick: (row, { removeRow }) => {
              console.log("Delete requirement", row.id);
              removeRow();
            },
          },
        ]}
        onSave={(requirements) => console.log("Save requirements", requirements)}
      />

      <LifeAssured
        applicants={applicants}
        onEdit={handleApplicantAction("Edit")}
        onViewMedical={openMedical}
        onViewFinancial={openFinancial}
        onValidatePan={handleValidatePan}
        panStatusByApplicant={panStatusByApplicant}
        onPanStatusChange={handlePanStatusChange}
      />

      <DecisionSection
        decisionOptions={dvtDecision.decisionOptions.length > 0 ? dvtDecision.decisionOptions : undefined}
        decision={decision}
        remarks={remarks}
        onDecisionChange={setDecision}
        onRemarksChange={setRemarks}
        defaultDecisionCode={dvtDecision.decisionCode}
        onSubmit={handleDecisionSubmit}
        isSubmitting={completeGroupTaskState.isLoading}
      />

      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title={
          <Typography
            component="span"
            sx={{ fontSize: 16, fontWeight: 700 }}
          >
            BRE Decision
          </Typography>
        }
        maxWidth="lg"
      >
        <DecisionComparisonTable
          headers={breDecision.headers}
          rows={breRows}
        />
      </CustomDialog>
    </Box>
  );
};

export default DvtUser;