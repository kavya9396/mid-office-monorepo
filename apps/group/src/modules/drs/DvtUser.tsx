import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Box, Typography } from "@mui/material";
import { CustomDialog, CustomSnackbar } from "@insurance-poc/ui";
import {
  DecisionBar,
  DecisionComparisonTable,
  type ComparisonRow,
} from "@insurance-poc/common/decision-bar";
import {
  DetailCard,
  type DetailAttribute,
  type DetailTable,
} from "@insurance-poc/common/detail-card";
import { LifeAssured } from "@insurance-poc/common/life-assured";
import {
  QuickLinks,
  type QuickLinkItem,
} from "@insurance-poc/common/quick-links";
import { PreviousPolicyDialog } from "@insurance-poc/common/previous-policy";
import { mockApplicants } from "./lifeAssuredData";

type CardType = "APPLICATION" | "SOURCE" | "GROUP" | "RISK";

type CardDetail = {
  type: CardType;
  attributes: DetailAttribute[];
  expandedAttributes: DetailAttribute[];
  tables: DetailTable[];
};

const CARD_TITLES: Record<CardType, string> = {
  APPLICATION: "Application Detail",
  SOURCE: "Source Detail",
  GROUP: "Group Detail",
  RISK: "Risk Detail",
};

// Mock API response
const mockResponse: {
  success: boolean;
  data: {
    applicationNo: string;
    screenType: string;
    businessType: string;
    rowDetails: unknown[];
    cardDetails: CardDetail[];
  };
} = {
  success: true,
  data: {
    applicationNo: "OB90322247",
    screenType: "DVT_INFORMAL",
    businessType: "GROUP",
    rowDetails: [],
    cardDetails: [
      {
        type: "APPLICATION",
        attributes: [
          { name: "Product", value: "Group Term - GT01" },
          { name: "Channel", value: "Agency" },
          { name: "Sum Assured", value: "5000000" },
          { name: "MPH Name", value: "ABC Bank" },
        ],
        expandedAttributes: [
          { name: "Product", value: "Group Term - GT01" },
          { name: "Channel", value: "Agency" },
          { name: "Sum Assured", value: "5000000" },
          { name: "MPH Name", value: "ABC Bank" },
          { name: "TI Rider - SA", value: "1000000" },
          { name: "ADBR SA", value: "500000" },
          { name: "CI Rider SA", value: "250000" },
          { name: "TFESA", value: "" },
          { name: "TRSA", value: "12000" },
          { name: "TSA", value: "5000000" },
          { name: "TPSA", value: "" },
          { name: "TFSA", value: "1.2" },
          { name: "TMSA", value: "" },
        ],
        tables: [
          {
            name: "Rider Details",
            columns: ["Rider", "Rider Code", "Sum Assured"],
            rows: [
              { Rider: "Rider 1", "Rider Code": "TI", "Sum Assured": "1000000" },
              { Rider: "Rider 2", "Rider Code": "ADBR", "Sum Assured": "500000" },
              { Rider: "Rider 3", "Rider Code": "CI", "Sum Assured": "250000" },
            ],
          },
        ],
      },
      {
        type: "SOURCE",
        attributes: [
          { name: "Call ID", value: "" },
          { name: "Policy No.", value: "" },
          { name: "Agent Name", value: "Vinayaka-0112000" },
          { name: "Customer Type", value: "New" },
        ],
        expandedAttributes: [
          { name: "Call ID", value: "" },
          { name: "Policy No.", value: "" },
          { name: "Agent Name / Code", value: "Ram / AG123" },
          { name: "Customer Type", value: "New" },
          { name: "Policy Type", value: "Group" },
          { name: "Premium", value: "52000" },
          { name: "PT", value: "20" },
          { name: "PPT", value: "15" },
          { name: "Payment Mode", value: "Annual" },
          { name: "Master Policy No.", value: "" },
          { name: "LAN Number", value: "LAN998877" },
          { name: "Login Date", value: "2026-04-12" },
          { name: "Bank Name", value: "ABC Bank" },
          { name: "Bank Branch", value: "Mumbai" },
          { name: "Source", value: "Group Portal" },
        ],
        tables: [],
      },
      {
        type: "GROUP",
        attributes: [
          { name: "Coverage Option", value: "Decreasing" },
          { name: "Coverage Status", value: "Active" },
          { name: "Moratorium", value: "Y" },
          { name: "Moratorium Period", value: "" },
        ],
        expandedAttributes: [
          { name: "Coverage Option", value: "Decreasing" },
          { name: "Coverage Status", value: "Active" },
          { name: "Moratorium", value: "Y" },
          { name: "Moratorium Period", value: "" },
          { name: "Share of Loan", value: "100" },
          { name: "Loan Type", value: "Home Loan" },
          { name: "Bank Type", value: "Private" },
          { name: "Type of Loan", value: "Secured" },
          { name: "Date of Loan Disbursement", value: "2026-03-01" },
          { name: "Loan Term", value: "240" },
          { name: "Loan Amount", value: "5000000" },
        ],
        tables: [],
      },
      {
        type: "RISK",
        attributes: [
          { name: "Accuity Risk Indicator", value: "Low" },
          { name: "Adverse IIB match", value: "N" },
          { name: "Risk Flag", value: "" },
          { name: "High Risk Category", value: "" },
        ],
        expandedAttributes: [
          { name: "Accuity Risk Indicator", value: "Low" },
          { name: "Adverse IIB match", value: "N" },
          { name: "Risk Flag", value: "" },
          { name: "High Risk Category", value: "" },
          { name: "Source", value: "Group Portal" },
        ],
        tables: [],
      },
    ],
  },
};

