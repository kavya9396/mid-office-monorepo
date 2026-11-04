import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MedicalTpaDrsPanel,
  type MedicalTpaDrsRecord,
  type MedicalTpaSubmitPayload,
} from "@insurance-poc/common/tpa";
import { CustomBox, CustomSnackbar } from "@insurance-poc/ui";
import {
  fetchMedicalTpaDrs,
  submitMedicalTpaServiceProvider,
} from "../../services/tpaService";

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; record: MedicalTpaDrsRecord };

type SnackbarState = {
  message: string;
  severity: "success" | "error";
};

export function TpaDrsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const taskId = params.get("taskId")?.trim() ?? undefined;
  const instanceId = params.get("instanceId")?.trim() ?? undefined;
  const [state, setState] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const redirectToInboxAfterSnackbar = useRef(false);

  useEffect(() => {
    if (!applicationNo) {
      setState({ kind: "missing-id" });
      return;
    }

    let active = true;
    setState({ kind: "loading" });
    fetchMedicalTpaDrs(applicationNo)
      .then((record) => {
        if (!active) return;
        setState(record ? { kind: "ready", record } : { kind: "not-found" });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState({
          kind: "error",
          message:
            reason instanceof Error
              ? reason.message
              : "Unable to load Medical TPA details.",
        });
      });

    return () => {
      active = false;
    };
  }, [applicationNo]);

  const handleSubmit = async (payload: MedicalTpaSubmitPayload) => {
    setSubmitting(true);
    redirectToInboxAfterSnackbar.current = false;
    try {
      const result = await submitMedicalTpaServiceProvider(payload);
      redirectToInboxAfterSnackbar.current = result.redirectToInbox;
      setSnackbar({ message: result.message, severity: "success" });
    } catch (reason: unknown) {
      setSnackbar({
        message:
          reason instanceof Error
            ? reason.message
            : "Unable to submit service provider details.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(null);
    if (redirectToInboxAfterSnackbar.current) {
      redirectToInboxAfterSnackbar.current = false;
      navigate("/inbox");
    }
  };

  return (
    <CustomBox
      component="main"
      data-testid="medical-tpa-drs-main"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: { xs: "auto", md: "hidden" },
        bgcolor: "#fff8f3",
        boxSizing: "border-box",
        p: { md: 1.25 },
      }}
    >
      {state.kind === "ready" ? (
        <CustomBox
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MedicalTpaDrsPanel
            record={state.record}
            taskId={taskId}
            instanceId={instanceId}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </CustomBox>
      ) : null}
      {state.kind === "missing-id" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          Application number is missing.
        </CustomBox>
      ) : null}
      {state.kind === "not-found" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          No Medical TPA record was found for application {applicationNo}.
        </CustomBox>
      ) : null}
      {state.kind === "error" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          {state.message}
        </CustomBox>
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
