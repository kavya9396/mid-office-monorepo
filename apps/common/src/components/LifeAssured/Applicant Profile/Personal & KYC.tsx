import { Box } from "@mui/material";
import { colors } from "@insurance-poc/ui";
import { FieldGrid, type FieldData } from "./Fields";

type PersonalKycProps = {
  personalFields: FieldData[];
  kycFields: FieldData[];
};

export function PersonalKyc({ personalFields, kycFields }: Readonly<PersonalKycProps>) {
  return (
    <Box sx={{ mt: 0, p: 1, backgroundColor: "background.default", borderRadius: "8px" }}>
      <FieldGrid items={personalFields} />
      <Box sx={{ borderTop: `1px solid ${colors.divider}`, my: 1 }} />
      <FieldGrid items={kycFields} />
    </Box>
  );
}
