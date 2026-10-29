import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@insurance-poc/common/app-header";
import { ApplicantBanner } from "@insurance-poc/common/applicant-banner";
import { commonPaths, replaceUrl } from "@insurance-poc/routes";
import { CustomBox, LogoutIcon } from "@insurance-poc/ui";
import { clearToken, getSessionUser } from "@insurance-poc/utils";
import { fetchPivvDrs, type PivvDrsData } from "../../services/pivvService";
import { PivvDecisionForm } from "./PivvDecisionForm";

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; data: PivvDrsData };

function signOut(): void {
  clearToken();
  replaceUrl(commonPaths.login);
}

/**
 * PIVV DRS — header, applicant banner and PIVV Details decision table.
 * Quick Links is out of scope (same as MAS DRS).
 */
export function PivvDrsPage() {
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
    void fetchPivvDrs(applicationNo).then((data) => {
      if (!active) return;
      setState(data ? { kind: "ready", data } : { kind: "not-found" });
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
        data-testid="pivv-drs-main"
        sx={{ height: "calc(100dvh - 57px)", overflowY: "auto" }}
      >
        {state.kind === "ready" ? (
          <ApplicantBanner
            applicantName={state.data.record.applicantName}
            applicationLabel={state.data.record.applicationLabel}
            lines={state.data.record.lines}
          >
            <PivvDecisionForm
              details={state.data.record.pivvDetails}
              decisionOptions={state.data.decisionOptions}
            />
          </ApplicantBanner>
        ) : null}
        {state.kind === "missing-id" ? (
          <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            Application number is missing.
          </CustomBox>
        ) : null}
        {state.kind === "not-found" ? (
          <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            No PIVV record was found for application {applicationNo}.
          </CustomBox>
        ) : null}
      </CustomBox>
    </CustomBox>
  );
}
