import { CustomBox, CustomTable, CustomTypography, type Column } from "@insurance-poc/ui";

export type PivvDetailRow = {
  id: string | number;
  fupCode: string;
  profile: string;
  raisedDate: string;
  raisedRemark: string;
  /** PIVV decisions (reasons); each one is shown as its own chip. */
  decisions: string[];
  pivvRemark: string;
};

export type PivvDetailsProps = {
  rows: PivvDetailRow[];
  /** Table title. */
  title?: string;
};

const COLUMNS: Column<PivvDetailRow>[] = [
  { key: "fupCode", header: "FUP Code", width: "9%" },
  { key: "profile", header: "Profile", width: "11%" },
  { key: "raisedDate", header: "Raised Date", width: "12%" },
  { key: "raisedRemark", header: "Raised Remark", width: "20%" },
  {
    key: "decisions",
    header: "PIVV Decision",
    width: "22%",
    render: (_value, row) => (
      <CustomBox sx={{ display: "grid", gap: 0.55, alignContent: "start", minWidth: 0 }}>
        {row.decisions.map((decision) => (
          <CustomBox
            key={`${row.id}-${decision}`}
            sx={{
              minHeight: 28,
              minWidth: 0,
              px: 1,
              py: 0.55,
              display: "flex",
              alignItems: "center",
              border: "1px solid #F3B38F",
              borderRadius: 1.1,
              bgcolor: "#FFF0E8",
            }}
          >
            <CustomTypography
              sx={{ fontSize: 11.5, fontWeight: 500, color: "#9A3E17", lineHeight: 1.25, overflowWrap: "anywhere" }}
            >
              {decision}
            </CustomTypography>
          </CustomBox>
        ))}
      </CustomBox>
    ),
  },
  { key: "pivvRemark", header: "PIVV Remark", width: "26%" },
];

/** "PIVV Details" table of the Retail CVT DRS: one row per PIVV requirement with its decisions and remark. */
export function PivvDetails({ rows, title = "PIVV Details" }: Readonly<PivvDetailsProps>) {
  return <CustomTable<PivvDetailRow> title={title} columns={COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

export default PivvDetails;
