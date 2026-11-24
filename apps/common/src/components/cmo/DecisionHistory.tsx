import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomTable,
  CustomTextField,
  CustomTypography,
  EyeIcon,
  type Column,
} from "@insurance-poc/ui";

import AddMedicalReportDialog from "./AddMedicalReportDialog";
import { CMO_DECISION_MASTER_EMPTY_MESSAGE, getCmoDecisionOptions } from "./cmoDecisionOptions";
import { type DecisionHistoryRow } from "./types";

const SAMPLE_ROWS: DecisionHistoryRow[] = [
  {
    id: "1",
    fupCode: "2DE",
    profile: "Life Assured",
    medicalTest: "2D ECHO",
    raisedDate: "1 Sep 2026",
    receivedDate: "2 Sep 2026",
    repeatTestCounter: "0",
    cmoRemarks: "",
    cmoDecision: "",
    remarksHistory: [
      {
        role: "Vendor CMO",
        name: "Dr. Meera Shah",
        ntid: "IPRU11021",
        date: "02 Sep 2026, 11:20",
        decision: "STD",
        remarks: "All medical parameters are within acceptable limits.",
      },
      {
        role: "HO CMO",
        name: "Dr. Alpana Gandhi",
        ntid: "IPRU84213",
        date: "03 Sep 2026, 09:15",
        decision: "STD",
        remarks: "Vendor CMO opinion accepted.",
      },
    ],
  },
  {
    id: "2",
    fupCode: "CXR",
    profile: "Life Assured",
    medicalTest: "CXR",
    raisedDate: "1 Sep 2026",
    receivedDate: "3 Sep 2026",
    repeatTestCounter: "0",
    cmoRemarks: "",
    cmoDecision: "",
    remarksHistory: [
      {
        role: "Vendor CMO",
        name: "Dr. Meera Shah",
        ntid: "IPRU11021",
        date: "03 Sep 2026, 16:40",
        decision: "Refer to 2nd Opinion",
        remarks: "Borderline ECG findings; cardiology review advised.",
      },
    ],
  },
];

const formatRaisedDate = (isoDate: string) => {
  if (!isoDate) return "-";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

type DecisionHistoryProps = Readonly<{
  rows?: DecisionHistoryRow[];
  readOnly?: boolean;
}>;

const DecisionHistory = ({ rows, readOnly = false }: DecisionHistoryProps) => {
  const [items, setItems] = useState<DecisionHistoryRow[]>(rows ?? SAMPLE_ROWS);
  const [addOpen, setAddOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<DecisionHistoryRow | null>(null);

  const updateRow = (id: string, patch: Partial<DecisionHistoryRow>) => {
    setItems((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };
  const cmoDecisionOptions = getCmoDecisionOptions();
  const missingCmoDecisions = cmoDecisionOptions.length === 0;

  const columns: Column<DecisionHistoryRow>[] = [
    { key: "fupCode", header: "FUP Code", width: "6%" },
    { key: "profile", header: "Profile", width: "8%" },
    { key: "medicalTest", header: "Medical Test", width: "8%" },
    { key: "raisedDate", header: "Raised Date", width: "8%" },
    { key: "receivedDate", header: "Received Date", width: "8%" },
    { key: "repeatTestCounter", header: "Repeat test counter", width: "11%" },
    {
      key: "cmoRemarks",
      header: "CMO Remarks",
      width: "25%",
      render: (_value, row) => (
        <CustomTextField
          fullWidth
          placeholder="Enter CMO remarks"
          disabled={readOnly}
          value={row.cmoRemarks}
          onChange={(event) => updateRow(row.id, { cmoRemarks: event.target.value })}
          sx={{
            "& .MuiOutlinedInput-root": { height: 40, minHeight: 40 },
          }}
        />
      ),
    },
    {
      key: "cmoDecision",
      header: "CMO Decision",
      width: "20%",
      render: (_value, row) => (
        <CustomSelect
          fullWidth
          placeholder={missingCmoDecisions ? CMO_DECISION_MASTER_EMPTY_MESSAGE : "Select decision"}
          disabled={readOnly || missingCmoDecisions}
          error={missingCmoDecisions}
          value={row.cmoDecision}
          options={cmoDecisionOptions}
          onChange={(value) => updateRow(row.id, { cmoDecision: value })}
        />
      ),
    },
    {
      key: "remarksHistory",
      header: "Remarks History",
      width: "8%",
      render: (_value, row) => (
        <CustomBox sx={{ display: "flex", justifyContent: "center" }}>
          <CustomButton
            variant="text"
            aria-label="Remarks history"
            disabled={row.remarksHistory.length === 0}
            onClick={() => setHistoryRow(row)}
            sx={{ minWidth: 0, p: 0.5 }}
          >
            <EyeIcon />
          </CustomButton>
        </CustomBox>
      ),
    },
  ];

  return (
    <>
      <CustomTable
        title="Decision History"
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        headerAction={
          readOnly ? null : (
            <CustomButton
              variant="outlined"
              onClick={() => setAddOpen(true)}
              sx={{
                minWidth: 72,
                borderRadius: "18px",
                backgroundColor: "#FFFFFF",
                color: "#A92129",
                borderColor: "#FFFFFF",
                "&:hover": { backgroundColor: "#FFF4EC", borderColor: "#FFFFFF" },
              }}
            >
              Add
            </CustomButton>
          )
        }
      />

      <AddMedicalReportDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(draft) => {
          setItems((current) => [
            ...current,
            {
              id: `${Date.now()}`,
              fupCode: "-",
              profile: "Life Assured",
              medicalTest: draft.medicalTest,
              raisedDate: formatRaisedDate(draft.testDate),
              receivedDate: "-",
              repeatTestCounter: "0",
              cmoRemarks: draft.remarks,
              cmoDecision: "",
              remarksHistory: [],
            },
          ]);
          setAddOpen(false);
        }}
      />

      <CustomDialog
        open={historyRow !== null}
        onClose={() => setHistoryRow(null)}
        title="Remarks History"
        maxWidth="sm"
      >
        <CustomBox sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {historyRow?.remarksHistory.map((entry) => (
            <CustomBox key={`${entry.ntid}-${entry.date}`}>
              <CustomTypography sx={{ fontSize: "12px", fontWeight: 700 }}>
                {entry.role} · {entry.name} · {entry.ntid}
              </CustomTypography>
              <CustomTypography sx={{ fontSize: "11px", color: "#4A4A4A" }}>
                {entry.date}
              </CustomTypography>
              <CustomTypography sx={{ fontSize: "12px", mt: 0.5 }}>
                {entry.decision} - {entry.remarks}
              </CustomTypography>
            </CustomBox>
          ))}
        </CustomBox>
      </CustomDialog>
    </>
  );
};

export default DecisionHistory;
