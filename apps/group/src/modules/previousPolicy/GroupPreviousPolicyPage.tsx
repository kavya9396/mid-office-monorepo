import { Box } from "@mui/material";
import { PreviousPolicy } from "@insurance-poc/common/previous-policy";

export function GroupPreviousPolicyPage() {
  return (
    <Box sx={{ maxWidth: 1536, mx: "auto", p: { xs: 1, sm: 2 } }}>
      <PreviousPolicy />
    </Box>
  );
}

export default GroupPreviousPolicyPage;
