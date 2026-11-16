import { Box } from "@mui/material";
import { RiskDetails } from "@insurance-poc/common/risk-details";
import { getMasterList } from "@insurance-poc/utils";
import { CustomLoader } from "@insurance-poc/ui";
import { useGroupQuickLinks } from "../drs/useGroupQuickLinks";

/** Risk decision dropdown: `misc` master rows of type `GUW_RSK_DEC` (value = code, label = description). */
const readRiskDecisionOptions = () =>
  getMasterList("misc", "GUW_RSK_DEC")
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

export function GroupRiskDetailsPage() {
  const { data, loading } = useGroupQuickLinks();
  // RiskDetails copies `members` into state on first render, so wait for the DRS before mounting it.
  if (loading) return <CustomLoader message="Loading risk details" />;
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <RiskDetails
        members={data?.riskDetails}
        decisionOptions={readRiskDecisionOptions()}
        showEdit={false}
      />
    </Box>
  );
}

export default GroupRiskDetailsPage;
