import { useState } from "react";
import {
  grievanceColumns,
  type GrievanceHistoryRow,
} from "@insurance-poc/common/grievance-history";
import { usePagination } from "@insurance-poc/common/use-pagination";
import {
  CustomBox,
  CustomButton,
  CustomPagination,
  CustomTable,
  CustomTextField,
  type Column,
} from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* Grievance Decision grid ("TPA Grievance Details") - copied from      */
/* mmt-grievance-prototype.html: `F8` table with the `X8` columns,      */
/* TPA Remark input, `Uq` pager (disabled) and the `Submit` button.     */
/* Submit only validates (empty remark -> error state); no API call -   */
/* the submit API is built later (user decision).                       */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 5;

type MmtGrievanceDecisionProps = {
  rows: GrievanceHistoryRow[];
};

export function MmtGrievanceDecision({
  rows,
}: Readonly<MmtGrievanceDecisionProps>) {
  const [remarks, setRemarks] = useState<string[]>(() =>
    rows.map((row) => row.tpaRemark),
  );
  const [submitted, setSubmitted] = useState(false);

  const rowsWithRemarks = rows.map((row, index) => ({
    ...row,
    tpaRemark: remarks[index] ?? "",
  }));
  const { page, setPage, pageCount, pageItems } = usePagination(
    rowsWithRemarks,
    PAGE_SIZE,
  );

  function updateRemark(index: number, value: string): void {
    setRemarks((current) =>
      current.map((remark, i) => (i === index ? value : remark)),
    );
  }

  const columns: Column<GrievanceHistoryRow>[] = grievanceColumns.map(
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
        title="TPA Grievance Details"
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
          onClick={() => setSubmitted(true)}
          sx={{
            minWidth: 175,
            minHeight: 32,
            borderRadius: "18px",
            bgcolor: "#B3262E",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 700,
            "&:hover": { bgcolor: "#941F26" },
          }}
        >
          Submit
        </CustomButton>
      </CustomBox>
    </CustomBox>
  );
}