const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  { id: "proposal-documents", label: "Proposal Form & Documents" },
  { id: "previous-policies", label: "Previous Policy" },
  { id: "open-tasks", label: "Open Task" },
  { id: "audit-trail", label: "Audit Trail" },
];

export interface DvtUserProps {
  quickLinks?: QuickLinkItem[];
  previousPolicyMode?: "page" | "modal";
}

type BreDecision = {
  decision: string;
  remarks: string;
  discrepancy: string;
  action: string;
  timestamp: string;
  reTriggerCount: number;
};

// Mock BRE response (same values as /mock/drs/drs.mock.json in dvt-drs.html)
const mockBre: { breDecision: BreDecision; latestBreDecision: BreDecision } = {
  breDecision: {
    decision: "DC",
    remarks: "Product Non Eligible",
    discrepancy: "ACR#OCD#PAN#ADP#AGE#IDM#KYP",
    action: "Decline",
    timestamp: "14/08/2026, 1108hrs",
    reTriggerCount: 2,
  },
  latestBreDecision: {
    decision: "ST",
    remarks: "Product Non Eligible",
    discrepancy: "ACR#OCD#PAN#ADP#AGE#IDM#KYP#NYC",
    action: "Decline",
    timestamp: "14/08/2026, 1108hrs",
    reTriggerCount: 2,
  },
};

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
  const applicationNo =
    params.get("applicationNo")?.trim() || mockResponse.data.applicationNo;

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [previousPolicyOpen, setPreviousPolicyOpen] = useState(false);

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

  const { cardDetails } = mockResponse.data;
  const { breDecision, latestBreDecision } = mockBre;
  const [breDetailOpen, setBreDetailOpen] = useState(false);

  const handleBreRetrigger = () => console.log("BRE Retrigger clicked");
  const handleApplicantAction = (action: string) => (applicantId: string) =>
    console.log(`${action} clicked`, applicantId);

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
    <Box sx={{ position: "relative", minHeight: "100%", pb: 8 }}>
      <Box
        sx={{
          p: 2,
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

      <LifeAssured
        applicants={mockApplicants}
        onEdit={handleApplicantAction("Edit")}
        onViewMedical={handleApplicantAction("View Medical")}
        onViewFinancial={handleApplicantAction("View Financial")}
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
