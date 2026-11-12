import { Box } from "@mui/material";
import { AuditTrail } from "@insurance-poc/common/audit-trail";
import { useGuwQuickLinks } from "../drs/guwQuickLinks";

export function GroupAuditTrailPage() {
  const { data } = useGuwQuickLinks();

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <AuditTrail items={data?.auditTrail} />
    </Box>
  );
}

export default GroupAuditTrailPage;
