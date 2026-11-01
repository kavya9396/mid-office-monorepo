import { Box } from "@mui/material";
import { FieldCard, type FieldData } from "./Fields";

type ContactAddressProps = {
  communicationAddress: FieldData[];
  permanentAddress: FieldData[];
  contactDetails: FieldData[];
};

export function ContactAddress({
  communicationAddress,
  permanentAddress,
  contactDetails,
}: Readonly<ContactAddressProps>) {
  return (
    <Box
      sx={{
        mt: 0,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
        },
        gap: 0.75,
        alignItems: "stretch",
      }}
    >
      <FieldCard title="Communication Address" fields={communicationAddress} />
      <FieldCard title="Permanent Address" fields={permanentAddress} />
      <FieldCard title="Contact Details" fields={contactDetails} />
    </Box>
  );
}
