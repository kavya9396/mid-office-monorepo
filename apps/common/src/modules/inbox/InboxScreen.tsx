import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { CustomButton, CustomSnackbar } from "@insurance-poc/ui";
import { getLastLoginAt } from "@insurance-poc/utils";
import {
  casesForTask,
  ROLE_POOL_KEYS,
  type InboxCase,
  type InboxData,
  type RolePoolKey,
} from "./inboxApi";
import { taskDetailsTitle, toDisplayLabel } from "./inboxFormat";
import { InboxSidebar } from "./InboxSidebar";
import { InboxTable } from "./InboxTable";

export type InboxBusiness = "RETAIL" | "GROUP";

type InboxScreenProps = {
  businessType: InboxBusiness;
  data: InboxData | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onLoadColumns?: (poolKey: string) => Promise<string[]>;
  onSaveColumns?: (poolKey: string, selectedFields: string[]) => Promise<string[]>;
};

export function InboxScreen({
  businessType,
  data,
  loading,
  error,
  onRetry,
  onLoadColumns,
  onSaveColumns,
}: Readonly<InboxScreenProps>) {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [casesOpen, setCasesOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState("ALL_CASES");
  const [lastLoginAt] = useState(() => getLastLoginAt());

  const pools = useMemo(() => {
    if (!data) return [] as RolePoolKey[];
    return ROLE_POOL_KEYS.filter((pool) => Object.hasOwn(data.poolData, pool));
  }, [data]);

  const counts = useMemo(() => {
    const next: Record<RolePoolKey, number> = {} as Record<RolePoolKey, number>;
    if (!data) return next;
    for (const pool of ROLE_POOL_KEYS) {
      next[pool] = data.poolData[pool]?.length ?? 0;
    }
    return next;
  }, [data]);

  const totalCount = data
    ? Object.values(data.poolData).reduce((total, cases) => total + (cases?.length ?? 0), 0)
    : 0;
  const poolSet = useMemo(() => new Set<RolePoolKey>(pools), [pools]);
  const activeTask =
    selectedTask === "ALL_CASES" || poolSet.has(selectedTask as RolePoolKey)
      ? selectedTask
      : "ALL_CASES";
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
    const routeFields = ["taskId", "instanceId", "roleType", "businessType"] as const;
    for (const field of routeFields) {
      const value = item.fields[field];
      if (typeof value === "string" && value.length > 0) query.set(field, value);
    }
    navigate(`/drs?${query.toString()}`);
  }

  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, backgroundColor: "#FFF8F3" }}>
        <CircularProgress size={42} thickness={4} sx={{ color: "#f58220" }} />
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          Loading inbox...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", alignItems: "stretch", overflow: "hidden", backgroundColor: "#FFF8F3" }}>
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
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", overflow: "hidden", p: 2 }}>
        {error.length > 0 ? (
          <Box sx={{ m: 2 }}>
            <Typography sx={{ mb: 1 }}>{error}</Typography>
            <CustomButtonRetry onRetry={onRetry} />
          </Box>
        ) : (
          <InboxTable
            title={taskDetailsTitle(activeTask)}
            cases={cases}
            poolKey={activeTask === "ALL_CASES" ? undefined : activeTask as RolePoolKey}
            onOpen={openCase}
            onLoadColumns={onLoadColumns}
            onSaveColumns={onSaveColumns}
            onColumnNotice={setNotice}
          />
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
