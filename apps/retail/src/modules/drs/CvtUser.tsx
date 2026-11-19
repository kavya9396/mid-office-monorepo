import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CustomBox, CustomDialog, CustomSnackbar, CustomTypography, DeleteIcon } from "@insurance-poc/ui";
import { drsRoutePath } from "@insurance-poc/routes";
import { getDrsRoleLabel, getMasterList } from "@insurance-poc/utils";
import { Financial } from "@insurance-poc/common/financial";
import { Medical } from "@insurance-poc/common/medical";
import { QuickLinksModule, type QuickLinkItem } from "@insurance-poc/common/quick-links";
import { DecisionHistory } from "@insurance-poc/common/decision-history";
import { PivvDetails } from "@insurance-poc/common/pivv-details";
import {
  DecisionBar,
  DecisionComparisonTable,
  type ComparisonRow,
} from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { DecisionSection, type DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import { LifeAssured, type LifeAssuredTab } from "@insurance-poc/common/life-assured";
import {
  RequirementMgmt,
  isNewRequirement,
  type RequirementItem,
} from "@insurance-poc/common/requirement-mgmt";
import { CvtEditApplicantDialog } from "./CvtEditApplicantDialog";
import {
  CVT_APPLICANTS,
  CVT_BRE_DECISION,
  CVT_CARD_DETAILS,
  CVT_DECISION_HISTORY,
  CVT_EDIT_APPLICANT_VALUES,
  CVT_PIVV_DETAILS,
  CVT_REQUIREMENTS,
  requirementStatusOrder,
  requirementStatusVariants,
} from "./cvtLifeAssuredData";

/** Quick links shown on the CVT DRS. Open Tasks and Audit Trail open their page; the other only notifies. */
const CVT_QUICK_LINKS: QuickLinkItem[] = [
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "open-tasks", label: "Open Tasks" },
  { id: "audit-trail", label: "Audit Trail" },
];

const CVT_DEFAULT_ROLE_TYPE = "CVT User";

/** `misc` master row type holding the CVT decision options. */
const CVT_DECISION_MISC_TYPE = "CVT_TERM_DESC";

/** Life assured profile tabs shown on the CVT DRS (as in the prototype). */
const CVT_LIFE_ASSURED_TABS: LifeAssuredTab[] = ["imageDetails", "personalKyc", "contactAddress", "paymentPayout"];

// Which BRE rows highlight differences between Initial and Final (as in the prototype)
const BRE_DIFF_BY_ROW_ID: Record<string, ComparisonRow["diff"]> = {
  decision: "value",
  discrepancy: "tokens",
};

const breRows: ComparisonRow[] = CVT_BRE_DECISION.rows.map((row) => ({
  label: row.label,
  initial: row.initial,
  final: row.final,
  diff: BRE_DIFF_BY_ROW_ID[row.id],
}));

/** The selected applicant travels in the router's navigation state, so the URL stays `/financial` / `/medical`. */
type ApplicantRouteState = { applicantId?: string };

const readApplicantId = (state: unknown): string | undefined => {
  if (typeof state !== "object" || state === null || !("applicantId" in state)) return undefined;
  const { applicantId } = state as ApplicantRouteState;
  return typeof applicantId === "string" && applicantId.trim().length > 0 ? applicantId.trim() : undefined;
};

const breDecisionRow = CVT_BRE_DECISION.rows.find((row) => row.id === "decision");
const breDiscrepancyRow = CVT_BRE_DECISION.rows.find((row) => row.id === "discrepancy");

