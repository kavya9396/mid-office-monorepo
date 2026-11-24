import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { SxProps, Theme } from "@mui/material";
import {
  clearDrsTaskIds,
  getDrsRoleLabel,
  getSessionUser,
  readApiErrorMessage,
} from "@insurance-poc/utils";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomLoader,
  CustomSnackbar,
  CustomTextField,
  CustomTypography,
  EyeIcon,
} from "@insurance-poc/ui";
import { ApplicantBanner } from "@insurance-poc/common/applicant-banner";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { useCompleteGroupTaskMutation } from "../../services/completeTaskApi";
import {
  useGetPreIssuanceDvtDrsQuery,
  useSavePreIssuanceDvtDecisionMutation,
} from "../../services/preIssuanceDvtApi";
import type {
  PreIssuanceDvtDecision,
  ServicingChangeField,
  ServicingHistoryRow,
  ServicingRider,
} from "../../services/preIssuanceDvtService";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildQuickLinkItems, withProposalFormLink } from "./guwQuickLinks";

const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.preIssuanceDvt;

type ServicingDecision = "Accept" | "Reject";

/* -------------------------------------------------------------------------- */
/* sx copied verbatim from design-reference/.../Pre issuance CVT/              */
/* drs-screen-prototype.html (only #e45f14 -> theme.palette.primary.main).     */
/* -------------------------------------------------------------------------- */

const primaryMain = (theme: Theme) => theme.palette.primary.main;

const servicingCardSx: SxProps<Theme> = {
  mt: "10px",
  border: "1px solid #eadfd9",
  borderRadius: "10px",
  background: "white",
  overflow: "hidden",
};

const servicingHeadingSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  background: "#fff3e9",
  color: "#5b261c",
  fontSize: "13px",
  fontWeight: 900,
  padding: "11px 14px",
  borderBottom: "1px solid #eadfd9",
};

const servicingOverviewSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 0,
  mb: "14px",
  "@media (max-width:720px)": { gridTemplateColumns: "repeat(2, 1fr)" },
};

const servicingMetaSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
  padding: "2px 14px",
  "&:first-of-type": { paddingLeft: 0 },
  "&:not(:last-of-type)::after": {
    content: '"|"',
    marginLeft: "auto",
    color: "#d7bdb2",
    fontWeight: 400,
  },
  "& span": { display: "inline", color: "#82736b", fontSize: "10px", whiteSpace: "nowrap" },
  "& strong": { fontSize: "12px", color: "#332d2a", whiteSpace: "nowrap" },
  "@media (max-width:720px)": { "&:nth-of-type(odd)": { paddingLeft: 0 } },
};

const servicingTableWrapSx: SxProps<Theme> = {
  border: "1px solid #e4d5cc",
  borderRadius: "10px",
  overflow: "hidden",
  background: "#fff",
};

const servicingProfileTitleSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 14px",
  borderBottom: "1px solid #e4d5cc",
  background: "#fff3e9",
  color: "#5b261c",
  fontSize: "12px",
  fontWeight: 900,
};

const servicingTableSx: SxProps<Theme> = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "11px",
  tableLayout: "fixed",
  minWidth: "760px",
  "& th": {
    background: "#ffead7",
    color: "#5b261c",
    padding: "7px 10px",
    textAlign: "left",
    fontWeight: 900,
  },
  "& td": {
    padding: "7px 10px",
    borderTop: "1px solid #eee6e1",
    verticalAlign: "middle",
    overflowWrap: "anywhere",
  },
  "& td:first-of-type": { color: "#453731" },
  "& tr:nth-of-type(even) td": { background: "#fffaf7" },
  "& th:nth-of-type(1)": { width: "19%" },
  "& th:nth-of-type(2)": { width: "21%" },
  "& th:nth-of-type(3), & th:nth-of-type(4)": { width: "30%" },
};

const changeTypeCellSx: SxProps<Theme> = {
  background: "#fff3e9 !important",
  color: "#7b3924",
  fontWeight: 900,
  verticalAlign: "top",
};

