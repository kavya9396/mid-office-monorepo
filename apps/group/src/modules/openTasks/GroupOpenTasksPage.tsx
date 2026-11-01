import { Box } from "@mui/material";
import { OpenTasks } from "@insurance-poc/common/open-tasks";

export function GroupOpenTasksPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <OpenTasks />
    </Box>
  );
}

export default GroupOpenTasksPage;