/** Retail DRS for `roleType` `CVT_TASK`. UI only for now — service/API calls are integrated later. */
const CvtUser = () => {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const navigate = useNavigate();
  const { pathname, search, state: locationState } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const isFinancialRoute = lowerPath.includes("/drs/financial");
  const isMedicalRoute = lowerPath.includes("/drs/medical");
  const drsBasePath = applicationNo.length > 0 ? drsRoutePath(applicationNo) : "";
  const financialPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "financial") : "";
  const medicalPath = applicationNo.length > 0 ? drsRoutePath(applicationNo, "medical") : "";
  const currentApplicantId = readApplicantId(locationState);
  const selectedApplicant = CVT_APPLICANTS.find((applicant) => applicant.id === currentApplicantId) ?? CVT_APPLICANTS[0];
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const decisionOptions = useMemo(
    () =>
      getMasterList("misc", CVT_DECISION_MISC_TYPE)
        .filter((entry) => entry.isActive === "Y")
        .map((entry) => ({ label: entry.description, value: entry.code })),
    [],
  );
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleDecisionSubmit = (payload: DecisionSubmitPayload) => {
    console.log("Submit CVT decision", payload);
  };

  const handleSaveRequirements = (updatedRequirements: RequirementItem[]) => {
    console.log("[handleSaveRequirements] On click Save - Requirements list:", updatedRequirements);
  };

  const openFinancial = (applicantId: string) => {
    navigate({ pathname: financialPath, search }, { state: { applicantId } satisfies ApplicantRouteState });
  };
  const openMedical = (applicantId: string) => {
    navigate({ pathname: medicalPath, search }, { state: { applicantId } satisfies ApplicantRouteState });
  };
  const closeSubPage = () => navigate({ pathname: drsBasePath, search });
  const handleFinancialApplicantChange = (applicantKey: string) => {
    navigate(
      { pathname: financialPath, search },
      { replace: true, state: { applicantId: applicantKey } satisfies ApplicantRouteState },
    );
  };

  const detailCards = (
    <CustomBox
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 2,
      }}
    >
      {CVT_CARD_DETAILS.map((card) => (
        <DetailCard
          key={card.type}
          title={card.type}
          attributes={card.attributes}
          expandedAttributes={card.expandedAttributes}
          tables={card.tables}
        />
      ))}
    </CustomBox>
  );

  if (isFinancialRoute) {
    return (
      <Financial
        applicationNumber={applicationNo}
        summary={detailCards}
        applicants={CVT_APPLICANTS.map((applicant) => ({ key: applicant.id, label: applicant.label }))}
        initialApplicantKey={selectedApplicant?.id}
        onApplicantChange={handleFinancialApplicantChange}
        onBack={closeSubPage}
        onSubmit={(payload) => console.log("Submit financial", payload)}
      />
    );
  }

  if (isMedicalRoute) {
    return (
      <Medical
        summary={detailCards}
        applicants={CVT_APPLICANTS.map((applicant) => ({ key: applicant.id, label: applicant.label }))}
        initialApplicantKey={selectedApplicant?.id}
        onBack={closeSubPage}
        onSubmit={(payload) => console.log("Submit medical", payload)}
      />
    );
  }

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
      {detailCards}

      <QuickLinksModule
        items={CVT_QUICK_LINKS}
        applicationNo={applicationNo}
        roleType={getDrsRoleLabel() || CVT_DEFAULT_ROLE_TYPE}
        onNavigate={(path) => navigate(path)}
        onNotify={(message) => setSnackbarMessage(message)}
        title="Quick Links"
      />

      <DecisionBar
        title="BRE Decision"
        items={[
          { label: "Initial", value: breDecisionRow?.initial ?? "" },
          { label: "Final", value: breDecisionRow?.final ?? "", tone: "success" },
        ]}
        onRefresh={() => console.log("BRE Retrigger clicked")}
        refreshLabel="BRE Retrigger"
        onViewDetail={() => setBreDetailOpen(true)}
      />

      <DecisionBar
        title="BRE Discrepancy"
        items={[{ label: "Final", value: breDiscrepancyRow?.final ?? "", tone: "success" }]}
      />

      <RequirementMgmt
        applicationKey={applicationNo}
        requirements={CVT_REQUIREMENTS}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
        addButton={{
          label: "+ Add Requirement",
          onClick: () => console.log("Add Requirement clicked"),
        }}
        rowActions={[
          {
            key: "delete",
            label: "Remove requirement",
            icon: <DeleteIcon width={16} height={16} />,
            tone: "danger",
            hidden: (row) => !isNewRequirement(row),
            onClick: (row, { removeRow }) => {
              console.log("Delete requirement", row.id);
              removeRow();
            },
          },
        ]}
        onSave={handleSaveRequirements}
      />

      <LifeAssured
        applicants={CVT_APPLICANTS}
        tabs={CVT_LIFE_ASSURED_TABS}
        onViewMedical={openMedical}
        onViewFinancial={openFinancial}
        renderEditDialog={(applicant, onClose) => {
          const initialValues = CVT_EDIT_APPLICANT_VALUES[applicant.id];
          if (!initialValues) return null;
          return (
            <CvtEditApplicantDialog
              key={applicant.id}
              initialValues={initialValues}
              onClose={onClose}
              onSave={(values) => {
                console.log("[handleSaveEditApplicant] Saving applicant:", applicant.id, values);
                onClose();
              }}
            />
          );
        }}
      />

      <PivvDetails rows={CVT_PIVV_DETAILS} />

      <DecisionHistory rows={CVT_DECISION_HISTORY} />

      <DecisionSection
        ariaLabel="CVT Decision"
        remarksLabel="CVT Remarks"
        decisionLabel="CVT Decision"
        decisionOptions={decisionOptions}
        decision={decision}
        remarks={remarks}
        onDecisionChange={setDecision}
        onRemarksChange={setRemarks}
        onSubmit={handleDecisionSubmit}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title={
          <CustomTypography
            component="span"
            sx={{ fontSize: 16, fontWeight: 700 }}
          >
            BRE Decision
          </CustomTypography>
        }
        maxWidth="lg"
      >
        <DecisionComparisonTable
          headers={CVT_BRE_DECISION.headers}
          rows={breRows}
        />
      </CustomDialog>
    </CustomBox>
  );
};

export default CvtUser;