const servicingOldSx: SxProps<Theme> = { color: "#77706c" };

const servicingNewSx: SxProps<Theme> = { fontWeight: 800, color: "#9a2529" };

const servicingActionsSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "9px",
  mt: "14px",
  "@media (max-width:720px)": { flexWrap: "wrap" },
};

const servicingButtonBaseSx = {
  minWidth: "96px",
  borderRadius: "7px",
  padding: "8px 18px",
  fontSize: "11px",
  fontWeight: 800,
  "&.Mui-disabled": { opacity: 0.45, cursor: "not-allowed", pointerEvents: "auto" },
};

const servicingAcceptSx: SxProps<Theme> = {
  ...servicingButtonBaseSx,
  border: "1px solid #c94f0d",
  background: primaryMain,
  color: "white",
  "&:hover": { background: "#c94f0d" },
  "&.Mui-disabled": {
    ...servicingButtonBaseSx["&.Mui-disabled"],
    color: "white",
    background: primaryMain,
  },
};

const servicingRejectSx: SxProps<Theme> = {
  ...servicingButtonBaseSx,
  border: "1px solid #b3262e",
  color: "#b3262e",
  background: "#fff",
  "&:hover": { background: "#fff", color: "#b3262e", borderColor: "#b3262e" },
  "&.Mui-disabled": {
    ...servicingButtonBaseSx["&.Mui-disabled"],
    border: "1px solid #b3262e",
    color: "#b3262e",
    background: "#fff",
  },
};

const servicingHistorySx: SxProps<Theme> = {
  border: "1px solid #d7bdb2",
  borderRadius: "7px",
  background: "#fff",
  color: "#7b3924",
  padding: "6px 14px",
  fontSize: "11px",
  fontWeight: 800,
  "&:hover": { background: "#fff8f3", color: "#7b3924", borderColor: "#d7bdb2" },
};

const servicingStatusSx: SxProps<Theme> = {
  fontWeight: 800,
  color: "#6b625d",
  fontSize: "11px",
  minHeight: "15px",
};

/* History dialog table */

const preIssuanceTableWrapSx: SxProps<Theme> = {
  overflow: "auto",
  border: "1px solid #eadfd9",
  borderRadius: "10px",
  background: "#fff",
};

const preIssuanceTableSx: SxProps<Theme> = {
  width: "100%",
  minWidth: "860px",
  borderCollapse: "collapse",
  fontSize: "11px",
  "& th, & td": {
    padding: "11px 12px",
    borderRight: "1px solid #eee4df",
    borderBottom: "1px solid #eee4df",
    textAlign: "left",
    verticalAlign: "middle",
  },
  "& th": {
    background: "#ffead7",
    color: "#5b261c",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  "& tr:last-of-type td": { borderBottom: 0 },
  "& th:nth-of-type(1)": { width: "17%" },
  "& th:nth-of-type(2)": { width: "15%" },
  "& th:nth-of-type(3), & th:nth-of-type(4)": { width: "8%" },
  "& th:nth-of-type(5)": { width: "25%" },
  "& th:nth-of-type(6)": { width: "15%" },
  "& th:last-of-type, & td:last-of-type": { width: "12%", textAlign: "center", borderRight: 0 },
};

const viewChangeDetailsSx: SxProps<Theme> = {
  display: "inline-grid",
  placeItems: "center",
  width: "28px",
  height: "28px",
  minWidth: "28px",
  padding: 0,
  border: (theme) => `1px solid ${theme.palette.primary.main}`,
  borderRadius: "50%",
  background: "#fff",
  color: "#c94f0d",
  "&:hover": {
    background: "#fff0e5",
    color: "#c94f0d",
    border: (theme: Theme) => `1px solid ${theme.palette.primary.main}`,
  },
  "& svg": { width: "16px", height: "16px" },
  "& svg path": { fill: "currentColor" },
};

/* Change details dialog */

const changeDetailsPanelSx: SxProps<Theme> = {
  overflow: "hidden",
  border: "1px solid #eadfd9",
  borderRadius: "10px",
  background: "#fff",
};

const changeDetailsContextSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "9px 12px",
  borderBottom: "1px solid #eadfd9",
  background: "#fff8f3",
  color: "#6b625d",
  fontSize: "10px",
  "& strong": { color: "#7b3924", fontSize: "11px" },
};

