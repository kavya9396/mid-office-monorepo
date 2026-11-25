import { Box } from "@mui/material";
import { RiskDetails } from "@insurance-poc/common/risk-details";
import { getMasterList } from "@insurance-poc/utils";
import { CustomLoader } from "@insurance-poc/ui";
import { useRetailQuickLinks } from "../drs/useRetailQuickLinks";

/** Risk decision dropdown: `misc` master rows of type `CUW_RSK_DEC` (value = code, label = description). */
const readRiskDecisionOptions = () =>
  getMasterList("misc", "CUW_RSK_DEC")
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

export function RetailRiskDetailsPage() {
  const { data, loading } = useRetailQuickLinks();
  // RiskDetails copies `members` into state on first render, so wait for the DRS before mounting it.
  if (loading) return <CustomLoader message="Loading risk details" />;
  const members = data?.riskDetails;
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <RiskDetails
        members={members}
        decisionOptions={members ? readRiskDecisionOptions() : undefined}
        showEdit={false}
      />
    </Box>
  );
}

export default RetailRiskDetailsPage;
