import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  appTheme,
  CustomButton,
  CustomTable,
  type Column,
} from "@insurance-poc/ui";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuditTrailItem {
  id?: string;
  userId: string;
  userName: string;
  poolName: string;
  caseStatus: string;
  decision: string;
  comments: string;
  dateUpdatedOn: string;
  [key: string]: unknown;
}

export interface AuditTrailProps {
  items?: AuditTrailItem[];
  title?: string;
  pageSize?: number;
}

/* -------------------------------------------------------------------------- */
/* Static / Default Mock Data (copied from audit-trail.html prototype)        */
/* -------------------------------------------------------------------------- */

export const DEFAULT_AUDIT_TRAIL_ITEMS: AuditTrailItem[] = [
  {
    id: "audit-1",
    userId: "AC1024",
    userName: "Senior Underwriter",
    poolName: "Sr UW",
    caseStatus: "Referred",
    decision: "Refer",
    comments: "Case referred for senior review.\nAwaiting senior underwriter approval.",
    dateUpdatedOn: "07/09/2026 11:36:09",
  },
  {
    id: "audit-2",
    userId: "ipru75474",
    userName: "ipru75474",
    poolName: "CUW",
    caseStatus: "In Progress",
    decision: "Pending",
    comments: "Underwriting review initiated",
    dateUpdatedOn: "07/09/2026 10:52:41",
  },
  {
    id: "audit-3",
    userId: "UW304",
    userName: "Underwriting User",
    poolName: "UW",
    caseStatus: "Completed",
    decision: "Reject",
    comments: "Consent document not uploaded",
    dateUpdatedOn: "07/09/2026 09:22:07",
  },
  {
    id: "audit-4",
    userId: "CUW890",
    userName: "CUW Analyst",
    poolName: "CUW",
    caseStatus: "Referred",
    decision: "Refer",
    comments: "Medical review requested",
    dateUpdatedOn: "07/09/2026 08:54:14",
  },
  {
    id: "audit-5",
    userId: "UW327",
    userName: "Underwriting User",
    poolName: "UW",
    caseStatus: "Completed",
    decision: "Waived",
    comments: "Requirement waived as per guidelines",
    dateUpdatedOn: "07/09/2026 08:18:10",
  },
  {
    id: "audit-6",
    userId: "SUW203",
    userName: "Senior Underwriter",
    poolName: "Sr UW",
    caseStatus: "Completed",
    decision: "Accept",
    comments: "Senior underwriting review completed",
    dateUpdatedOn: "07/09/2026 08:04:28",
  },
  {
    id: "audit-7",
    userId: "HOD071",
    userName: "Head of Department",
    poolName: "HOD",
    caseStatus: "Referred",
    decision: "Refer",
    comments: "Case escalated for HOD approval.\nDecision is pending from the approver.",
    dateUpdatedOn: "07/09/2026 07:49:56",
  },
  {
    id: "audit-8",
    userId: "CMO112",
    userName: "Chief Medical Officer",
    poolName: "CMO",
    caseStatus: "In Progress",
    decision: "Pending",
    comments:
      "Medical opinion is under review and further supporting information is required before the final assessment can be completed.",
    dateUpdatedOn: "07/09/2026 07:35:19",
  },
  {
    id: "audit-9",
    userId: "UW405",
    userName: "Underwriting User",
    poolName: "UW",
    caseStatus: "Completed",
    decision: "Accept",
    comments: "Underwriting assessment approved",
    dateUpdatedOn: "07/09/2026 07:20:44",
  },
];

/* -------------------------------------------------------------------------- */
/* Theme Palette Values & Pool Color Palette                                  */
/* -------------------------------------------------------------------------- */

const { text, divider, grey } = appTheme.palette;

const POOL_COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  All: { bg: "#f5f3f2", text: "#514A46", badge: "#697780" },
  "Sr UW": { bg: "#eef6ff", text: "#2F668F", badge: "#46799F" },
  CUW: { bg: "#eef8f1", text: "#28743C", badge: "#28743C" },
  UW: { bg: "#fff3e8", text: "#b54a00", badge: "#E45F14" },
  HOD: { bg: "#fdebec", text: "#B3262E", badge: "#B3262E" },
  CMO: { bg: "#f3eeff", text: "#6C4AA0", badge: "#6C4AA0" },
};

/* -------------------------------------------------------------------------- */
/* Table Columns                                                              */
/* -------------------------------------------------------------------------- */

