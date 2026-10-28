import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Box, Typography } from "@mui/material";
import { CustomSnackbar, CustomDialog, DeleteIcon, EditIcon } from "@insurance-poc/ui";
import {
  DecisionBar,
  DecisionComparisonTable,
  type ComparisonRow,
} from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { DecisionSection, type DecisionSubmitPayload } from "@insurance-poc/common/decision-section";
import { LifeAssured } from "@insurance-poc/common/life-assured";
import { RequirementMgmt } from "@insurance-poc/common/requirement-mgmt";
import {
  QuickLinks,
  type QuickLinkItem,
} from "@insurance-poc/common/quick-links";
import { PreviousPolicyDialog } from "@insurance-poc/common/previous-policy";
import {
  requirementStatusOptions,
  requirementStatusOrder,
  requirementStatusVariants,
} from "./requirementData";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import type { CardType } from "../../services/drsService";

const CARD_TITLES: Record<CardType, string> = {
  APPLICATION: "Application Detail",
  SOURCE: "Source Detail",
  GROUP: "Group Detail",
  RISK: "Risk Detail",
};


const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  { id: "applicant-profile", label: "Applicant Profile" },
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "previous-policies", label: "Previous Policies" },
  { id: "open-tasks", label: "Open Tasks" },
  { id: "risk-details", label: "Risk Details" },
  { id: "audit-trail", label: "Audit Trail" },
  { id: "raise-grievance", label: "Raise Grievance" },
];

export interface DvtUserProps {
  quickLinks?: QuickLinkItem[];
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "14/08/2026, 1108hrs" -> "14 Aug 2026, 11:08:00 am" (same output as the prototype)
const formatBreTimestamp = (value?: string) => {
  const match = value?.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2})(\d{2})hrs$/i);
  if (!match) return "";
  const [, day, month, year, hours, minutes] = match;
  const hour12 = Number(hours) % 12 || 12;
  const meridiem = Number(hours) < 12 ? "am" : "pm";
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${String(hour12).padStart(2, "0")}:${minutes}:00 ${meridiem}`;
};

const DvtUser = ({
  quickLinks,
  previousPolicyMode = "page",
}: Readonly<DvtUserProps>) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedApplicationNo = params.get("applicationNo")?.trim() ?? "";
  const drs = useGetGroupDrsQuery(requestedApplicationNo);
  const applicationNo = requestedApplicationNo || drs.data?.applicationNo || "";

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [previousPolicyOpen, setPreviousPolicyOpen] = useState(false);
  const [breDetailOpen, setBreDetailOpen] = useState(false);

  const linkItems =
    quickLinks ??
    DEFAULT_QUICK_LINKS.map((link) => ({
      ...link,
      onClick: () => {
        if (link.id === "previous-policies") {
          if (previousPolicyMode === "modal") {
            setPreviousPolicyOpen(true);
          } else {
            navigate(
              `/previous-policy?applicationNo=${encodeURIComponent(applicationNo)}`,
            );
          }
        } else {
          setSnackbarMessage(`Navigating to ${link.label}`);
        }
      },
    }));

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

  const { cardDetails, breDecision, latestBreDecision, requirements, applicants } = drs.data;

  const breRows: ComparisonRow[] = [
    {
      label: "BRE Status",
      initial: breDecision.decision ? "Success" : "-",
      final: latestBreDecision.decision ? "Success" : "-",
    },
    {
      label: "BRE Decision",
      initial: breDecision.decision,
      final: latestBreDecision.decision,
      diff: "value",
    },
    {
      label: "BRE Remarks",
      initial: breDecision.remarks,
      final: latestBreDecision.remarks,
    },
    {
      label: "BRE Discrepancy",
      initial: breDecision.discrepancy,
      final: latestBreDecision.discrepancy,
      diff: "tokens",
    },
    {
      label: "BRE Timestamp",
      initial: formatBreTimestamp(breDecision.timestamp),
      final: formatBreTimestamp(latestBreDecision.timestamp),
    },
  ];

  return (
    <Box sx={{ position: "relative", minHeight: "100%", p:2, display: "flex", gap:2, flexDirection: "column" }}>
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

      <QuickLinks items={linkItems} title="Quick Links" />

      <PreviousPolicyDialog
        open={previousPolicyOpen}
        onClose={() => setPreviousPolicyOpen(false)}
      />

      <CustomSnackbar
        open={Boolean(snackbarMessage)}
        message={snackbarMessage ?? ""}
        onClose={() => setSnackbarMessage(null)}
      />

      <DecisionBar
        title="BRE Decision"
        items={[
          { label: "Initial", value: breDecision.decision },
          { label: "Final", value: latestBreDecision.decision, tone: "success" },
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
        onViewMedical={handleApplicantAction("View Medical")}
        onViewFinancial={handleApplicantAction("View Financial")}
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
            sx={{ fontSize: 12, fontWeight: 800 }}
          >
            BRE Decision
          </Typography>
        }
        maxWidth="lg"
        contentSx={{ p: { xs: 1, sm: 1.5 } }}
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
