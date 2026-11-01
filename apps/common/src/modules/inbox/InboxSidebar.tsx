import type { KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  CustomTooltip,
  KeyDownArrowIcon,
  KeyRightArrowIcon,
  KeyUpArrowIcon,
  SearchIcon,
} from "@insurance-poc/ui";
import type { RolePoolKey } from "./inboxApi";
import { formatLastLogin, initials, toDisplayLabel } from "./inboxFormat";

type InboxSidebarProps = {
  pools: RolePoolKey[];
  counts: Record<RolePoolKey, number>;
  totalCount: number;
  selectedTask: string;
  collapsed: boolean;
  casesOpen: boolean;
  lastLoginAt: Date | string | null;
  onToggleCollapsed: () => void;
  onToggleCases: () => void;
  onSelectTask: (taskKey: string) => void;
};

function activateOnKey(event: KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
}

function CountBadge({
  count,
  active,
  spaced = false,
}: Readonly<{ count: number; active: boolean; spaced?: boolean }>) {
  return (
    <Box
      sx={{
        minWidth: "24px",
        height: "20px",
        px: "5px",
        ml: spaced ? 1 : 0,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: active ? "#9A2529" : "#eeeeee",
        color: active ? "#ffffff" : "#555555",
        fontSize: "10px",
        fontWeight: 600,
      }}
    >
      {count}
    </Box>
  );
}

function TaskRow({
  taskKey,
  count,
  active,
  collapsed,
  onSelect,
}: Readonly<{
  taskKey: string;
  count: number;
  active: boolean;
  collapsed: boolean;
  onSelect: (taskKey: string) => void;
}>) {
  const label = taskKey === "ALL_CASES" ? "All Cases" : toDisplayLabel(taskKey);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onSelect(taskKey)}
      onKeyDown={(event) => activateOnKey(event, () => onSelect(taskKey))}
      sx={{
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        px: 1.5,
        cursor: "pointer",
        borderLeft: active ? "3px solid #9A2529" : "3px solid transparent",
        backgroundColor: active ? "#fdf2f2" : "transparent",
        color: active ? "#9A2529" : "#333333",
        "&:hover": { backgroundColor: "#f8f8f8" },
      }}
    >
      {collapsed ? (
        <CustomTooltip title={label} placement="right" arrow>
          <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>{initials(taskKey)}</Typography>
        </CustomTooltip>
      ) : (
        <>
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: active ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {label}
          </Typography>
          <CountBadge count={count} active={active} spaced />
        </>
      )}
    </Box>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
}: Readonly<{ collapsed: boolean; onToggle: () => void }>) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={collapsed ? "Expand task list" : "Collapse task list"}
      onClick={onToggle}
      onKeyDown={(event) => activateOnKey(event, onToggle)}
      sx={{
        height: "40px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-end",
        px: 1.5,
        cursor: "pointer",
        borderBottom: "1px solid #eeeeee",
      }}
    >
      <KeyRightArrowIcon
        style={{
          color: "#9A2529",
          transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.25s ease",
        }}
      />
    </Box>
  );
}

function SearchRow({ collapsed }: Readonly<{ collapsed: boolean }>) {
  return (
    <Box
      sx={{
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        px: 1.5,
        borderBottom: "1px solid #eeeeee",
        color: "#333333",
        "&:hover": { backgroundColor: "#f8f8f8" },
      }}
    >
      {collapsed ? null : (
        <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>Search Applications</Typography>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          flexShrink: 0,
          color: "#9A2529",
        }}
      >
        <SearchIcon width={30} height={30} />
      </Box>
    </Box>
  );
}

function AllCasesToggle({
  active,
  casesOpen,
  totalCount,
  onToggleCases,
}: Readonly<{
  active: boolean;
  casesOpen: boolean;
  totalCount: number;
  onToggleCases: () => void;
}>) {
  return (
    <Box
      onClick={(event) => {
        event.stopPropagation();
        onToggleCases();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        pl: 0.75,
        py: 0.25,
        pr: 0.35,
        borderRadius: 1,
        bgcolor: active ? "rgba(154, 37, 41, 0.1)" : "#f3f4f6",
      }}
    >
      <CountBadge count={totalCount} active={active} />
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {casesOpen ? <KeyUpArrowIcon /> : <KeyDownArrowIcon />}
      </Box>
    </Box>
  );
}

function AllCasesRow({
  collapsed,
  selectedTask,
  casesOpen,
  totalCount,
  onSelectTask,
  onToggleCases,
}: Readonly<{
  collapsed: boolean;
  selectedTask: string;
  casesOpen: boolean;
  totalCount: number;
  onSelectTask: (taskKey: string) => void;
  onToggleCases: () => void;
}>) {
  const active = selectedTask === "ALL_CASES";

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onSelectTask("ALL_CASES")}
      onKeyDown={(event) => activateOnKey(event, () => onSelectTask("ALL_CASES"))}
      sx={{
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        px: 1.5,
        cursor: "pointer",
        borderBottom: "1px solid #eeeeee",
        borderLeft: active ? "3px solid #9A2529" : "3px solid transparent",
        backgroundColor: active ? "#fdf2f2" : "transparent",
        color: active ? "#9A2529" : "#333333",
        "&:hover": { backgroundColor: "#f8f8f8" },
      }}
    >
      {collapsed ? (
        <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>{initials("ALL_CASES")}</Typography>
      ) : (
        <>
          <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>All Cases</Typography>
          <AllCasesToggle
            active={active}
            casesOpen={casesOpen}
            totalCount={totalCount}
            onToggleCases={onToggleCases}
          />
        </>
      )}
    </Box>
  );
}

function LastLoginFooter({ lastLoginAt }: Readonly<{ lastLoginAt: Date | string }>) {
  const text = formatLastLogin(lastLoginAt);
  return (
    <Box sx={{ flexShrink: 0, px: 0.75, py: 1, borderTop: "1px solid #eeeeee", backgroundColor: "#FFEAD7", overflow: "hidden" }}>
      <Typography
        title={text}
        sx={{ fontSize: 10, color: "#000", fontWeight: 500, whiteSpace: "nowrap", lineHeight: "16px" }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export function InboxSidebar({
  pools,
  counts,
  totalCount,
  selectedTask,
  collapsed,
  casesOpen,
  lastLoginAt,
  onToggleCollapsed,
  onToggleCases,
  onSelectTask,
}: Readonly<InboxSidebarProps>) {
  return (
    <Box
      sx={{
        width: collapsed ? "60px" : "220px",
        height: "100%",
        flexShrink: 0,
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 0, backgroundColor: "#ffffff" }}
      >
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            "&::-webkit-scrollbar": { width: "5px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#cccccc", borderRadius: "10px" },
          }}
        >
          <SearchRow collapsed={collapsed} />
          <AllCasesRow
            collapsed={collapsed}
            selectedTask={selectedTask}
            casesOpen={casesOpen}
            totalCount={totalCount}
            onSelectTask={onSelectTask}
            onToggleCases={onToggleCases}
          />
          {casesOpen
            ? pools.map((pool) => (
              <TaskRow
                key={pool}
                taskKey={pool}
                count={counts[pool] ?? 0}
                active={selectedTask === pool}
                collapsed={collapsed}
                onSelect={onSelectTask}
              />
            ))
            : null}
        </Box>

        {collapsed || !lastLoginAt ? null : <LastLoginFooter lastLoginAt={lastLoginAt} />}
      </Paper>
    </Box>
  );
}
