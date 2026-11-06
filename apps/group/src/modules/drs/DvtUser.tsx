import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Box, Typography } from "@mui/material";
import { CustomSnackbar, CustomDialog, DeleteIcon, EditIcon } from "@insurance-poc/ui";
import { DecisionBar, DecisionComparisonTable } from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { DecisionSection, type DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import { LifeAssured } from "@insurance-poc/common/life-assured";
import { Financial } from "@insurance-poc/common/financial";
import { Medical } from "@insurance-poc/common/medical";
import { RequirementMgmt } from "@insurance-poc/common/requirement-mgmt";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";
import { ApplicantProfile } from "@insurance-poc/common/applicant-profile";
import { RiskCards } from "@insurance-poc/common/risk-cards";
import {
  requirementStatusOptions,
  requirementStatusOrder,
  requirementStatusVariants,
} from "./requirementData";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import type { CardType } from "../../services/drsService";
import { GROUP_QUICK_LINKS_CONFIG } from "../config/quickLinks.config";
import { buildBreRows } from "./breFormat";

const CARD_TITLES: Record<CardType, string> = {
  APPLICATION: "Application Detail",
  SOURCE: "Source Detail",
  GROUP: "Group Detail",
  RISK: "Risk Detail",
};


const quickLinksConfig = GROUP_QUICK_LINKS_CONFIG.dvt;

const DRS_PATH = "/drs";
const FINANCIAL_PATH = "/drs/financial";
const MEDICAL_PATH = "/drs/medical";
const APPLICANT_ID_PARAM = "applicantId";

export interface DvtUserProps {
  previousPolicyMode?: "page" | "modal";
}


function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to load the Group DRS.";
}

