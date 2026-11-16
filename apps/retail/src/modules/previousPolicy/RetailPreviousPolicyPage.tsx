import { Box } from "@mui/material";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";

export function RetailPreviousPolicyPage() {
  return (
    <Box sx={{ maxWidth: 1536, mx: "auto", p: { xs: 0.5, sm: 1 } }}>
      <PreviousPolicy />
    </Box>
  );
}

export default RetailPreviousPolicyPage;
