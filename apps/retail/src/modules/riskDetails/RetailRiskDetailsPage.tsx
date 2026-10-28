import { Box } from "@mui/material";
import { RiskDetails } from "@insurance-poc/common/risk-details";

export function RetailRiskDetailsPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <RiskDetails />
    </Box>
  );
}

export default RetailRiskDetailsPage;
