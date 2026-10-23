import { Box } from "@mui/material";
import {
  DetailCard,
  type DetailAttribute,
  type DetailTable,
} from "@insurance-poc/common/detail-card";

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

const DvtUser = () => {
  const { cardDetails } = mockResponse.data;

  return (
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
  );
};

export default DvtUser;