const AUDIT_TRAIL_COLUMNS: Column<AuditTrailItem>[] = [
  {
    key: "userId",
    header: "User ID",
    width: "8%",
    render: (value) => (
      <Typography component="span" sx={{ fontSize: "11px", color: "#4A4A4A" }}>
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "userName",
    header: "User Name",
    width: "10%",
    render: (value) => (
      <Typography component="span" sx={{ fontSize: "11px", color: "#4A4A4A" }}>
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "poolName",
    header: "Pool Name",
    width: "8%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "11px",
          fontWeight: 600,
          color: POOL_COLOR_MAP[String(value)]?.text ?? "#4A4A4A",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "caseStatus",
    header: "Case Status",
    width: "9%",
    render: (value) => (
      <Typography component="span" sx={{ fontSize: "11px", color: "#4A4A4A" }}>
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "decision",
    header: "Decision",
    width: "8%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "11px",
          fontWeight: 600,
          color:
            value === "Accept"
              ? "#28743C"
              : value === "Reject"
                ? "#B3262E"
                : "#4A4A4A",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "dateUpdatedOn",
    header: "Date Updated On",
    width: "12%",
    render: (value) => (
      <Typography component="span" sx={{ fontSize: "11px", color: "#4A4A4A" }}>
        {String(value ?? "-")}
      </Typography>
    ),
  },
  {
    key: "comments",
    header: "Comments/Remarks",
    width: "45%",
    render: (value) => (
      <Typography
        component="span"
        sx={{
          fontSize: "10px",
          lineHeight: 1.5,
          color: "#4A4A4A",
          whiteSpace: "pre-line",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {String(value ?? "-")}
      </Typography>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* AuditTrail Component                                                       */
/* -------------------------------------------------------------------------- */

export function AuditTrail({
  items = DEFAULT_AUDIT_TRAIL_ITEMS,
  title = "Assessment Comments",
  pageSize = 10,
}: Readonly<AuditTrailProps>) {
  const [selectedPool, setSelectedPool] = useState<string>("All");
  const [page, setPage] = useState<number>(1);

  // Available pools list
  const pools = useMemo(() => {
    const set = new Set(items.map((item) => item.poolName));
    return ["All", ...Array.from(set)];
  }, [items]);

  // Filter rows
  const filteredRows = useMemo(() => {
    if (selectedPool === "All") return items;
    return items.filter((item) => item.poolName === selectedPool);
  }, [items, selectedPool]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const visibleRows = filteredRows.slice(startIdx, startIdx + pageSize);

  const handlePoolChange = (pool: string) => {
    setSelectedPool(pool);
    setPage(1);
  };

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#ffffff",
        border: "1px solid #D8D8D8",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* Title Bar */}
      <Box
        sx={{
          bgcolor: (theme) => theme.palette.primary.main,
          color: "#ffffff",
          px: 3,
          py: 1.2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: 700,
          lineHeight: 1.5,
        }}
      >
        <Typography component="h1" sx={{ m: 0, fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
          {title}
        </Typography>
      </Box>

      {/* Pool Filters */}
      <Box
        role="group"
        aria-label="Filter by pool name"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.75,
          minHeight: 36,
          p: "6px 12px",
          borderBottom: "1px solid #E1E1E1",
          bgcolor: "#fafbfc",
        }}
      >
        {pools.map((pool) => {
          const count =
            pool === "All"
              ? items.length
              : items.filter((item) => item.poolName === pool).length;
          const isActive = pool === selectedPool;
          const styling = POOL_COLOR_MAP[pool] || POOL_COLOR_MAP.All;

          return (
            <Box
              key={pool}
              component="button"
              type="button"
              onClick={() => handlePoolChange(pool)}
              sx={{
                height: 24,
                px: 1,
                border: "1px solid",
                borderColor: isActive ? (theme) => theme.palette.primary.main : "#dde2e6",
                borderRadius: "12px",
                bgcolor: isActive ? "#fff1e6" : styling.bg,
                color: isActive ? "#C4500D" : styling.text,
                fontSize: "10.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                outline: "none",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: (theme) => theme.palette.primary.main,
                  bgcolor: "#fff1e6",
                },
                "&:focus-visible": {
                  outline: "2px solid #E45F14",
                  outlineOffset: 1,
                },
              }}
            >
              <span>{pool}</span>
              <Box
                component="span"
                sx={{
                  display: "inline-grid",
                  placeItems: "center",
                  minWidth: 17,
                  height: 17,
                  px: 0.5,
                  borderRadius: "9px",
                  bgcolor: styling.badge,
                  color: "#ffffff",
                  fontSize: "9.5px",
                  fontWeight: 700,
                }}
              >
                {count}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Table */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <CustomTable<AuditTrailItem>
          columns={AUDIT_TRAIL_COLUMNS}
          data={visibleRows}
        />
      </Box>

      {/* Pagination Footer */}
      <Box
        component="footer"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          minHeight: 42,
          p: "7px 16px",
          borderTop: `1px solid ${divider}`,
          bgcolor: grey[50] || "#ffffff",
        }}
      >
        <Typography component="span" sx={{ color: text.secondary, fontSize: "11px" }}>
          {filteredRows.length > 0
            ? `${startIdx + 1}-${Math.min(startIdx + pageSize, filteredRows.length)} of ${filteredRows.length}`
            : "0 of 0"}
        </Typography>

        <CustomButton
          variant="outlined"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          sx={{
            minWidth: 28,
            height: 28,
            p: 0,
            border: "1px solid #D8D8D8",
            borderRadius: "4px",
            color: "#9A2529",
            fontWeight: 700,
            "&:hover:not(:disabled)": { bgcolor: "#FFF0E5" },
            "&:disabled": { color: "#B5ADAA", borderColor: "#E7E2E0" },
          }}
        >
          ‹
        </CustomButton>

        <Typography component="span" sx={{ color: text.secondary, fontSize: "11px" }}>
          {`Page ${currentPage} of ${totalPages}`}
        </Typography>

        <CustomButton
          variant="outlined"
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          sx={{
            minWidth: 28,
            height: 28,
            p: 0,
            border: "1px solid #D8D8D8",
            borderRadius: "4px",
            color: "#9A2529",
            fontWeight: 700,
            "&:hover:not(:disabled)": { bgcolor: "#FFF0E5" },
            "&:disabled": { color: "#B5ADAA", borderColor: "#E7E2E0" },
          }}
        >
          ›
        </CustomButton>
      </Box>
    </Box>
  );
}

export default AuditTrail;