const changeDetailsTableSx: SxProps<Theme> = {
  width: "100%",
  tableLayout: "fixed",
  borderCollapse: "collapse",
  fontSize: "11px",
  "& th, & td": {
    padding: "10px 12px",
    overflowWrap: "anywhere",
    border: "1px solid #eee4df",
    textAlign: "left",
  },
  "& th": { background: "#ffead7", color: "#5b261c", fontWeight: 900 },
};

const riderBeforeAfterSx: SxProps<Theme> = { padding: "12px", display: "grid", gap: "16px" };

const riderStateSectionSx: SxProps<Theme> = {
  border: "1px solid #eadfd9",
  borderRadius: "8px",
  overflow: "hidden",
};

const riderTableTitleSx: SxProps<Theme> = {
  padding: "11px 13px",
  fontWeight: 800,
  color: "#5b261c",
  background: "#fffaf6",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const riderCountSx: SxProps<Theme> = {
  fontSize: "10px",
  background: "white",
  border: "1px solid #e4d5cc",
  color: "#7b3924",
  borderRadius: "12px",
  padding: "3px 10px",
  whiteSpace: "nowrap",
};

const riderStateTableSx: SxProps<Theme> = {
  ...(changeDetailsTableSx as object),
  minWidth: "760px",
  tableLayout: "auto",
  "& th, & td": {
    padding: "9px 10px",
    overflowWrap: "anywhere",
    border: "1px solid #eee4df",
    textAlign: "left",
  },
  "& th": { background: "#ffead7", color: "#5b261c", fontWeight: 900 },
  "& th:first-of-type": { width: "54px" },
  "& th:nth-of-type(2)": { width: "28%" },
  "& th:nth-of-type(3), & th:nth-of-type(4), & th:nth-of-type(5)": { width: "22%" },
  "& td:first-of-type": { textAlign: "center" },
  "& tbody tr:nth-of-type(even)": { background: "#fffaf7" },
};

const decisionErrorSx: SxProps<Theme> = { color: "#b3262e", fontSize: "12px" };

function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to load the Pre Issuance DVT DRS.";
}

function RiderStateSection({
  title,
  riders,
}: Readonly<{ title: string; riders: readonly ServicingRider[] }>) {
  return (
    <CustomBox component="section" sx={riderStateSectionSx}>
      <CustomBox sx={riderTableTitleSx}>
        {title} <CustomBox component="span" sx={riderCountSx}>{riders.length} Riders</CustomBox>
      </CustomBox>
      <CustomBox sx={{ width: "100%", overflowX: "auto" }}>
        <CustomBox component="table" sx={riderStateTableSx}>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Rider Code</th>
              <th>Sum Assured</th>
              <th>Policy Term</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider, index) => (
              <tr key={`${rider.code}-${index}`}>
                <td>{index + 1}</td>
                <td>{rider.code}</td>
                <td>{rider.sumAssured}</td>
                <td>{rider.policyTerm}</td>
                <td>{rider.status}</td>
              </tr>
            ))}
          </tbody>
        </CustomBox>
      </CustomBox>
    </CustomBox>
  );
}

function ChangeFieldRows({ changes }: Readonly<{ changes: readonly ServicingChangeField[] }>) {
  return (
    <>
      {changes.map((change, index) => (
        <tr key={`${change.name}-${index}`}>
          <td>{change.name}</td>
          <td>{change.oldValue}</td>
          <td>{change.newValue}</td>
        </tr>
      ))}
    </>
  );
}

