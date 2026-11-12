import {
  CustomBox,
  CustomPagination,
  CustomTable,
  type Column,
} from "@insurance-poc/ui";
import { usePagination } from "./Requirement Mgmt/usePagination";

/* ------------------------------------------------------------------ */
/* GrievanceHistory - common table + pager, reused across screens.      */
/* Columns / widths / pager styling copied from                          */
/* mmt-grievance-prototype.html (`X8` columns, `F8` table, `Uq` pager).  */
/* ------------------------------------------------------------------ */

export type GrievanceHistoryRow = {
  userName: string;
  fupCode: string;
  profile: string;
  grievanceRemarks: string;
  tpaRemark: string;
  raisedDate: string;
  updatedDate: string;
  raisedBy: string;
  updatedBy: string;
};

export type GrievanceHistoryProps = {
  rows: GrievanceHistoryRow[];
  /** Rows per page. Prototype value: 5. */
  pageSize?: number;
  /** Prototype renders the pager disabled. */
  paginationDisabled?: boolean;
};

export const grievanceColumns: Column<GrievanceHistoryRow>[] = [
  { key: "userName", header: "User Name", width: "11%" },
  { key: "fupCode", header: "FUP Code", width: "8%" },
  { key: "profile", header: "Profile", width: "10%" },
  { key: "grievanceRemarks", header: "Grievance Remarks", width: "17%" },
  { key: "tpaRemark", header: "TPA Remark", width: "17%" },
  { key: "raisedDate", header: "Raised Date", width: "9%" },
  { key: "updatedDate", header: "Updated Date", width: "9%" },
  { key: "raisedBy", header: "Raised by", width: "10%" },
  { key: "updatedBy", header: "Updated By", width: "9%" },
];

export function GrievanceHistory({
  rows,
  pageSize = 5,
  paginationDisabled = true,
}: Readonly<GrievanceHistoryProps>) {
  const { page, setPage, pageCount, pageItems } = usePagination(rows, pageSize);

  return (
    <CustomBox data-testid="grievance-history">
      <CustomTable<GrievanceHistoryRow>
        title="Grievance History"
        columns={grievanceColumns}
        data={pageItems}
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

export default GrievanceHistory;
