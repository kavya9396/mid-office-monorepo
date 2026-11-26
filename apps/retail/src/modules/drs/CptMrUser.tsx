import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CustomBox,
  CustomButton,
  CustomLoader,
  CustomSnackbar,
  CustomTypography,
  DeleteIcon,
} from "@insurance-poc/ui";
import { clearDrsTaskIds, getDrsRoleLabel, readApiErrorMessage } from "@insurance-poc/utils";
import { QuickLinksModule, type QuickLinkItem } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import type { LifeAssuredTab } from "@insurance-poc/common/life-assured";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import {
  RequirementMgmt,
  isNewRequirement,
  type RequirementItem,
} from "@insurance-poc/common/requirement-mgmt";
import { getRetailDrsTaskConfig } from "../../config/drsTaskConfig";
import { useCompleteRetailTaskMutation } from "../../services/completeTaskApi";
import { useGetRetailDrsQuery, useSaveRetailDrsRequirementsMutation } from "../../services/drsApi";
import { requirementStatusOrder, requirementStatusVariants } from "./requirementData";

/** Row 0 is the product / loan line, row 1 the policy / agent line, row 2 the rider sums assured. */
const CPT_MR_BANNER_OPTIONS: RowDetailsOptions = {
  rowLabels: { 2: "Riders" },
};

const CPT_MR_ROLE_TYPE = "CPT_DATA_ENTRY_MR_TASK";

const CPT_MR_DEFAULT_ROLE_LABEL = "CPT Data Entry MR User";

/** Decision sent to the complete-task API when the Data Entry user submits (no decision field on this screen). */
const CPT_MR_SUBMIT_DECISION = "CLS_TASK";

/** Only Applicant Profile is shown in Quick Links on the CPT MR DRS. */
const CPT_MR_QUICK_LINKS: QuickLinkItem[] = [{ id: "applicant-profile", label: "Applicant Profile" }];

/** Applicant Profile popup tabs (same set as the CVT DRS life assured profile). */
const CPT_MR_PROFILE_TABS: LifeAssuredTab[] = ["imageDetails", "personalKyc", "contactAddress", "paymentPayout"];

/** Requirement save `lob` for Retail. */
const RETAIL_LOB = "R";

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

/** Retail DRS for `roleType` `CPT_DATA_ENTRY_MR_TASK`. */
const CptMrUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const navigate = useNavigate();

  const drsTaskConfig = getRetailDrsTaskConfig(CPT_MR_ROLE_TYPE);
  const drsQueryArg = { applicationNo, ...drsTaskConfig };
  const drs = useGetRetailDrsQuery(drsQueryArg, {
    skip: applicationNo.length === 0,
    // Always hit the DRS API when the screen mounts instead of serving the cached result.
    refetchOnMountOrArgChange: true,
  });
  const [saveRetailDrsRequirements] = useSaveRetailDrsRequirementsMutation();
  const [completeRetailTask, completeRetailTaskState] = useCompleteRetailTaskMutation();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);

  const handleSubmit = async () => {
    if (completeRetailTaskState.isLoading) return;
    if (applicationNo.length === 0) {
      setSnackbarMessage("Application number is missing.");
      return;
    }
    const payload = { appNo: applicationNo, decision: CPT_MR_SUBMIT_DECISION, remarks: "" };
    try {
      await completeRetailTask(payload).unwrap();
      clearDrsTaskIds();
      void navigate("/inbox", { replace: true });
    } catch (reason: unknown) {
      setSnackbarMessage(readApiErrorMessage(reason) || "Unable to complete the task.");
    }
  };

  const handleSaveRequirements = async (updatedRequirements: RequirementItem[]) => {
    try {
      await saveRetailDrsRequirements({
        applicationNo,
        roleType: drsTaskConfig.roleType,
        screenType: drsTaskConfig.screenType,
        businessType: drsTaskConfig.businessType,
        lob: RETAIL_LOB,
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
      <CustomBox sx={{ p: 2 }}>
        <CustomTypography>{readQueryError(drs.error)}</CustomTypography>
      </CustomBox>
    );
  }

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
      <ApplicantBanner
        applicationNo={applicationNo}
        rowDetails={drs.data.rowDetails}
        rowDetailsOptions={CPT_MR_BANNER_OPTIONS}
      />

      <QuickLinksModule
        items={CPT_MR_QUICK_LINKS}
        applicationNo={applicationNo}
        roleType={getDrsRoleLabel() || CPT_MR_DEFAULT_ROLE_LABEL}
        onNavigate={(path) => {
          void navigate(path);
        }}
        onNotify={(message) => setSnackbarMessage(message)}
        title="Quick Links"
        dialogItemIds={["applicant-profile"]}
        onDialogItemClick={() => setApplicantProfileOpen(true)}
      />

      <ApplicantProfile
        applicants={drs.data.applicants}
        memberTabs
        variant="guw"
        tabs={CPT_MR_PROFILE_TABS}
        open={applicantProfileOpen}
        onClose={() => setApplicantProfileOpen(false)}
      />

      <RequirementMgmt
        applicationKey={applicationNo}
        requirements={drs.data.requirements}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
        fieldOptions={{
          profile: drs.data.profileOptions,
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

      <CustomBox sx={{ display: "flex", justifyContent: "center", gap: "15px", py: 1 }}>
        <CustomButton>View Medical</CustomButton>
        <CustomButton onClick={() => void handleSubmit()} disabled={completeRetailTaskState.isLoading}>
          Submit
        </CustomButton>
      </CustomBox>

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />
    </CustomBox>
  );
};

export default CptMrUser;
