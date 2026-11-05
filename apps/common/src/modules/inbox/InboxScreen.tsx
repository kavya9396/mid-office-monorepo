import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { CustomButton, CustomSnackbar } from "@insurance-poc/ui";
import { casesForTask, type InboxCase, type InboxData } from "./inboxApi";
import { DASHBOARD_TASK_KEYS, taskDetailsTitle, toDisplayLabel } from "./inboxFormat";
import { InboxSidebar } from "./InboxSidebar";
import { InboxTable } from "./InboxTable";

export type InboxBusiness = "RETAIL" | "GROUP";

type InboxScreenProps = {
  businessType: InboxBusiness;
  data: InboxData | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

export function InboxScreen({
  businessType,
  data,
  loading,
  error,
  onRetry,
}: Readonly<InboxScreenProps>) {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [casesOpen, setCasesOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState("ALL_CASES");
  const [lastLoginAt] = useState(() => new Date());

  const pools = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.poolData)
      .filter((pool) => !DASHBOARD_TASK_KEYS.has(pool))
      .sort((left, right) => left.localeCompare(right));
  }, [data]);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    if (!data) return next;
    for (const [pool, cases] of Object.entries(data.poolData)) {
      next[pool] = cases.length;
    }
    return next;
  }, [data]);

  const totalCount = data
    ? Object.values(data.poolData).reduce((total, cases) => total + cases.length, 0)
    : 0;
  const poolSet = useMemo(() => new Set(pools), [pools]);
  const activeTask = selectedTask === "ALL_CASES" || poolSet.has(selectedTask) ? selectedTask : "ALL_CASES";
  const cases = useMemo(
    () => (data ? casesForTask(data, activeTask) : []),
    [activeTask, data],
  );

  function openCase(item: InboxCase) {
    const caseBusiness = item.fields.businessType;
    if (typeof caseBusiness === "string" && caseBusiness.length > 0 && caseBusiness !== businessType) {
      setNotice(`Cannot open ${item.applicationNo} in the ${businessType} application.`);
      return;
    }
    if (item.applicationNo.length === 0) {
      setNotice("This task is missing an application number.");
      return;
    }
    const query = new URLSearchParams({
      applicationNo: item.applicationNo,
      role: toDisplayLabel(item.poolName),
    });
    navigate(`/drs?${query.toString()}`);
  }

  if (loading) {
    return (
      <Box sx={{ height: "calc(100dvh - 57px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, backgroundColor: "#f5f7fa" }}>
        <CircularProgress size={42} thickness={4} sx={{ color: "#f58220" }} />
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          Loading inbox...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "stretch", backgroundColor: "#f5f7fa", minHeight: "calc(100dvh - 57px)" }}>
      <InboxSidebar
        pools={pools}
        counts={counts}
        totalCount={totalCount}
        selectedTask={activeTask}
        collapsed={collapsed}
        casesOpen={casesOpen}
        lastLoginAt={lastLoginAt}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onToggleCases={() => setCasesOpen((current) => !current)}
        onSelectTask={setSelectedTask}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {error.length > 0 ? (
          <Box sx={{ m: 2 }}>
            <Typography sx={{ mb: 1 }}>{error}</Typography>
            <CustomButtonRetry onRetry={onRetry} />
          </Box>
        ) : (
          <InboxTable title={taskDetailsTitle(activeTask)} cases={cases} onOpen={openCase} />
        )}
      </Box>
      <CustomSnackbar open={notice.length > 0} message={notice} severity="error" onClose={() => setNotice("")} />
    </Box>
  );
}

function CustomButtonRetry({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <CustomButton variant="text" onClick={onRetry} sx={{ color: "#9A2529", p: 0, fontWeight: 700 }}>
      Retry
    </CustomButton>
  );
}
