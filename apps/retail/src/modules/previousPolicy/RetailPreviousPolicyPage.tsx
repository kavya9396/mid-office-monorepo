import { Box } from "@mui/material";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";
import { useRetailQuickLinks } from "../drs/useRetailQuickLinks";

export function RetailPreviousPolicyPage() {
  const { data } = useRetailQuickLinks();
  return (
    <Box sx={{ maxWidth: 1536, mx: "auto", p: { xs: 0.5, sm: 1 } }}>
      <PreviousPolicy data={data?.previousPolicy} />
    </Box>
  );
}

export default RetailPreviousPolicyPage;
