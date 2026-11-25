import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CustomBox,
  CustomButton,
  CustomLoader,
  CustomSelect,
  CustomSnackbar,
  CustomTable,
  CustomTextField,
  CustomTypography,
  type Column,
} from "@insurance-poc/ui";
import { getDrsRoleLabel, getDrsRoleType, getMasterList } from "@insurance-poc/utils";
import {
  ApplicantBanner,
  type RowDetailsOptions,
} from "@insurance-poc/common/applicant-banner";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import type { LifeAssuredTab } from "@insurance-poc/common/life-assured";
import type { PivvDetailRow } from "@insurance-poc/common/pivv-details";
import { QuickLinksModule, type QuickLinkItem } from "@insurance-poc/common/quick-links";
import { getRetailDrsTaskConfig } from "../../config/drsTaskConfig";
import { useGetRetailDrsQuery } from "../../services/drsApi";

// Row 0 is the member line (Name / App No. are shown in the banner header); row 1 is the product line (bold); row 2 is Riders.
const PIVV_BANNER_OPTIONS: RowDetailsOptions = {
  emphasisRowIds: [1],
  valueOnlyRowIds: [0],
  skipFieldNames: ["Name", "App No.", "App No"],
  rowLabels: { 2: "Riders" },
};

const PIVV_DEFAULT_ROLE_TYPE = "PIVV User";

/** Quick links shown on the PIVV DRS. Applicant Profile opens a popup; the other only notifies (as on the CVT DRS). */
const PIVV_QUICK_LINKS: QuickLinkItem[] = [
  { id: "applicant-profile", label: "Applicant Profile" },
  { id: "proposal-documents", label: "Proposal Form & Documents" },
];

/** Applicant Profile popup tabs (same set as the CVT DRS life assured profile). */
const PIVV_PROFILE_TABS: LifeAssuredTab[] = ["imageDetails", "personalKyc", "contactAddress"];

/** `misc` master `type` holding the PIVV decisions. */
const PIVV_DECISION_MISC_TYPE = "PIVV_TERM_DESC";

function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if (
      "error" in error &&
      typeof error.error === "string" &&
      error.error.length > 0
    ) {
      return error.error;
    }
    if (
      "message" in error &&
      typeof error.message === "string" &&
      error.message.length > 0
    ) {
      return error.message;
    }
  }
  return "Unable to load the Retail DRS.";
}

const PivvUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const navigate = useNavigate();

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  // Every PIVV_TERM_DESC row shares the same `code`, so the unique `value` is the option value.
  const decisionOptions = useMemo(
    () =>
      getMasterList("misc", PIVV_DECISION_MISC_TYPE)
        .filter((entry) => entry.isActive === "Y")
        .map((entry) => ({ label: entry.description, value: entry.value ?? entry.description })),
    [],
  );
  const [decisionByRow, setDecisionByRow] = useState<Record<string, string>>({});
  const [remarkByRow, setRemarkByRow] = useState<Record<string, string>>({});

  const drsTaskConfig = getRetailDrsTaskConfig(getDrsRoleType());
  const drs = useGetRetailDrsQuery(
    { applicationNo, ...drsTaskConfig },
    {
      skip: applicationNo.length === 0,
      // Always hit the DRS API when the screen mounts instead of serving the cached result.
      refetchOnMountOrArgChange: true,
    },
  );

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

  const columns: Column<PivvDetailRow>[] = [
    { key: "fupCode", header: "FUP Code", width: "10%" },
    { key: "profile", header: "Profile", width: "12%" },
    { key: "raisedDate", header: "Raised Date", width: "12%" },
    {
      key: "raisedRemark",
      header: "Raised Remark",
      width: "16%",
      render: (_value, row) => row.raisedRemark || "-",
    },
    {
      key: "decisions",
      header: "PIVV Decision",
      width: "25%",
      render: (_value, row) => (
        <CustomSelect
          placeholder="Select PIVV decision"
          options={decisionOptions}
          value={decisionByRow[String(row.id)] ?? ""}
          onChange={(value) =>
            setDecisionByRow((previous) => ({ ...previous, [String(row.id)]: value }))
          }
        />
      ),
    },
    {
      key: "pivvRemark",
      header: "PIVV Remark",
      width: "25%",
      render: (_value, row) => (
        <CustomTextField
          fullWidth
          multiline
          placeholder="Enter PIVV remark"
          value={remarkByRow[String(row.id)] ?? row.pivvRemark}
          onChange={(event) =>
            setRemarkByRow((previous) => ({ ...previous, [String(row.id)]: event.target.value }))
          }
        />
      ),
    },
  ];

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
      {/* Banner with photo */}
      <ApplicantBanner
        name={drs.data.applicantName}
        // photoUrl={PROFILE_IMAGE_URL ?? ""}
        applicationNo={drs.data.applicationNo}
        rowDetails={drs.data.rowDetails}
        rowDetailsOptions={PIVV_BANNER_OPTIONS}
      />

      <QuickLinksModule
        items={PIVV_QUICK_LINKS}
        applicationNo={applicationNo}
        roleType={getDrsRoleLabel() || PIVV_DEFAULT_ROLE_TYPE}
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
        tabs={PIVV_PROFILE_TABS}
        open={applicantProfileOpen}
        onClose={() => setApplicantProfileOpen(false)}
      />

      <CustomTable<PivvDetailRow>
        title="PIVV Details"
        columns={columns}
        data={drs.data.pivvDetails}
        getRowId={(row) => row.id}
      />

      <CustomBox sx={{ display: "flex", justifyContent: "center", py: 1 }}>
        <CustomButton>
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

export default PivvUser;
