import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import { AppHeader } from "@insurance-poc/common/app-header";
import { ApplicantBanner } from "@insurance-poc/common/applicant-banner";
import { commonPaths, replaceUrl } from "@insurance-poc/routes";
import { LogoutIcon } from "@insurance-poc/ui";
import { clearToken, getSessionUser } from "@insurance-poc/utils";
import { fetchMasBanner, type MasBannerRecord } from "../../services/masService";
import { MasDecisionForm } from "./MasDecisionForm";

type BannerState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: MasBannerRecord };

function signOut(): void {
  clearToken();
  replaceUrl(commonPaths.login);
}

/**
 * MAS DRS — header, applicant banner and MAS decision form. Quick Links is
 * out of scope; see "Open questions" in docs/spec/screens/retail-mas.md.
 */
export function MasDrsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userName = getSessionUser()?.displayName ?? "";
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [banner, setBanner] = useState<BannerState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  useEffect(() => {
    if (!applicationNo) {
      setBanner({ kind: "missing-id" });
      return;
    }

    let active = true;
    setBanner({ kind: "loading" });
    void fetchMasBanner(applicationNo).then((record) => {
      if (!active) return;
      setBanner(record ? { kind: "ready", record } : { kind: "not-found" });
    });

    return () => {
      active = false;
    };
  }, [applicationNo]);

  return (
    <Box
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
      <Box
        component="main"
        data-testid="mas-drs-main"
        sx={{ height: "calc(100dvh - 57px)", overflowY: "auto" }}
      >
        {banner.kind === "ready" ? (
          <ApplicantBanner
            applicantName={banner.record.applicantName}
            applicationLabel={banner.record.applicationLabel}
            lines={banner.record.lines}
          >
            <MasDecisionForm />
          </ApplicantBanner>
        ) : null}
        {banner.kind === "missing-id" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            Application number is missing.
          </Box>
        ) : null}
        {banner.kind === "not-found" ? (
          <Box role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
            No MAS record was found for application {applicationNo}.
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
