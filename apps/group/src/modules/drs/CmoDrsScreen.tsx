import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApplicantBanner, type RowDetailsOptions } from "@insurance-poc/common/applicant-banner";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import { DecisionHistory } from "@insurance-poc/common/cmo";
import { Medical } from "@insurance-poc/common/medical";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { RiskCards, type RiskCardData } from "@insurance-poc/common/risk-cards";
import { drsRoutePath } from "@insurance-poc/routes";
import { CustomBox, CustomButton, CustomLoader, CustomSnackbar } from "@insurance-poc/ui";
import { getDrsApplicationNo, getDrsMemberId, getDrsRoleLabel, getDrsRoleType } from "@insurance-poc/utils";
import { GuwRaiseGrievanceDialog } from "../guw/GuwRaiseGrievanceDialog";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildQuickLinkItems } from "./guwQuickLinks";
import { useGetCmoDrsQuery } from "../../services/drsApi";

const PROFILE_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#302a27"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7z"/></svg>',
)}`;

/** Same banner rows as the GUW DRS header. */
const CMO_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  valueOnlyRowIds: [0],
  skipFieldNames: ["Name", "App No.", "App No"],
  rowLabels: { 2: "Riders", 3: "Sum at Risk" },
};

const CMO_CARD_IDS = ["MEDICAL", "RISK_PARAMETERS"] as const;
const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.refCmo;

type CmoDrsScreenProps = Readonly<{
  testId: string;
}>;

/**
 * Shared CMO DRS layout. The session role selects `screenType` through `drsTaskConfig`;
 * this component does not hardcode a role or screen type.
 */
export function CmoDrsScreen({ testId }: CmoDrsScreenProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() || getDrsApplicationNo();
  const isMedicalRoute = pathname.toLowerCase().includes("/drs/medical");
  const drsBasePath = applicationNo ? drsRoutePath(applicationNo) : "";
  const medicalPath = applicationNo ? drsRoutePath(applicationNo, "medical") : "";
  const memberId = getDrsMemberId();
  const roleType = getDrsRoleType();
  const drs = useGetCmoDrsQuery(
    {
      applicationNo,
      roleType,
      taskType: roleType,
      memberId: memberId || undefined,
    },
    { skip: applicationNo.length === 0 },
  );
  const record = drs.data;
  const pageKind =
    applicationNo.length === 0
      ? "missing-id"
      : drs.isLoading || drs.isUninitialized
        ? "loading"
        : drs.isError || !record
          ? "not-found"
          : "ready";
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [raiseGrievanceOpen, setRaiseGrievanceOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const notify = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const riskCards: RiskCardData[] =
    pageKind === "ready" && record
      ? CMO_CARD_IDS.flatMap((id) => record.riskCards.filter((card) => card.id === id))
      : [];

  const openMedical = (card: RiskCardData) => {
    if (card.id === "MEDICAL" && medicalPath) {
      navigate({ pathname: medicalPath, search });
    }
  };

  return (
    <CustomBox
      component="main"
      data-testid={testId}
      sx={{ minHeight: "100%", background: "#fff8f3" }}
    >
      {pageKind === "loading" ? <CustomLoader message="Loading application" /> : null}

      {pageKind === "ready" && record ? (
        <>
          <ApplicantBanner
            name={record.applicantName}
            photoUrl={PROFILE_IMAGE_URL}
            applicationNo={record.applicationNo}
            rowDetails={record.rowDetails}
            rowDetailsOptions={CMO_BANNER_OPTIONS}
          />
          {isMedicalRoute ? (
            <Medical
              applicants={[
                {
                  key: memberId || record.applicantName,
                  label: memberId || record.applicantName,
                },
              ]}
              onBack={() => navigate({ pathname: drsBasePath, search })}
              onSubmit={(payload) => console.log("Submit medical", payload)}
            />
          ) : (
            <CustomBox sx={{ p: "6px 4px 20px", display: "flex", flexDirection: "column", gap: 1.5 }}>
              <RiskCards cards={riskCards} onView={openMedical} viewCardIds={["MEDICAL"]} />
              <DecisionHistory />
              <CustomBox
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  mt: 1.5,
                  mb: 2.5,
                }}
              >
                <CustomButton
                  variant="contained"
                  sx={{ borderRadius: "50px" }}
                  onClick={() => {
                    // Submit API handler to be wired
                    console.log("Submit CMO", {
                      roleType,
                      applicationNo: record.applicationNo || applicationNo,
                    });
                  }}
                >
                  Submit
                </CustomButton>
              </CustomBox>
              <QuickLinksModule
                items={buildQuickLinkItems(quickLinksConfig.items, notify, [
                  "applicant-profile",
                  "raise-grievance",
                ])}
                title="Quick Links"
                applicationNo={applicationNo}
                roleType={getDrsRoleLabel() || quickLinksConfig.defaultRoleType}
                onNavigate={(path) => navigate(path)}
                onNotify={notify}
                dialogItemIds={["applicant-profile", "raise-grievance"]}
                onDialogItemClick={(item) => {
                  if (item.id === "raise-grievance") setRaiseGrievanceOpen(true);
                  else setApplicantProfileOpen(true);
                }}
              />
            </CustomBox>
          )}
        </>
      ) : null}

      {pageKind === "missing-id" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          Application number is missing.
        </CustomBox>
      ) : null}

      {pageKind === "not-found" ? (
        <CustomBox role="alert" sx={{ p: 2, color: "#302a27", fontSize: "12px" }}>
          No application header was found for {applicationNo}.
        </CustomBox>
      ) : null}

      {pageKind === "ready" && record ? (
        <>
          <GuwRaiseGrievanceDialog
            open={raiseGrievanceOpen}
            onClose={() => setRaiseGrievanceOpen(false)}
            data={record.quickLinks.raiseGrievance}
            context={{
              applicationNo: record.applicationNo || applicationNo,
              partyId: record.partyId || undefined,
              lifeNumber: record.lifeNumber || undefined,
              transactionId: record.transactionId || null,
            }}
            notify={notify}
          />
          <ApplicantProfile
            applicants={record.quickLinks.applicantProfile ?? []}
            memberTabs
            variant="guw"
            open={applicantProfileOpen}
            onClose={() => setApplicantProfileOpen(false)}
          />
        </>
      ) : null}

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity="info"
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={2000}
      />
    </CustomBox>
  );
}
