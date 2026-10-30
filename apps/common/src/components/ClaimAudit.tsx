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
/* ClaimAudit - common table + pager, reused across screens.           */
/*  - variant "readonly": view only.                                    */
/*  - variant "editable": adds a Validate action per row.               */
/* ------------------------------------------------------------------ */

export type ClaimAuditVariant = "readonly" | "editable";

export type ClaimAuditRow = {
  id: string;
  policyNo: string;
  productCode: string;
  claimKey: string;
  canonicalId: string;
  patientName: string;
  ailment: string;
  claimType: string;
  subType: string;
  intimationDate: string;
  doa: string;
  dod: string;
  status: string;
};

export type ClaimAuditProps = {
  rows: ClaimAuditRow[];
  variant?: ClaimAuditVariant;
  /** Called when a row is validated (editable only). */
  onValidate?: (row: ClaimAuditRow) => void;
  /** Rows per page. */
  pageSize?: number;
  paginationDisabled?: boolean;
};

const baseColumns: Column<ClaimAuditRow>[] = [
  { key: "policyNo", header: "Policy Number" },
  { key: "productCode", header: "Product Code" },
  { key: "claimKey", header: "Claim Key" },
  { key: "canonicalId", header: "Canonical ID" },
  { key: "patientName", header: "Patient Name" },
  { key: "ailment", header: "Ailment for Communication" },
  { key: "claimType", header: "Claim Type" },
  { key: "subType", header: "Subtype" },
  { key: "intimationDate", header: "Intimation Date" },
  { key: "doa", header: "DOA" },
  { key: "dod", header: "DOD" },
  {
    key: "status",
    header: "Decision Status",
    render: (value) => {
      const isApproved = value === "Approved";
      return (
        <CustomBox
          component="span"
          sx={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: "12px",
            background: isApproved ? "#eef8f1" : "#fff1e6",
            color: isApproved ? "#28743c" : "#b06000",
            fontWeight: 800,
            fontSize: "10px",
          }}
        >
          {String(value)}
        </CustomBox>
      );
    },
  },
];

export function ClaimAudit({
  rows,
  variant = "readonly",
  onValidate,
  pageSize = 5,
  paginationDisabled = false,
}: Readonly<ClaimAuditProps>) {
  const { page, setPage, pageCount, pageItems } = usePagination(rows, pageSize);
  const [validatedIds, setValidatedIds] = useState<string[]>([]);

  const columns: Column<ClaimAuditRow>[] =
    variant === "editable"
      ? [
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
          ...baseColumns,
        ]
      : baseColumns;

  return (
    <CustomBox data-testid="claim-audit">
      <CustomTable<ClaimAuditRow>
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

export default ClaimAudit;
