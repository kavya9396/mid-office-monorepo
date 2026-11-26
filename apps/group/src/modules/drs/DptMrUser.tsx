import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { CustomButton, CustomLoader, CustomSnackbar, DeleteIcon } from "@insurance-poc/ui";
import { drsRoutePath } from "@insurance-poc/routes";
import { clearDrsTaskIds, getDrsRoleLabel, readApiErrorMessage } from "@insurance-poc/utils";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { Medical } from "@insurance-poc/common/medical";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import {
  RequirementMgmt,
  isNewRequirement,
  type RequirementItem,
} from "@insurance-poc/common/requirement-mgmt";
import { getGroupDrsTaskConfig } from "../../config/drsTaskConfig";
import { useCompleteGroupTaskMutation } from "../../services/completeTaskApi";
import { useGetGroupDrsQuery, useSaveGroupDrsRequirementsMutation } from "../../services/drsApi";
import type { CardType } from "../../services/drsService";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildQuickLinkItems, withProposalFormLink } from "./guwQuickLinks";
import { requirementStatusOrder, requirementStatusVariants } from "./requirementData";

const DPT_MR_ROLE_TYPE = "GROUP_DATA_ENTRY_MR_TASK";

const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.dptMr;

/** Decision sent to the complete-task API when the Data Entry user submits (no decision field on this screen). */
const DPT_MR_SUBMIT_DECISION = "CLS_TASK";

/** Requirement save `lob` for Group. */
const GROUP_LOB = "G";

const CARD_TITLES: Record<CardType, string> = {
  APPLICATION: "Application Detail",
  SOURCE: "Source Detail",
  GROUP: "Group Detail",
  RISK: "Risk Detail",
};

/** The selected applicant travels in the router's navigation state, so the URL stays `/medical`. */
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
  return "Unable to load the Group DRS.";
}

/** Group DRS for `roleType` `GROUP_DATA_ENTRY_MR_TASK`. */
const DptMrUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { search, pathname, state: locationState } = useLocation();
  const isMedicalRoute = pathname.toLowerCase().includes("/drs/medical");
  const drsBasePath = applicationNo.length > 0 ? drsRoutePath(applicationNo) : "";
  const medicalPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "medical") : "";
  const currentApplicantId = readApplicantId(locationState);

  const drsTaskConfig = getGroupDrsTaskConfig(DPT_MR_ROLE_TYPE);
  const drsQueryArg = { applicationNo, ...drsTaskConfig };
  const drs = useGetGroupDrsQuery(drsQueryArg, {
    skip: applicationNo.length === 0,
    // Always hit the DRS API when the screen mounts instead of serving the cached result.
    refetchOnMountOrArgChange: true,
  });
  const [saveGroupDrsRequirements] = useSaveGroupDrsRequirementsMutation();
  const [completeGroupTask, completeGroupTaskState] = useCompleteGroupTaskMutation();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (completeGroupTaskState.isLoading) return;
    if (applicationNo.length === 0) {
      setSnackbarMessage("Application number is missing.");
      return;
    }
    const payload = { appNo: applicationNo, decision: DPT_MR_SUBMIT_DECISION, remarks: "" };
    try {
      await completeGroupTask(payload).unwrap();
      clearDrsTaskIds();
      void navigate("/inbox", { replace: true });
    } catch (reason: unknown) {
      setSnackbarMessage(readApiErrorMessage(reason) || "Unable to complete the task.");
    }
  };

  const handleSaveRequirements = async (updatedRequirements: RequirementItem[]) => {
    try {
      await saveGroupDrsRequirements({
        applicationNo,
        roleType: drsTaskConfig.roleType,
        screenType: drsTaskConfig.screenType,
        businessType: drsTaskConfig.businessType,
        lob: GROUP_LOB,
        requirements: updatedRequirements,
        initialRequirements: drs.data?.requirements,
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
      <Box sx={{ p: 2 }}>
        <Typography>{readQueryError(drs.error)}</Typography>
      </Box>
    );
  }

  const profileOptions = drs.data.profileOptions ?? (drs.data.memberTypes ?? []).map((type) => ({ label: type, value: type }));
  const applicants = drs.data.applicants ?? [];
  const selectedApplicant = applicants.find((applicant) => applicant.id === currentApplicantId) ?? applicants[0];

  const closeSubPage = () => {
    void navigate({ pathname: drsBasePath, search });
  };

  const detailCards = (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 2 }}>
      {drs.data.cardDetails.map((card) => (
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

  if (isMedicalRoute) {
    const medicalApplicants = applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }));
    return (
      <Medical
        summary={detailCards}
        applicants={medicalApplicants.length > 0 ? medicalApplicants : undefined}
        initialApplicantKey={currentApplicantId}
        onBack={closeSubPage}
        onSubmit={closeSubPage}
      />
    );
  }

  return (
    <Box sx={{ position: "relative", minHeight: "100%", p: 2, display: "flex", gap: 2, flexDirection: "column" }}>
      {detailCards}

      <QuickLinksModule
        items={buildQuickLinkItems(
          withProposalFormLink(quickLinksConfig.items, drs.data.quickLinks.proposalFormLink),
          (message) => setSnackbarMessage(message),
        )}
        applicationNo={applicationNo}
        roleType={getDrsRoleLabel() || params.get("role")?.trim() || quickLinksConfig.defaultRoleType}
        onNavigate={(path) => {
          void navigate(path);
        }}
        onNotify={(message) => setSnackbarMessage(message)}
        title="Quick Links"
      />

      <RequirementMgmt
        applicationKey={applicationNo}
        requirements={drs.data.requirements}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
        fieldOptions={{
          profile: profileOptions.length > 0 ? profileOptions : undefined,
        }}
        addButton={{ label: "+ Add Requirement" }}
        rowActions={[
          {
            key: "delete",
            label: "Remove requirement",
            icon: <DeleteIcon width={16} height={16} />,
            tone: "danger",
            hidden: (row) => !isNewRequirement(row),
            onClick: (_row, { removeRow }) => removeRow(),
          },
        ]}
        onSave={handleSaveRequirements}
      />

      <Box sx={{ display: "flex", justifyContent: "center", gap: "15px", py: 1 }}>
        <CustomButton
          onClick={() => {
            void navigate(
              { pathname: medicalPath, search },
              { state: { applicantId: selectedApplicant?.id } satisfies ApplicantRouteState },
            );
          }}
        >
          View Medical
        </CustomButton>
        <CustomButton onClick={() => void handleSubmit()} disabled={completeGroupTaskState.isLoading}>
          Submit
        </CustomButton>
      </Box>

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />
    </Box>
  );
};

export default DptMrUser;
