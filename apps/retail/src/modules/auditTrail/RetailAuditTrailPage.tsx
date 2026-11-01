import { Box } from "@mui/material";
import { AuditTrail } from "@insurance-poc/common/audit-trail";

export function RetailAuditTrailPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <AuditTrail />
    </Box>
  );
}

export default RetailAuditTrailPage;