const DvtUser = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const lowerPath = pathname.toLowerCase();
  const isFinancialRoute = lowerPath.endsWith(FINANCIAL_PATH) || lowerPath.endsWith(`${FINANCIAL_PATH}/`);
  const isMedicalRoute = lowerPath.endsWith(MEDICAL_PATH) || lowerPath.endsWith(`${MEDICAL_PATH}/`);
  const requestedApplicationNo = params.get("applicationNo")?.trim() ?? "";
  const drs = useGetGroupDrsQuery(requestedApplicationNo);
  const applicationNo = requestedApplicationNo || drs.data?.applicationNo || "";

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [applicantProfileOpen, setApplicantProfileOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);
  const openFinancial = (applicantId: string) => {
    const next = new URLSearchParams(params);
    next.set(APPLICANT_ID_PARAM, applicantId);
    navigate({ pathname: FINANCIAL_PATH, search: `?${next.toString()}` });
  };
  const closeFinancial = () => {
    const next = new URLSearchParams(params);
    next.delete(APPLICANT_ID_PARAM);
    const query = next.toString();
    navigate({ pathname: DRS_PATH, search: query ? `?${query}` : "" });
  };
  const openMedical = (applicantId: string) => {
    const next = new URLSearchParams(params);
    next.set(APPLICANT_ID_PARAM, applicantId);
    navigate({ pathname: MEDICAL_PATH, search: `?${next.toString()}` });
  };
  const closeMedical = () => {
    const next = new URLSearchParams(params);
    next.delete(APPLICANT_ID_PARAM);
    const query = next.toString();
    navigate({ pathname: DRS_PATH, search: query ? `?${query}` : "" });
  };

  const handleBreRetrigger = () => console.log("BRE Retrigger clicked");
  const handleApplicantAction = (action: string) => (applicantId: string) =>
    console.log(`${action} clicked`, applicantId);
  const handleDecisionSubmit = (payload: DecisionSubmitPayload) =>
    console.log("Submit DVT decision", payload);

  if (drs.isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading application...</Typography>
      </Box>
    );
  }

  if (drs.isError || !drs.data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>{readQueryError(drs.error)}</Typography>
      </Box>
    );
  }

  const { cardDetails, breDecision, requirements, applicants, riskCards } = drs.data;

  const detailCards = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 2,
      }}
    >
      {cardDetails.map((card) => (
        <DetailCard
          key={card.type}
          title={CARD_TITLES[card.type]}
          attributes={card.attributes}
          expandedAttributes={card.expandedAttributes}
          tables={card.tables}
        />
      ))}
    </Box>
  );

  if (isFinancialRoute) {
    const financialApplicants = applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }));
    return (
      <Financial
        summary={detailCards}
        applicants={financialApplicants.length > 0 ? financialApplicants : undefined}
        initialApplicantKey={params.get(APPLICANT_ID_PARAM)?.trim() || undefined}
        onBack={closeFinancial}
        onSubmit={(payload) => console.log("Submit financial", payload)}
      />
    );
  }

  if (isMedicalRoute) {
    const medicalApplicants = applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }));
    return (
      <Medical
        summary={detailCards}
        applicants={medicalApplicants.length > 0 ? medicalApplicants : undefined}
        initialApplicantKey={params.get(APPLICANT_ID_PARAM)?.trim() || undefined}
        onBack={closeMedical}
        onSubmit={(payload) => console.log("Submit medical", payload)}
      />
    );
  }

  const breRows: ComparisonRow[] = [
    {
      label: "BRE Status",
      initial: breDecision.initialDecision ? "Success" : "-",
      final: breDecision.decision ? "Success" : "-",
    },
    {
      label: "BRE Decision",
      initial: breDecision.initialDecision,
      final: breDecision.decision,
      diff: "value",
    },
    {
      label: "BRE Remarks",
      initial: breDecision.remarks,
      final: breDecision.remarks,
    },
    {
      label: "BRE Discrepancy",
      initial: breDecision.discrepancy,
      final: breDecision.discrepancy,
      diff: "tokens",
    },
    {
      label: "BRE Timestamp",
      initial: formatBreTimestamp(breDecision.timestamp),
      final: formatBreTimestamp(breDecision.timestamp),
    },
  ];

  return (
    <Box sx={{ position: "relative", minHeight: "100%", p:2, display: "flex", gap:2, flexDirection: "column" }}>
      {detailCards}

      <QuickLinksModule
        items={quickLinksConfig.items}
        applicationNo={applicationNo}
        roleType={params.get("role")?.trim() || quickLinksConfig.defaultRoleType}
        onNavigate={(path) => navigate(path)}
        onNotify={(message) => setSnackbarMessage(message)}
        dialogItemIds={["applicant-profile"]}
        onDialogItemClick={() => setApplicantProfileOpen(true)}
        title="Quick Links"
      />

      <ApplicantProfile
        open={applicantProfileOpen}
        onClose={() => setApplicantProfileOpen(false)}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <DecisionBar
        title="BRE Decision"
        items={[
          { label: "Initial", value: breDecision.initialDecision },
          { label: "Final", value: breDecision.decision, tone: "success" },
        ]}
        onRefresh={handleBreRetrigger}
        refreshLabel="BRE Retrigger"
        onViewDetail={() => setBreDetailOpen(true)}
      />

      <RequirementMgmt
        requirements={requirements}
        statusOptions={requirementStatusOptions}
        statusOrder={requirementStatusOrder}
        statusVariants={requirementStatusVariants}
        addButton={{
          label: "+ Add Requirement",
          onClick: () => console.log("Add Requirement clicked"),
        }}
        rowActions={[
          {
            key: "edit",
            label: "Edit requirement",
            icon: <EditIcon width={16} height={16} />,
            onClick: (row) => console.log("Edit requirement", row.id),
          },
          {
            key: "delete",
            label: "Remove requirement",
            icon: <DeleteIcon width={16} height={16} />,
            tone: "danger",
            onClick: (row, { removeRow }) => {
              console.log("Delete requirement", row.id);
              removeRow();
            },
          },
        ]}
        onSave={(requirements) => console.log("Save requirements", requirements)}
      />

      <LifeAssured
        applicants={applicants}
        onEdit={handleApplicantAction("Edit")}
        onViewMedical={openMedical}
        onViewFinancial={openFinancial}
      />

      <DecisionSection
        onSubmit={handleDecisionSubmit}
      />

      <CustomDialog
        open={breDetailOpen}
        onClose={() => setBreDetailOpen(false)}
        title={
          <Typography
            component="span"
            sx={{ fontSize: 16, fontWeight: 700 }}
          >
            BRE Decision
          </Typography>
        }
        maxWidth="lg"
      >
        <DecisionComparisonTable
          headers={{ label: "BRE", initial: "Initial BRE", final: "Final BRE" }}
          rows={breRows}
        />
      </CustomDialog>
    </Box>
  );
};

export default DvtUser;