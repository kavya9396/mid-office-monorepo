import { Box } from "@mui/material";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";
import { useGroupQuickLinks } from "../drs/useGroupQuickLinks";

export function GroupPreviousPolicyPage() {
  const { data } = useGroupQuickLinks();
  return (
    <Box sx={{ maxWidth: 1536, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <PreviousPolicy data={data?.previousPolicy} />
    </Box>
  );
}

export default GroupPreviousPolicyPage;
