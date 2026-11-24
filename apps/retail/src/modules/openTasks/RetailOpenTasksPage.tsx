import { Box } from "@mui/material";
import { OpenTasks } from "@insurance-poc/common/open-tasks";
import { useRetailQuickLinks } from "../drs/useRetailQuickLinks";

export function RetailOpenTasksPage() {
  const { data } = useRetailQuickLinks();
  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1536, mx: "auto" }}>
      <OpenTasks tasks={data?.openTasks} />
    </Box>
  );
}

export default RetailOpenTasksPage;
