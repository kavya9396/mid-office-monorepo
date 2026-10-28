import { Box, Typography } from "@mui/material";
import { CustomTable, type Column } from "@insurance-poc/ui";

export type NomineeRow = {
  nomineeName: string;
  nomineeDOB: string;
  gender: string;
  relationship: string;
  sharePercentage: number;
  isLASame: string;
  relationShipWithJL: string;
  laFlag: string;
};

export type AppointeeRow = {
  appointeeName: string;
  appointeeGender: string;
  appointeeDOB: string;
  appointeeRelationship: string;
};

const NOMINEE_COLUMNS: Column<NomineeRow>[] = [
  { key: "nomineeName", header: "Nominee Name", width: "14%" },
  { key: "nomineeDOB", header: "Nominee DOB", width: "12%" },
  { key: "gender", header: "Gender", width: "10%" },
  { key: "relationship", header: "Relationship with LA", width: "12%" },
  { key: "sharePercentage", header: "Share %", width: "10%" },
  { key: "isLASame", header: "is Life Same As Nominee", width: "10%" },
  { key: "relationShipWithJL", header: "Relationship With Joint Life", width: "10%" },
  { key: "laFlag", header: "Life Assured Flag", width: "10%" },
];

const APPOINTEE_COLUMNS: Column<AppointeeRow>[] = [
  { key: "appointeeName", header: "Appointee Name", width: "14%" },
  { key: "appointeeGender", header: "Appointee Gender", width: "12%" },
  { key: "appointeeDOB", header: "Appointee DOB", width: "12%" },
  { key: "appointeeRelationship", header: "Appointee Relationship", width: "12%" },
];

const EmptyText = ({ children }: Readonly<{ children: string }>) => (
  <Typography component="span" sx={{ fontSize: "14px", fontWeight: 700 }}>
    {children}
  </Typography>
);

type NomineeProps = {
  nominees: NomineeRow[];
  appointees: AppointeeRow[];
};

export function Nominee({ nominees, appointees }: Readonly<NomineeProps>) {
  if (nominees.length === 0 && appointees.length === 0) {
    return <EmptyText>No nominees have been selected</EmptyText>;
  }

  return (
    <>
      {nominees.length > 0 ? (
        <CustomTable<NomineeRow>
          title="Nominee Details"
          columns={NOMINEE_COLUMNS}
          data={nominees}
          getRowId={(row) => `${row.nomineeName}|${row.nomineeDOB}`}
        />
      ) : (
        <EmptyText>No nominees have been selected</EmptyText>
      )}
      <Box sx={{ mt: 2 }}>
        {appointees.length > 0 ? (
          <CustomTable<AppointeeRow>
            title="Appointee Details"
            columns={APPOINTEE_COLUMNS}
            data={appointees}
            getRowId={(row) => `${row.appointeeName}|${row.appointeeDOB}`}
          />
        ) : (
          <EmptyText>No appointees have been selected</EmptyText>
        )}
      </Box>
    </>
  );
}
