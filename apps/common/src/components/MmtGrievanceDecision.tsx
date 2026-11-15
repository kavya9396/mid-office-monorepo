import { useEffect, useMemo, useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomPagination,
  CustomTable,
  CustomTextField,
  type Column,
} from "@insurance-poc/ui";
import { usePagination } from "./Requirement Mgmt/usePagination";
import { grievanceColumns, type GrievanceHistoryRow } from "./GrievanceHistory";

/* TPA Grievance Details grid — mmt-grievance-prototype.html `F8` / `X8` / `Uq`. */

const PAGE_SIZE = 5;

export type MmtGrievanceDecisionProps = {
  rows: GrievanceHistoryRow[];
  title?: string;
  columns?: Column<GrievanceHistoryRow>[];
  submitting?: boolean;
  onSubmit: (rows: GrievanceHistoryRow[]) => void;
};

export function MmtGrievanceDecision({
  rows,
  title = "TPA Grievance Details",
  columns: columnsProp,
  submitting = false,
  onSubmit,
}: Readonly<MmtGrievanceDecisionProps>) {
  const [remarks, setRemarks] = useState<string[]>(() => rows.map((row) => row.tpaRemark));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setRemarks(rows.map((row) => row.tpaRemark));
    setSubmitted(false);
  }, [rows]);

  const rowsWithRemarks = rows.map((row, index) => ({
    ...row,
    tpaRemark: remarks[index] ?? "",
  }));
  const { page, setPage, pageCount, pageItems } = usePagination(
    rowsWithRemarks,
    PAGE_SIZE,
  );

  const allRemarksFilled = useMemo(
    () => rows.length > 0 && remarks.every((remark) => remark.trim().length > 0),
    [remarks, rows.length],
  );

  function updateRemark(index: number, value: string): void {
    setRemarks((current) =>
      current.map((remark, i) => (i === index ? value : remark)),
    );
  }

  function handleSubmit(): void {
    setSubmitted(true);
    if (!allRemarksFilled) return;
    onSubmit(rowsWithRemarks);
  }

  const baseColumns = columnsProp ?? grievanceColumns;
  const columns: Column<GrievanceHistoryRow>[] = baseColumns.map(
    (column) =>
      column.key === "tpaRemark"
        ? {
            ...column,
            render: (_value, _row, rowIndex) => {
              const index = (page - 1) * PAGE_SIZE + rowIndex;
              const value = remarks[index] ?? "";
              return (
                <CustomTextField
                  fullWidth
                  required
                  placeholder="Enter TPA remark *"
                  value={value}
                  error={submitted && !value.trim()}
                  onChange={(event) => updateRemark(index, event.target.value)}
                />
              );
            },
          }
        : column,
  );

  return (
    <CustomBox data-testid="grievance-decision">
      <CustomTable<GrievanceHistoryRow>
        title={title}
        columns={columns}
        data={pageItems}
      />
      <CustomBox sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <CustomPagination
          count={pageCount}
          page={page}
          onChange={setPage}
          disabled
        />
      </CustomBox>
      <CustomBox sx={{ display: "flex", justifyContent: "center", pt: 0.35 }}>
        <CustomButton
          type="button"
          disabled={!allRemarksFilled || submitting}
          onClick={handleSubmit}
          sx={{
            minWidth: 175,
            minHeight: 32,
            borderRadius: "18px",
            bgcolor: "#B3262E",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 700,
            "&:hover": { bgcolor: "#941F26" },
            "&.Mui-disabled": { bgcolor: "#d4a5a8", color: "#FFFFFF" },
          }}
        >
          Submit
        </CustomButton>
      </CustomBox>
    </CustomBox>
  );
}

export default MmtGrievanceDecision;
