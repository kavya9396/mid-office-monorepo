import { Box } from "@mui/material";
import { OpenTasks } from "@insurance-poc/common/open-tasks";
import { useGroupQuickLinks } from "../drs/useGroupQuickLinks";

export function GroupOpenTasksPage() {
  const { data } = useGroupQuickLinks();
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <OpenTasks tasks={data?.openTasks} />
    </Box>
  );
}

export default GroupOpenTasksPage;
