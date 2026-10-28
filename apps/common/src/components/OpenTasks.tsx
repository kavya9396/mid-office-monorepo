import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  appTheme,
  CustomButton,
  CustomDialog,
  CustomTable,
  type Column,
} from "@insurance-poc/ui";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface OpenTaskItem {
  id?: string;
  callLogDate: string;
  serviceCallId: string;
  ct: string;
  st: string;
  callDetails: string;
  userPool: string;
  source: string;
  [key: string]: unknown;
}

export interface OpenTasksProps {
  tasks?: OpenTaskItem[];
  title?: string;
  pageSize?: number;
}

export interface OpenTasksDialogProps extends OpenTasksProps {
  open: boolean;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/* Static / Default Mock Data (copied from open-tasks.html prototype)         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_OPEN_TASKS: OpenTaskItem[] = [
  {
    id: "task-1",
    callLogDate: "22-Sep-2026 10:15",
    serviceCallId: "SC-260922-0142",
    ct: "CT-01",
    st: "ST-03",
    callDetails: "Review pending medical reports and confirm underwriting action.",
    userPool: "CUW",
    source: "CRM",
  },
  {
    id: "task-2",
    callLogDate: "22-Sep-2026 09:42",
    serviceCallId: "SC-260922-0128",
    ct: "CT-02",
    st: "ST-05",
    callDetails: "Validate income documents received against declared annual income.",
    userPool: "Financial UW",
    source: "Portal",
  },
  {
    id: "task-3",
    callLogDate: "21-Sep-2026 16:30",
    serviceCallId: "SC-260921-0097",
    ct: "CT-04",
    st: "ST-02",
    callDetails: "Customer requested a call regarding pending policy requirements.",
    userPool: "CUW",
    source: "Call Centre",
  },
  {
    id: "task-4",
    callLogDate: "21-Sep-2026 14:05",
    serviceCallId: "SC-260921-0084",
    ct: "CT-03",
    st: "ST-04",
    callDetails: "Review PIVV outcome and verify recorded responses before decision.",
    userPool: "PIVV",
    source: "Workflow",
  },
  {
    id: "task-5",
    callLogDate: "20-Sep-2026 11:20",
    serviceCallId: "SC-260920-0061",
    ct: "CT-02",
    st: "ST-01",
    callDetails: "Clarification required for identity document uploaded with proposal.",
    userPool: "CUW",
    source: "DMS",
  },
];

/* -------------------------------------------------------------------------- */
/* Theme Palette Values                                                       */
/* -------------------------------------------------------------------------- */

const { text, divider, grey } = appTheme.palette;

/* -------------------------------------------------------------------------- */
/* Columns Definition                                                         */
/* -------------------------------------------------------------------------- */

const OPEN_TASKS_COLUMNS: Column<OpenTaskItem>[] = [
  {
    key: "callLogDate",
    header: "Call log date",
    width: "15%",
    render: (value) => (
      <Typography component="span" sx={{ fontSize: "10.5px", color: "#393330" }}>
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "serviceCallId",
    header: "Service call ID",
    width: "14%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "10.5px",
          color: "#9a2529",
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "ct",
    header: "CT",
    width: "8%",
    render: (value) => (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          minWidth: 52,
          justifyContent: "center",
          px: "6px",
          py: "3px",
          borderRadius: "12px",
          bgcolor: "#f4f1ef",
          border: "1px solid #ddd5d1",
          color: "#5e5652",
          fontSize: "9px",
          fontWeight: 800,
        }}
      >
        {String(value ?? "-")}
      </Box>
    ),
  },
  {
    key: "st",
    header: "ST",
    width: "8%",
    render: (value) => (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          minWidth: 52,
          justifyContent: "center",
          px: "6px",
          py: "3px",
          borderRadius: "12px",
          bgcolor: "#f4f1ef",
          border: "1px solid #ddd5d1",
          color: "#5e5652",
          fontSize: "9px",
          fontWeight: 800,
        }}
      >
        {String(value ?? "-")}
      </Box>
    ),
  },
  {
    key: "callDetails",
    header: "Call Details",
    width: "30%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "10.5px",
          lineHeight: 1.35,
          color: "#393330",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "userPool",
    header: "User Pool",
    width: "15%",
    render: (value) => (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          maxWidth: "100%",
          px: "7px",
          py: "3px",
          borderRadius: "12px",
          bgcolor: "#fff0e7",
          border: "1px solid #f2cbb4",
          color: "#a84812",
          fontSize: "9px",
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {String(value ?? "-")}
      </Box>
    ),
  },
  {
    key: "source",
    header: "Source",
    width: "10%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "10.5px",
          fontWeight: 700,
          color: "#5c5551",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* OpenTasks Component                                                        */
/* -------------------------------------------------------------------------- */

export function OpenTasks({
  tasks = DEFAULT_OPEN_TASKS,
  title = "Open Tasks",
  pageSize = 5,
}: Readonly<OpenTasksProps>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = tasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${divider}`,
      }}
    >
      <Box
        sx={{
          height: 42,
          minHeight: 42,
          bgcolor: (theme) => theme.palette.primary.main,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.75,
        }}
      >
        <Typography component="h1" sx={{ m: 0, fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
          {title}
        </Typography>
        <Box
          component="span"
          sx={{
            px: 1.1,
            py: 0.35,
            borderRadius: "999px",
            bgcolor: "rgba(255, 255, 255, 0.2)",
            fontSize: "10px",
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          {`${tasks.length} Open`}
        </Box>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <CustomTable<OpenTaskItem>
          columns={OPEN_TASKS_COLUMNS}
          data={visibleRows}
        />
      </Box>

      <Box
        component="footer"
        sx={{
          height: 38,
          minHeight: 38,
          borderTop: `1px solid ${divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.25,
          fontSize: "10px",
          color: text.secondary,
          bgcolor: grey[50] || "#fcfbfa",
        }}
      >
        <Typography component="span" sx={{ fontSize: "10px", color: text.secondary }}>
          {`Showing ${visibleRows.length} of ${tasks.length} tasks`}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CustomButton
            variant="text"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            sx={{ minWidth: 24, height: 24, p: 0, color: text.secondary }}
          >
            ‹
          </CustomButton>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
            <CustomButton
              key={p}
              variant={p === currentPage ? "contained" : "text"}
              aria-label={`Page ${p}`}
              onClick={() => setPage(p)}
              sx={{
                minWidth: 24,
                height: 24,
                p: 0,
                fontSize: "10px",
                fontWeight: p === currentPage ? 800 : 500,
                ...(p === currentPage ? {} : { color: text.secondary }),
              }}
            >
              {p}
            </CustomButton>
          ))}

          <CustomButton
            variant="text"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            sx={{ minWidth: 24, height: 24, p: 0, color: text.secondary }}
          >
            ›
          </CustomButton>
        </Box>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* OpenTasksDialog Component                                                  */
/* -------------------------------------------------------------------------- */

export function OpenTasksDialog({
  open,
  onClose,
  tasks,
  title = "Open Tasks",
  pageSize = 5,
}: Readonly<OpenTasksDialogProps>) {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      paperSx={{ borderRadius: "8px", maxHeight: "calc(100vh - 64px)" }}
    >
      <OpenTasks tasks={tasks} title={title} pageSize={pageSize} />
    </CustomDialog>
  );
}

export default OpenTasks;
