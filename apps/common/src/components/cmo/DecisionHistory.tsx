import { useEffect, useState } from "react";
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
import { cmoDecisionFieldKey, type CmoRemarksHistoryEntry, type DecisionHistoryRow } from "./types";

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

type ViewRow = Record<string, string>;

type DecisionHistoryProps = Readonly<{
  title: string;
  columns: readonly string[];
  rows?: DecisionHistoryRow[] | null;
  readOnly?: boolean;
  /** Decision fetch in progress. Spinner stays in the table body. */
  loading?: boolean;
  /** API failure text, shown in the table body. */
  statusMessage?: string;
}>;

const REMARKS_FIELD = cmoDecisionFieldKey("CMO Remarks");
const DECISION_FIELD = cmoDecisionFieldKey("CMO Decision");
const HISTORY_FIELD = cmoDecisionFieldKey("Remarks History");
const MEDICAL_TYPE_FIELD = cmoDecisionFieldKey("Medical Type");
const RAISED_DATE_FIELD = cmoDecisionFieldKey("Raised Date");

function safeRows(rows: DecisionHistoryRow[] | null | undefined): DecisionHistoryRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const id = typeof row.id === "string" && row.id.length > 0 ? row.id : "";
    if (id.length === 0) return [];
    const fields: Record<string, string> = {};
    if (row.fields && typeof row.fields === "object") {
      for (const [key, value] of Object.entries(row.fields)) {
        fields[key] = value == null ? "" : String(value);
      }
    }
    return [{
      id,
      fields,
      remarksHistory: Array.isArray(row.remarksHistory) ? row.remarksHistory : [],
    }];
  });
}

const DecisionHistory = ({
  title,
  columns,
  rows,
  readOnly = false,
  loading = false,
  statusMessage = "",
}: DecisionHistoryProps) => {
  const [items, setItems] = useState<DecisionHistoryRow[]>(() => safeRows(rows));
  const [addOpen, setAddOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<{ label: string; entries: CmoRemarksHistoryEntry[] } | null>(null);

  useEffect(() => {
    setItems(safeRows(rows));
  }, [rows]);

  const updateField = (id: string, field: string, value: string) => {
    setItems((current) =>
      current.map((row) =>
        row.id === id ? { ...row, fields: { ...row.fields, [field]: value } } : row,
      ),
    );
  };
  const cmoDecisionOptions = getCmoDecisionOptions();
  const missingCmoDecisions = cmoDecisionOptions.length === 0;
  const viewRows: ViewRow[] = items.map((row) => ({ id: row.id, ...(row.fields ?? {}) }));
  const columnLabels = Array.isArray(columns) ? columns.filter((label) => label.trim().length > 0) : [];

  const tableColumns: Column<ViewRow>[] = columnLabels.map((label) => {
    const field = cmoDecisionFieldKey(label);
    if (field === REMARKS_FIELD) {
      return {
        key: field,
        header: label,
        render: (_value, row) => (
          <CustomTextField
            fullWidth
            placeholder="Enter CMO remarks"
            disabled={readOnly}
            value={row[field] ?? ""}
            onChange={(event) => updateField(row.id, field, event.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": { height: 40, minHeight: 40 },
            }}
          />
        ),
      };
    }
    if (field === DECISION_FIELD) {
      return {
        key: field,
        header: label,
        render: (_value, row) => (
          <CustomSelect
            fullWidth
            placeholder={missingCmoDecisions ? CMO_DECISION_MASTER_EMPTY_MESSAGE : "Select decision"}
            disabled={readOnly || missingCmoDecisions}
            error={missingCmoDecisions}
            value={row[field] ?? ""}
            options={cmoDecisionOptions}
            onChange={(value) => updateField(row.id, field, value)}
          />
        ),
      };
    }
    if (field === HISTORY_FIELD) {
      return {
        key: field,
        header: label,
        render: (_value, row) => {
          const history = items.find((item) => item.id === row.id)?.remarksHistory;
          const entries = Array.isArray(history) ? history : [];
          return (
            <CustomBox sx={{ display: "flex", justifyContent: "center" }}>
              <CustomButton
                variant="text"
                aria-label={label}
                disabled={entries.length === 0}
                onClick={() => setHistoryRow({ label, entries })}
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <EyeIcon />
              </CustomButton>
            </CustomBox>
          );
        },
      };
    }
    return { key: field, header: label };
  });

  return (
    <>
      <CustomTable
        title={title}
        columns={tableColumns}
        data={loading || statusMessage.length > 0 ? [] : viewRows}
        loading={loading}
        emptyMessage={statusMessage.length > 0 ? statusMessage : "No data available"}
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
              fields: {
                [MEDICAL_TYPE_FIELD]: draft.medicalTest,
                [RAISED_DATE_FIELD]: formatRaisedDate(draft.testDate),
                [REMARKS_FIELD]: draft.remarks,
              },
              remarksHistory: [],
            },
          ]);
          setAddOpen(false);
        }}
      />

      <CustomDialog
        open={historyRow !== null}
        onClose={() => setHistoryRow(null)}
        title={historyRow?.label ?? ""}
        maxWidth="sm"
      >
        <CustomBox sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {historyRow?.entries.map((entry, index) => (
            <CustomBox key={`${entry?.ntid ?? ""}-${entry?.date ?? ""}-${index}`}>
              <CustomTypography sx={{ fontSize: "12px", fontWeight: 700 }}>
                {entry?.role ?? ""} · {entry?.name ?? ""} · {entry?.ntid ?? ""}
              </CustomTypography>
              <CustomTypography sx={{ fontSize: "11px", color: "#4A4A4A" }}>
                {entry?.date ?? ""}
              </CustomTypography>
              <CustomTypography sx={{ fontSize: "12px", mt: 0.5 }}>
                {entry?.decision ?? ""} - {entry?.remarks ?? ""}
              </CustomTypography>
            </CustomBox>
          ))}
        </CustomBox>
      </CustomDialog>
    </>
  );
};

export default DecisionHistory;
