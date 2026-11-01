import { Box } from "@mui/material";
import { LifeAssured } from "@insurance-poc/common/life-assured";

export function RetailApplicantProfilePage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1536, mx: "auto" }}>
      <LifeAssured applicants={[]} />
    </Box>
  );
}

export default RetailApplicantProfilePage;
