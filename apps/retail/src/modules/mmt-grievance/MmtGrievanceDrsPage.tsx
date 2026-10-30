import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@insurance-poc/common/app-header";
import { ApplicantBanner } from "@insurance-poc/common/applicant-banner";
import { GrievanceHistory } from "@insurance-poc/common/grievance-history";
import { commonPaths, replaceUrl } from "@insurance-poc/routes";
import { CustomBox, LogoutIcon } from "@insurance-poc/ui";
import { clearToken, getSessionUser } from "@insurance-poc/utils";
import { MmtGrievanceDecision } from "./MmtGrievanceDecision";
import {
  fetchMmtGrievanceDrs,
  type MmtGrievanceDrsData,
} from "../../services/mmtGrievanceService";

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: MmtGrievanceDrsData };

function signOut(): void {
  clearToken();
  replaceUrl(commonPaths.login);
}

/**
 * MMT Grievance DRS — header, applicant banner, Grievance History and the
 * Grievance Decision grid. Submit is validation-only until the submit API is built.
 */
export function MmtGrievanceDrsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userName = getSessionUser()?.displayName ?? "";
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [state, setState] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  useEffect(() => {
    if (!applicationNo) {
      setState({ kind: "missing-id" });
      return;
    }

    let active = true;
    setState({ kind: "loading" });
    fetchMmtGrievanceDrs(applicationNo)
      .then((data) => {
        if (!active) return;
        setState(data ? { kind: "ready", data } : { kind: "not-found" });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState({
          kind: "error",
          message:
            reason instanceof Error
              ? reason.message
              : "Unable to load the grievance details.",
        });
      });

    return () => {
      active = false;
    };
  }, [applicationNo]);

  return (
    <CustomBox
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff8f3",
      }}
    >
      <AppHeader
        showBack
        onBack={() => navigate("/inbox")}
        userName={userName}
        menuItems={[
          { label: "Logout", icon: <LogoutIcon />, onSelect: signOut },
        ]}
      />
      <CustomBox
        component="main"
        data-testid="mmt-grievance-drs-main"
        sx={{ height: "calc(100dvh - 57px)", overflowY: "auto" }}
      >
        {state.kind === "ready" ? (
          <>
            <ApplicantBanner
              applicantName={state.data.record.applicantName}
              applicationLabel={state.data.record.applicationLabel}
              lines={state.data.record.lines}
            />
            <CustomBox
              sx={{ px: 0.5, pb: 1.5, display: "grid", gap: 1.25 }}
            >
              <GrievanceHistory rows={state.data.record.grievanceHistory} />
              <MmtGrievanceDecision
                rows={state.data.record.grievanceDecision}
              />
            </CustomBox>
          </>
        ) : null}
        {state.kind === "missing-id" ? (
          <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            Application number is missing.
          </CustomBox>
        ) : null}
        {state.kind === "not-found" ? (
          <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            No MMT grievance record was found for application {applicationNo}.
          </CustomBox>
        ) : null}
        {state.kind === "error" ? (
          <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            {state.message}
          </CustomBox>
        ) : null}
      </CustomBox>
    </CustomBox>
  );
}
