import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { drsRoutePath } from "@insurance-poc/routes";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CustomButton, CustomLoader, CustomSnackbar } from "@insurance-poc/ui";
import {
  clearDrsTaskIds,
  getLastLoginAt,
  readApiErrorMessage,
  setDrsTaskIds,
} from "@insurance-poc/utils";
import type { ClaimTaskResponse } from "../../services/landingInboxQueries";
import {
  casesForTask,
  firstPoolKey,
  poolKeysInOrder,
  type InboxCase,
  type InboxData,
} from "./inboxApi";
import { taskDetailsTitle, toDisplayLabel } from "./inboxFormat";
import { InboxSidebar } from "./InboxSidebar";
import { InboxTable } from "./InboxTable";

export type InboxBusiness = "RETAIL" | "GROUP";

function readFieldText(value: InboxCase["fields"][string]): string {
  if (typeof value === "string") return value.trim();
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

type InboxScreenProps = {
  businessType: InboxBusiness;
  data: InboxData | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onLoadColumns?: (poolKey: string) => Promise<string[]>;
  onSaveColumns?: (poolKey: string, selectedFields: string[]) => Promise<string[]>;
  onClaimTask?: (taskId: string) => Promise<ClaimTaskResponse>;
};

export function InboxScreen({
  businessType,
  data,
  loading,
  error,
  onRetry,
  onLoadColumns,
  onSaveColumns,
  onClaimTask,
}: Readonly<InboxScreenProps>) {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [casesOpen, setCasesOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState("ALL_CASES");
  const [lastLoginAt] = useState(() => getLastLoginAt());

  useEffect(() => {
    clearDrsTaskIds();
  }, []);

  const pools = useMemo(() => {
    if (!data) return [] as string[];
    return poolKeysInOrder(data);
  }, [data]);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    if (!data) return next;
    for (const pool of pools) {
      next[pool] = data.poolData[pool]?.length ?? 0;
    }
    return next;
  }, [data, pools]);

  const totalCount = data
    ? Object.values(data.poolData).reduce((total, cases) => total + (cases?.length ?? 0), 0)
    : 0;
  const poolSet = useMemo(() => new Set(pools), [pools]);
  const activeTask = selectedTask === "ALL_CASES" || poolSet.has(selectedTask) ? selectedTask : "ALL_CASES";

  const columnContextKey = useMemo(() => {
    if (!data || pools.length === 0) return null;
    if (activeTask === "ALL_CASES") return firstPoolKey(data);
    return activeTask;
  }, [activeTask, data, pools.length]);

  const cases = useMemo(
    () => (data ? casesForTask(data, activeTask) : []),
    [activeTask, data],
  );

  async function openCase(item: InboxCase) {
    const caseBusiness = item.fields.businessType;
    if (typeof caseBusiness === "string" && caseBusiness.length > 0 && caseBusiness !== businessType) {
      setNotice(`Cannot open ${item.applicationNo} in the ${businessType} application.`);
      return;
    }
    if (item.applicationNo.length === 0) {
      setNotice("This task is missing an application number.");
      return;
    }
    // The DRS screen is picked from `roleType` (e.g. GUW vs DVT), so it must travel with the route.
    const drsQuery = new URLSearchParams({
      applicationNo: item.applicationNo,
      role: toDisplayLabel(item.poolName),
      roleType: readFieldText(item.fields.roleType) || item.poolName,
    });
    const drsTarget = `${drsRoutePath(item.applicationNo)}?${drsQuery.toString()}`;
    const taskId = readFieldText(item.fields.taskId);
    const instanceId = readFieldText(item.fields.instanceId);

    const persistTaskContext = () => {
      if (taskId.length > 0 && instanceId.length > 0) {
        setDrsTaskIds(taskId, instanceId);
      } else {
        clearDrsTaskIds();
      }
    };

    if (onClaimTask && taskId.length > 0) {
      try {
        const response = await onClaimTask(taskId);
        const errorCode = String(response?.errorCode ?? "").trim();
        const isSuccess =
          errorCode === "200" || (response?.success === true && errorCode !== "400");
        if (isSuccess) {
          persistTaskContext();
          navigate(drsTarget);
          return;
        }
        const apiMessage = String(response?.message ?? "").trim();
        if (apiMessage.length > 0) setNotice(apiMessage);
        return;
      } catch (err: unknown) {
        const apiMessage = readApiErrorMessage(err);
        if (apiMessage.length > 0) setNotice(apiMessage);
        return;
      }
    }

    persistTaskContext();
    navigate(drsTarget);
  }

  if (loading) {
    return <CustomLoader message="Loading inbox" height="100%" />;
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
            inboxData={data}
            columnContextKey={columnContextKey}
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
