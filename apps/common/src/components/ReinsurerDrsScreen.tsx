import { useEffect, useState } from "react";
import { CustomBox, CustomLoader, CustomSnackbar } from "@insurance-poc/ui";
import { ApplicantBanner, toBannerRows } from "./Header/ApplicantBanner";
import {
  ReinsurerPanel,
  type BackToCuwValues,
  type ReinsurerDecisionValues,
  type ReinsurerDrsRecord,
} from "./ReinsurerPanel";

type ScreenState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; record: ReinsurerDrsRecord };

type SnackbarState = { message: string; severity: "success" | "error" };

export type ReinsurerDrsScreenProps = {
  applicationNo: string;
  /** Resolves `null` when the application has no reinsurer record. */
  fetchRecord: (applicationNo: string) => Promise<ReinsurerDrsRecord | null>;
  /** Returns the success message shown in the snackbar. */
  submitBackToUw: (applicationNo: string, values: BackToCuwValues) => Promise<string>;
  /** Returns the success message; the screen then calls `onExit`. */
  submitSaveClose: (applicationNo: string, values: ReinsurerDecisionValues[]) => Promise<string>;
  /** "Back TO CUW" (Retail) / "Back TO GUW" (Group). */
  backToLabel: string;
  /** Called after Save & close succeeded and its message was dismissed. */
  onExit: () => void;
};

const readMessage = (reason: unknown, fallback: string): string =>
  reason instanceof Error && reason.message.length > 0 ? reason.message : fallback;

export function ReinsurerDrsScreen({
  applicationNo,
  fetchRecord,
  submitBackToUw,
  submitSaveClose,
  backToLabel,
  onExit,
}: Readonly<ReinsurerDrsScreenProps>) {
  const [state, setState] = useState<ScreenState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [exitAfterSnackbar, setExitAfterSnackbar] = useState(false);

  useEffect(() => {
    if (!applicationNo) {
      setState({ kind: "missing-id" });
      return;
    }
    let active = true;
    setState({ kind: "loading" });
    fetchRecord(applicationNo)
      .then((record) => {
        if (active) setState(record ? { kind: "ready", record } : { kind: "not-found" });
      })
      .catch((reason: unknown) => {
        if (active) setState({ kind: "error", message: readMessage(reason, "Unable to load reinsurer details.") });
      });
    return () => {
      active = false;
    };
  }, [applicationNo, fetchRecord]);

  const handleBackToUw = async (values: BackToCuwValues): Promise<boolean> => {
    try {
      const message = await submitBackToUw(applicationNo, values);
      setSnackbar({ message, severity: "success" });
      return true;
    } catch (reason: unknown) {
      setSnackbar({ message: readMessage(reason, `Unable to submit ${backToLabel} details.`), severity: "error" });
      return false;
    }
  };

  const handleSaveClose = async (values: ReinsurerDecisionValues[]) => {
    setSubmitting(true);
    try {
      const message = await submitSaveClose(applicationNo, values);
      setExitAfterSnackbar(true);
      setSnackbar({ message, severity: "success" });
    } catch (reason: unknown) {
      setSnackbar({ message: readMessage(reason, "Unable to save reinsurer details."), severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(null);
    if (exitAfterSnackbar) {
      setExitAfterSnackbar(false);
      onExit();
    }
  };

  const alertSx = { p: 2, color: "#302a27", fontSize: "12px" };

  return (
    <CustomBox
      component="main"
      data-testid="reinsurer-drs-main"
      sx={{
        position: "relative",
        minHeight: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#fff8f3",
        boxSizing: "border-box",
      }}
    >
      {state.kind === "loading" ? <CustomLoader message="Loading reinsurer details" /> : null}
      {state.kind === "missing-id" ? (
        <CustomBox role="alert" sx={alertSx}>
          Application number is missing.
        </CustomBox>
      ) : null}
      {state.kind === "not-found" ? (
        <CustomBox role="alert" sx={alertSx}>
          No reinsurer record was found for application {applicationNo}.
        </CustomBox>
      ) : null}
      {state.kind === "error" ? (
        <CustomBox role="alert" sx={alertSx}>
          {state.message}
        </CustomBox>
      ) : null}
      {state.kind === "ready" ? (
        <>
          <ApplicantBanner
            applicationNo={state.record.applicationNo}
            name={state.record.applicantName}
            rows={toBannerRows(state.record.bannerLines)}
            showAvatar
          />
          <ReinsurerPanel
            rows={state.record.reinsurerRows}
            documents={state.record.documents}
            remarks={state.record.remarks}
            backToLabel={backToLabel}
            submitting={submitting}
            onBackToUw={handleBackToUw}
            onSaveClose={handleSaveClose}
          />
        </>
      ) : null}
      <CustomSnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? ""}
        severity={snackbar?.severity ?? "success"}
        onClose={handleSnackbarClose}
      />
    </CustomBox>
  );
}

export default ReinsurerDrsScreen;