/** Group DRS for the `PRE_ISSUANCE_DVT_TASK` role: Pre Issuance Servicing Details, History and Accept / Reject. */
const PreIssuanceDvtUser = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { applicationNo: applicationNoParam } = useParams();
  const requestedApplicationNo = applicationNoParam?.trim() ?? "";
  const callId = params.get("callId")?.trim() ?? "";
  const drs = useGetPreIssuanceDvtDrsQuery(
    { applicationNo: requestedApplicationNo, callId },
    // Always hit the DRS API on mount; RTK Query would otherwise serve the cached result.
    { skip: requestedApplicationNo.length === 0, refetchOnMountOrArgChange: true },
  );

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [changeDetailsRow, setChangeDetailsRow] = useState<ServicingHistoryRow | null>(null);
  const [pendingDecision, setPendingDecision] = useState<ServicingDecision | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [savePreIssuanceDvtDecision, saveDecisionState] = useSavePreIssuanceDvtDecisionMutation();
  const [completeGroupTask, completeGroupTaskState] = useCompleteGroupTaskMutation();
  // Stays true after both APIs succeed, until the page is replaced by the inbox.
  const [redirecting, setRedirecting] = useState(false);
  const submitting = saveDecisionState.isLoading || completeGroupTaskState.isLoading || redirecting;

  const openDecisionDialog = (decision: ServicingDecision) => {
    setRejectRemarks("");
    setDecisionError("");
    setPendingDecision(decision);
  };

  const closeDecisionDialog = () => {
    if (!submitting) setPendingDecision(null);
  };

  /**
   * Confirm Accept / Confirm Reject:
   * 1. save the decision (`VITE_PRE_ISSUANCE_SERVICE_SAVE`),
   * 2. complete the task (`VITE_GROUP_COMPLETE_TASK_API`) — only after the save succeeded,
   * 3. clear the task context, show a success notice and, after 700 ms, replace the page with the inbox.
   *    As in GUW (`GuwUwPanel`), `replaceUrl` is a full page load, so the inbox cache is dropped and the inbox
   *    fetches the list afresh.
   */
  const confirmDecision = async () => {
    if (!pendingDecision || submitting) return;
    const remarks = pendingDecision === "Reject" ? rejectRemarks.trim() : "";
    if (pendingDecision === "Reject" && remarks.length === 0) {
      setDecisionError("Rejection remarks are required.");
      return;
    }
    const decision: PreIssuanceDvtDecision = pendingDecision === "Accept" ? "ACCEPT" : "REJECT";
    const decisionCallId = callId || drs.data?.callId || "";
    setDecisionError("");
    try {
      await savePreIssuanceDvtDecision({
        callId: decisionCallId,
        applicationNo: requestedApplicationNo,
        decision,
        userId: getSessionUser()?.username ?? "",
        rejectionRemarks: remarks,
      }).unwrap();
      await completeGroupTask({ appNo: requestedApplicationNo, decision, remarks }).unwrap();
      clearDrsTaskIds();
      setRedirecting(true);
      setPendingDecision(null);
      setSnackbarMessage("Decision submitted successfully");
      window.setTimeout(() => {
        replaceUrl(groupPaths.inbox);
      }, 700);
    } catch (reason: unknown) {
      const apiMessage = readApiErrorMessage(reason);
      setDecisionError(apiMessage.length > 0 ? apiMessage : "Unable to submit the decision.");
    }
  };

  if (requestedApplicationNo.length === 0) {
    return (
      <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
        Application number is missing.
      </CustomBox>
    );
  }

  if (drs.isLoading) {
    return <CustomLoader message="Loading application" />;
  }

  if (drs.isError) {
    return (
      <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
        <CustomTypography>{readQueryError(drs.error)}</CustomTypography>
      </CustomBox>
    );
  }

  if (!drs.data) {
    return (
      <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
        No Pre Issuance servicing record was found for application {requestedApplicationNo}.
      </CustomBox>
    );
  }

  const { servicing, history, historyTitle, bannerRows, quickLinks } = drs.data;
  const applicationNo = requestedApplicationNo || drs.data.applicationNo;

  return (
    <CustomBox
      data-testid="group-pre-issuance-dvt-drs-main"
      sx={{ position: "relative", minHeight: "100%", background: "#fff8f3", p: "6px 4px 12px" }}
    >
      <ApplicantBanner applicationNo={applicationNo} rows={bannerRows} />

      <CustomBox
        sx={{
          p: "6px",
          border: "1px solid #f1d8c8",
          borderRadius: "6px",
          background: "#fff8f3",
        }}
      >
        <CustomBox component="section" aria-label={servicing.title} sx={servicingCardSx}>
          <CustomBox sx={servicingHeadingSx}>
            <span>{servicing.title}</span>
            <CustomButton
              variant="outlined"
              data-testid="servicing-history"
              sx={servicingHistorySx}
              onClick={() => setHistoryOpen(true)}
            >
              History ({history.length})
            </CustomButton>
          </CustomBox>

          <CustomBox sx={{ padding: "14px" }}>
            <CustomBox sx={servicingOverviewSx}>
              <CustomBox sx={servicingMetaSx}>
                <span>Service ID</span>
                <strong>{servicing.serviceId}</strong>
              </CustomBox>
              <CustomBox sx={servicingMetaSx}>
                <span>CT</span>
                <strong>{servicing.ct}</strong>
              </CustomBox>
              <CustomBox sx={servicingMetaSx}>
                <span>ST</span>
                <strong>{servicing.st}</strong>
              </CustomBox>
              <CustomBox sx={servicingMetaSx}>
                <span>Received Date</span>
                <strong>{servicing.receivedDate}</strong>
              </CustomBox>
            </CustomBox>

            <CustomBox sx={servicingTableWrapSx}>
              <CustomBox sx={servicingProfileTitleSx}>{servicing.memberLabel}</CustomBox>
              <CustomBox sx={{ overflowX: "auto" }}>
                <CustomBox component="table" sx={servicingTableSx}>
                  <thead>
                    <tr>
                      <th>Change Type</th>
                      <th>Field Name</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicing.groups.flatMap((group, groupIndex) =>
                      group.fields.map((field, fieldIndex) => {
                        const rowSpanProps = { rowSpan: group.fields.length };
                        const groupStartSx: SxProps<Theme> | undefined =
                          fieldIndex === 0 && groupIndex > 0
                            ? { "& td": { borderTop: "2px solid #e4d5cc" } }
                            : undefined;
                        return (
                          <CustomBox
                            component="tr"
                            key={`${group.changeType}-${field.name}-${fieldIndex}`}
                            sx={groupStartSx}
                          >
                            {fieldIndex === 0 && (
                              <CustomBox component="td" sx={changeTypeCellSx} {...rowSpanProps}>
                                {group.changeType}
                              </CustomBox>
                            )}
                            <td>{field.name}</td>
                            <CustomBox component="td" sx={servicingOldSx}>
                              {field.oldValue}
                            </CustomBox>
                            <CustomBox component="td" sx={servicingNewSx}>
                              {field.newValue}
                            </CustomBox>
                          </CustomBox>
                        );
                      }),
                    )}
                  </tbody>
                </CustomBox>
              </CustomBox>
            </CustomBox>

            {(servicing.oldRiders.length > 0 || servicing.newRiders.length > 0) && (
              <CustomBox sx={{ ...(riderBeforeAfterSx as object), padding: "12px 0 0" }}>
                <RiderStateSection title="Old Value — Before Change" riders={servicing.oldRiders} />
                <RiderStateSection title="New Value — After Change" riders={servicing.newRiders} />
              </CustomBox>
            )}

            <CustomBox sx={servicingActionsSx}>
              <CustomBox component="span" aria-live="polite" sx={servicingStatusSx}>
                {submitting ? "Submitting…" : ""}
              </CustomBox>
              <CustomButton
                variant="outlined"
                data-testid="servicing-reject"
                sx={servicingRejectSx}
                disabled={submitting}
                onClick={() => openDecisionDialog("Reject")}
              >
                Reject
              </CustomButton>
              <CustomButton
                data-testid="servicing-accept"
                sx={servicingAcceptSx}
                disabled={submitting}
                onClick={() => openDecisionDialog("Accept")}
              >
                Accept
              </CustomButton>
            </CustomBox>
          </CustomBox>
        </CustomBox>
      </CustomBox>

      <QuickLinksModule
        items={buildQuickLinkItems(
          withProposalFormLink(quickLinksConfig.items, quickLinks.proposalFormLink),
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

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <CustomDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={historyTitle}
        paperSx={{ width: "min(1100px, 100%)", maxWidth: "none" }}
      >
        <CustomBox sx={preIssuanceTableWrapSx}>
          <CustomBox component="table" sx={preIssuanceTableSx}>
            <thead>
              <tr>
                <th>Call Log Date</th>
                <th>Service Call ID</th>
                <th>CT</th>
                <th>ST</th>
                <th>Call Details</th>
                <th>Source</th>
                <th>View Change Details</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{row.callDate}</td>
                  <td>{row.serviceId}</td>
                  <td>{row.ct}</td>
                  <td>{row.st}</td>
                  <td>{row.callDetails}</td>
                  <td>{row.source}</td>
                  <td>
                    <CustomButton
                      variant="outlined"
                      aria-label={`View change details for ${row.serviceId}`}
                      title="View change details"
                      sx={viewChangeDetailsSx}
                      onClick={() => setChangeDetailsRow(row)}
                    >
                      <EyeIcon />
                    </CustomButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </CustomBox>
        </CustomBox>
      </CustomDialog>

      <CustomDialog
        open={changeDetailsRow !== null}
        onClose={() => setChangeDetailsRow(null)}
        title={changeDetailsRow?.st}
        paperSx={{ width: "min(1100px, 100%)", maxWidth: "none" }}
      >
        {changeDetailsRow && (
          <CustomBox sx={changeDetailsPanelSx}>
            <CustomBox sx={changeDetailsContextSx}>
              <strong>{changeDetailsRow.serviceId}</strong>
              <span>{changeDetailsRow.callDate}</span>
            </CustomBox>
            <CustomBox component="table" sx={changeDetailsTableSx}>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                <ChangeFieldRows changes={changeDetailsRow.changes} />
              </tbody>
            </CustomBox>
          </CustomBox>
        )}
      </CustomDialog>

      <CustomDialog
        open={pendingDecision !== null}
        onClose={closeDecisionDialog}
        title={`${pendingDecision ?? ""} Servicing Request`}
        actions={
          <>
            <CustomButton
              variant="outlined"
              data-testid="service-decision-cancel"
              sx={{ ...(servicingRejectSx as object), padding: "7px 16px" }}
              disabled={submitting}
              onClick={closeDecisionDialog}
            >
              Cancel
            </CustomButton>
            <CustomButton
              data-testid="service-decision-confirm"
              disabled={submitting}
              onClick={() => {
                void confirmDecision();
              }}
            >
              Confirm {pendingDecision}
            </CustomButton>
          </>
        }
      >
        <CustomTypography sx={{ fontSize: "12px", mb: 1 }}>
          Do you want to {pendingDecision?.toLowerCase()} all displayed changes for{" "}
          <strong>{servicing.memberLabel}</strong>?
        </CustomTypography>
        {pendingDecision === "Reject" && (
          <CustomTextField
            fullWidth
            multiline
            minRows={3}
            labelText="Rejection Remarks"
            mandatory
            placeholder="Enter rejection remarks"
            value={rejectRemarks}
            onChange={(event) => setRejectRemarks(event.target.value)}
            htmlInputProps={{ "aria-label": "Rejection Remarks" }}
          />
        )}
        <CustomTypography role="alert" sx={decisionErrorSx}>
          {decisionError}
        </CustomTypography>
      </CustomDialog>
    </CustomBox>
  );
};

export default PreIssuanceDvtUser;
