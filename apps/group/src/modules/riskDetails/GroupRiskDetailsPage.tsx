import { Box } from "@mui/material";
import { RiskDetails } from "@insurance-poc/common/risk-details";
import { useGroupQuickLinks } from "../drs/useGroupQuickLinks";

export function GroupRiskDetailsPage() {
  const { data } = useGroupQuickLinks();
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <RiskDetails members={data?.riskDetails} />
    </Box>
  );
}

export default GroupRiskDetailsPage;
