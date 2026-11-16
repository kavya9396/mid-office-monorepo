import { Box } from "@mui/material";
import { FieldCard, type FieldData } from "./Fields";

type PaymentPayoutProps = {
  paymentDetails: FieldData[];
  payoutDetails: FieldData[];
};

export function PaymentPayout({ paymentDetails, payoutDetails }: Readonly<PaymentPayoutProps>) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: 0.75,
        alignItems: "stretch",
      }}
    >
      <FieldCard title="Payment Details" fields={paymentDetails} />
      <FieldCard title="Payout Details" fields={payoutDetails} />
    </Box>
  );
}
