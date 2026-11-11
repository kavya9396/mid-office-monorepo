import { Box } from "@mui/material";
import { OpenTasks } from "@insurance-poc/common/open-tasks";
import { useGuwQuickLinks } from "../drs/guwQuickLinks";

export function GroupOpenTasksPage() {
  const { loading, data } = useGuwQuickLinks();
  if (loading) return null;

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <OpenTasks tasks={data?.openTasks} />
    </Box>
  );
}

export default GroupOpenTasksPage;
