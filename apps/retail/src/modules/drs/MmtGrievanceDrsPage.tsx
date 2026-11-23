import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { GrievanceHistory, type GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import { MmtGrievanceDecision } from "@insurance-poc/common/mmt-grievance-decision";
import { CustomBox, CustomLoader, CustomSnackbar } from "@insurance-poc/ui";
import { retailPaths } from "@insurance-poc/routes";
import { getDrsRoleType, readApiErrorMessage } from "@insurance-poc/utils";
import { getRetailDrsTaskConfig } from "../../config/drsTaskConfig";
import { useGetRetailDrsQuery } from "../../services/drsApi";
import {
  useGetRetailMmtGrievancesQuery,
  useSaveRetailMmtGrievancesMutation,
} from "../../services/mmtGrievanceService";

const MMT_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  skipFieldNames: ["Name", "App No.", "App No"],
  rowLabels: { 2: "Riders" },
};

/** MMT Grievance DRS — DRS POST for the shell, then grievance fetch and save. */
export function MmtGrievanceDrsPage() {
  const navigate = useNavigate();
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const roleType = getDrsRoleType().trim();
  const drsTaskConfig = getRetailDrsTaskConfig(roleType || "MMT_TASK");

  const drs = useGetRetailDrsQuery(
    {
      applicationNo,
      roleType: roleType || drsTaskConfig.roleType,
      screenType: "MMT",
      businessType: drsTaskConfig.businessType,
    },
    { skip: applicationNo.length === 0 },
  );

  const memberContext = drs.data?.memberContext;
  const grievances = useGetRetailMmtGrievancesQuery(memberContext!, {
    skip: !memberContext || memberContext.applicationNo.length === 0,
  });

  const [saveGrievances, saveState] = useSaveRetailMmtGrievancesMutation();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  async function handleSubmit(rows: GrievanceHistoryRow[]): Promise<void> {
    if (!memberContext) return;
    try {
      const result = await saveGrievances({ context: memberContext, rows }).unwrap();
      setSnackbar({ open: true, message: result.message, severity: "success" });
      navigate(retailPaths.inbox);
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message: readApiErrorMessage(error, "Unable to save grievances."),
        severity: "error",
      });
    }
  }

  const loading = drs.isLoading || grievances.isLoading;
  const drsError =
    drs.isError && drs.error ? readApiErrorMessage(drs.error, "Unable to load MMT DRS details.") : "";
  const grievanceError =
    grievances.isError && grievances.error
      ? readApiErrorMessage(grievances.error, "Unable to load grievances.")
      : "";

  return (
    <CustomBox
      component="main"
      data-testid="mmt-grievance-drs-main"
      sx={{ minHeight: "100%", background: "#fff8f3" }}
    >
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />

      {applicationNo.length === 0 ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          Application number is missing.
        </CustomBox>
      ) : null}

      {loading ? <CustomLoader message="Loading grievance details" /> : null}

      {!loading && drs.isSuccess && drs.data ? (
        <>
          <ApplicantBanner
            name={drs.data.applicantName}
            applicationNo={drs.data.applicationNo}
            rowDetails={drs.data.rowDetails}
            rowDetailsOptions={MMT_BANNER_OPTIONS}
          />
          <CustomBox sx={{ px: 0.5, pb: 1.5, display: "grid", gap: 1.25 }}>
            <GrievanceHistory
              title={drs.data.grievanceHistoryTitle}
              columns={drs.data.grievanceHistoryColumns}
              rows={grievances.data?.grievanceHistory ?? []}
            />
            <MmtGrievanceDecision
              title={drs.data.tpaGrievanceTitle}
              columns={drs.data.tpaGrievanceColumns}
              rows={grievances.data?.openGrievances ?? []}
              submitting={saveState.isLoading}
              onSubmit={(rows) => {
                void handleSubmit(rows);
              }}
            />
          </CustomBox>
        </>
      ) : null}

      {drsError.length > 0 ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          {drsError}
        </CustomBox>
      ) : null}

      {grievanceError.length > 0 ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          {grievanceError}
        </CustomBox>
      ) : null}
    </CustomBox>
  );
}

export default MmtGrievanceDrsPage;
