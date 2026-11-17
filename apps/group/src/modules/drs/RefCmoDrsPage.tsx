import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { DecisionHistory } from "@insurance-poc/common/cmo";
import { Medical } from "@insurance-poc/common/medical";
import { RiskCards, type RiskCardData } from "@insurance-poc/common/risk-cards";
import { drsRoutePath } from "@insurance-poc/routes";
import { CustomBox, CustomLoader } from "@insurance-poc/ui";
import { getDrsApplicationNo, getDrsMemberId, getDrsRoleType } from "@insurance-poc/utils";
import { fetchGuwDrs, type GuwDrsRecord } from "../../services/guwService";

const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

/** Same banner rows as the GUW DRS header. */
const REF_CMO_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  valueOnlyRowIds: [0],
  skipFieldNames: ["Name", "App No.", "App No"],
  rowLabels: { 2: "Riders", 3: "Sum at Risk" },
};

type PageState =
  | { kind: "loading" }
  | { kind: "missing-id" }
  | { kind: "not-found" }
  | { kind: "ready"; record: GuwDrsRecord };

const REF_CMO_CARD_IDS = ["MEDICAL", "RISK_PARAMETERS"] as const;

/** REF CMO DRS — GUW header plus the Medical and Risk Parameters cards. */
export function RefCmoDrsPage() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() || getDrsApplicationNo();
  const isMedicalRoute = pathname.toLowerCase().includes("/drs/medical");
  const drsBasePath = applicationNo ? drsRoutePath(applicationNo) : "";
  const medicalPath = applicationNo ? drsRoutePath(applicationNo, "medical") : "";
  const memberId = getDrsMemberId();
  const roleType = getDrsRoleType();
  const [page, setPage] = useState<PageState>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  useEffect(() => {
    if (!applicationNo) {
      setPage({ kind: "missing-id" });
      return;
    }
    let active = true;
    setPage({ kind: "loading" });
    void fetchGuwDrs(applicationNo, memberId, roleType).then((record) => {
      if (!active) return;
      setPage(record ? { kind: "ready", record } : { kind: "not-found" });
    });
    return () => {
      active = false;
    };
  }, [applicationNo, memberId, roleType]);

  const riskCards: RiskCardData[] =
    page.kind === "ready"
      ? REF_CMO_CARD_IDS.flatMap((id) => page.record.riskCards.filter((card) => card.id === id))
      : [];

  const openMedical = (card: RiskCardData) => {
    if (card.id === "MEDICAL" && medicalPath) {
      navigate({ pathname: medicalPath, search });
    }
  };

  return (
    <CustomBox
      component="main"
      data-testid="ref-cmo-drs-main"
      sx={{ minHeight: "100%", background: "#fff8f3" }}
    >
      {page.kind === "loading" ? <CustomLoader message="Loading application" /> : null}

      {page.kind === "ready" ? (
        <>
          <ApplicantBanner
            name={page.record.applicantName}
            photoUrl={PROFILE_IMAGE_URL}
            applicationNo={page.record.applicationNo}
            rowDetails={page.record.rowDetails}
            rowDetailsOptions={REF_CMO_BANNER_OPTIONS}
          />
          {isMedicalRoute ? (
            <Medical
              applicants={[
                {
                  key: memberId || page.record.applicantName,
                  label: memberId || page.record.applicantName,
                },
              ]}
              onBack={() => navigate({ pathname: drsBasePath, search })}
              onSubmit={(payload) => console.log("Submit medical", payload)}
            />
          ) : (
            <CustomBox sx={{ p: "6px 4px 0", display: "flex", flexDirection: "column", gap: 1.5 }}>
              <RiskCards cards={riskCards} onView={openMedical} viewCardIds={["MEDICAL"]} />
              <DecisionHistory />
            </CustomBox>
          )}
        </>
      ) : null}

      {page.kind === "missing-id" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          Application number is missing.
        </CustomBox>
      ) : null}

      {page.kind === "not-found" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          No application header was found for {applicationNo}.
        </CustomBox>
      ) : null}
    </CustomBox>
  );
}

export default RefCmoDrsPage;
