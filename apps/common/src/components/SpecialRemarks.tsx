import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomPagination,
  CustomTable,
  type Column,
} from "@insurance-poc/ui";
import { usePagination } from "./Requirement Mgmt/usePagination";

/* ------------------------------------------------------------------ */
/* SpecialRemarks - common table + pager, reused across screens.       */
/*  - variant "readonly": view only.                                    */
/*  - variant "editable": adds a Validate action per row.               */
/* ------------------------------------------------------------------ */

export type SpecialRemarksVariant = "readonly" | "editable";

export type SpecialRemarksRow = {
  id: string;
  comments: string;
  updatedDate: string;
  updatedBy: string;
};

export type SpecialRemarksProps = {
  rows: SpecialRemarksRow[];
  variant?: SpecialRemarksVariant;
  /** Called when a row is validated (editable only). */
  onValidate?: (row: SpecialRemarksRow) => void;
  /** Rows per page. */
  pageSize?: number;
  paginationDisabled?: boolean;
};

const baseColumns: Column<SpecialRemarksRow>[] = [
  { key: "comments", header: "Comments", width: "450px" },
  { key: "updatedDate", header: "Updated Date", width: "150px" },
  { key: "updatedBy", header: "Updated By", width: "120px" },
];

export function SpecialRemarks({
  rows,
  variant = "readonly",
  onValidate,
  pageSize = 5,
  paginationDisabled = false,
}: Readonly<SpecialRemarksProps>) {
  const { page, setPage, pageCount, pageItems } = usePagination(rows, pageSize);
  const [validatedIds, setValidatedIds] = useState<string[]>([]);

  const columns: Column<SpecialRemarksRow>[] =
    variant === "editable"
      ? [
          ...baseColumns,
          {
            key: "id",
            header: "Action",
            width: "100px",
            render: (_value, row) => {
              const validated = validatedIds.includes(row.id);
              return (
                <CustomButton
                  disabled={validated}
                  onClick={() => {
                    setValidatedIds((prev) => [...prev, row.id]);
                    onValidate?.(row);
                  }}
                  sx={{
                    minHeight: "26px",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    "&.Mui-disabled": { background: "#cfc7c3", color: "#fff" },
                  }}
                >
                  {validated ? "Validated" : "Validate"}
                </CustomButton>
              );
            },
          },
        ]
      : baseColumns;

  return (
    <CustomBox data-testid="special-remarks">
      <CustomTable<SpecialRemarksRow>
        columns={columns}
        data={pageItems}
        getRowId={(row) => row.id}
      />
      <CustomBox sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <CustomPagination
          count={pageCount}
          page={page}
          onChange={setPage}
          disabled={paginationDisabled}
        />
      </CustomBox>
    </CustomBox>
  );
}

export default SpecialRemarks;
