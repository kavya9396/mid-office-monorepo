import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  CustomButton,
  CustomTooltip,
  KeyDownArrowIcon,
  KeyRightArrowIcon,
  KeyUpArrowIcon,
  SearchIcon,
} from "@insurance-poc/ui";
import { formatLastLogin, initials, toDisplayLabel } from "./inboxFormat";

type InboxSidebarProps = {
  pools: string[];
  counts: Record<string, number>;
  totalCount: number;
  selectedTask: string;
  collapsed: boolean;
  casesOpen: boolean;
  lastLoginAt: Date;
  onToggleCollapsed: () => void;
  onToggleCases: () => void;
  onSelectTask: (taskKey: string) => void;
};

const rowButtonSx = {
  width: "100%",
  height: "38px",
  display: "flex",
  alignItems: "center",
  border: 0,
  px: 1.5,
  py: 0,
  borderRadius: 0,
  font: "inherit",
  textAlign: "left",
  cursor: "pointer",
} as const;

function CountBadge({
  count,
  active,
}: Readonly<{ count: number; active: boolean }>) {
  return (
    <Box
      sx={{
        minWidth: "24px",
        height: "20px",
        px: "5px",
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
    <CustomButton
      variant="text"
      type="button"
      onClick={() => onSelect(taskKey)}
      sx={{
        ...rowButtonSx,
        justifyContent: collapsed ? "center" : "space-between",
        borderLeft: active ? "3px solid #9A2529" : "3px solid transparent",
        borderBottom: taskKey === "ALL_CASES" ? "1px solid #eeeeee" : 0,
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
              fontWeight: active || taskKey === "ALL_CASES" ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>
          <CountBadge count={count} active={active} />
        </>
      )}
    </CustomButton>
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
        height: "calc(100dvh - 57px)",
        flexShrink: 0,
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 0 }}
      >
        <CustomButton
          variant="text"
          type="button"
          aria-label={collapsed ? "Expand task list" : "Collapse task list"}
          onClick={onToggleCollapsed}
          sx={{
            ...rowButtonSx,
            height: "40px",
            justifyContent: collapsed ? "center" : "flex-end",
            borderBottom: "1px solid #eeeeee",
            color: "#9A2529",
          }}
        >
          <KeyRightArrowIcon
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}
          />
        </CustomButton>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
          <Box
            sx={{
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              px: 1.5,
              borderBottom: "1px solid #eeeeee",
              color: "#333333",
            }}
          >
            {collapsed ? null : (
              <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>Search Applications</Typography>
            )}
            <SearchIcon width={30} height={30} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "stretch" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TaskRow
                taskKey="ALL_CASES"
                count={totalCount}
                active={selectedTask === "ALL_CASES"}
                collapsed={collapsed}
                onSelect={onSelectTask}
              />
            </Box>
            {collapsed ? null : (
              <CustomButton
                variant="text"
                type="button"
                aria-label={casesOpen ? "Hide task pools" : "Show task pools"}
                onClick={onToggleCases}
                sx={{
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  color: "#333333",
                  px: 0.5,
                  py: 0,
                  minWidth: 28,
                  borderRadius: 0,
                }}
              >
                {casesOpen ? <KeyUpArrowIcon /> : <KeyDownArrowIcon />}
              </CustomButton>
            )}
          </Box>

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

        {collapsed ? null : (
          <Box sx={{ px: 1, py: 1, borderTop: "1px solid #eeeeee", backgroundColor: "#FFEAD7" }}>
            <Typography sx={{ fontSize: 12, color: "#000", fontWeight: 500 }}>
              {formatLastLogin(lastLoginAt)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
