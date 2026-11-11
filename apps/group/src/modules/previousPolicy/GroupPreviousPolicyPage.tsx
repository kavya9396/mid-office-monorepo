import { Box } from "@mui/material";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";
import { useGuwQuickLinks } from "../drs/guwQuickLinks";

export function GroupPreviousPolicyPage() {
  const { loading, data } = useGuwQuickLinks();
  if (loading) return null;

  return (
    <Box sx={{ maxWidth: 1536, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <PreviousPolicy data={data?.previousPolicy} />
    </Box>
  );
}

export default GroupPreviousPolicyPage;
