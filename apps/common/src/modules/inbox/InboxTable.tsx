import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { readApiErrorMessage, useMock } from "@insurance-poc/utils";
import {
  colors,
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomTextField,
  DangerIcon,
  FilterIcon,
  KeyDownArrowIcon,
  KeyLeftArrowIcon,
  KeyRightArrowIcon,
  KeyUpArrowIcon,
  SearchIcon,
  SettingsIcon,
  TickIcon,
  TimeIcon,
} from "@insurance-poc/ui";
import { fieldKeysForPool, type InboxCase, type InboxData, type InboxFieldValue } from "./inboxApi";
import {
  columnsForPool,
  defaultVisibleColumns,
  formatColumnName,
  HIDDEN_COLUMNS,
  isApplicationColumn,
  MAX_VISIBLE_COLUMNS,
  orderedVisibleFromSelectedFields,
} from "./inboxFormat";

type SortDirection = "asc" | "desc";
type TimingStatus = "overdue" | "atRisk" | "normal";

type InboxTableProps = {
  title: string;
  cases: InboxCase[];
  /**
   * When set, overrides {@link useMock} from app config for pool-columns behavior only
   * (mock: default columns when API returns []; real: show exactly what API returns). Omit in production.
   */
  useMockOverride?: boolean;
  /** Full inbox data — used to derive per-pool field keys for configure-columns (available list). */
  inboxData?: InboxData | null;
  /**
   * GET /pool-columns uses this pool key (first pool key for All Cases; selected pool otherwise).
   * When null/undefined, column API and configure-columns are disabled.
   */
  columnContextKey?: string | null;
  onOpen: (item: InboxCase) => void;
  onLoadColumns?: (poolKey: string) => Promise<string[]>;
  onSaveColumns?: (poolKey: string, selectedFields: string[]) => Promise<string[]>;
  onColumnNotice?: (message: string) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];

function cellText(value: InboxFieldValue | undefined): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  if (value.includes("T") && value.length >= 19) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString("en-GB");
  }
  return value;
}

function fieldTime(value: InboxFieldValue | undefined): number | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function timingStatus(item: InboxCase, now: number): TimingStatus {
  const due = fieldTime(item.fields.dueDate ?? item.fields.due_date);
  if (due !== null && due < now) return "overdue";
  const risk = fieldTime(item.fields.atRiskTime ?? item.fields.at_risk_time);
  if (risk !== null && risk < now) return "atRisk";
  return "normal";
}

function priorityRank(status: TimingStatus): number {
  if (status === "overdue") return 0;
  if (status === "atRisk") return 1;
  return 2;
}

function columnKeys(cases: InboxCase[]): string[] {
  const keys = new Set<string>();
  for (const item of cases) {
    for (const key of Object.keys(item.fields)) {
      if (!HIDDEN_COLUMNS.has(key)) keys.add(key);
    }
  }
  return [...keys];
}

function columnError(reason: unknown): string {
  return readApiErrorMessage(reason);
}

function poolColumnsLoadError(reason: unknown): string {
  return readApiErrorMessage(reason);
}

function compareText(left: string, right: string, direction: SortDirection): number {
  const result = left.localeCompare(right, undefined, { numeric: true });
  return direction === "asc" ? result : -result;
}

function downloadCsv(title: string, columns: string[], rows: InboxCase[]): void {
  const header = columns.map(formatColumnName).join(",");
  const body = rows
    .map((row) => columns.map((column) => `"${cellText(row.fields[column]).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replaceAll(" ", "_")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function matchesFiltersRow(
  item: InboxCase,
  filters: Record<string, string[]>,
): boolean {
  for (const [column, selected] of Object.entries(filters)) {
    if (selected.length === 0) continue;
    if (!selected.includes(cellText(item.fields[column]))) return false;
  }
  return true;
}

function matchesSearchRow(item: InboxCase, columns: string[], query: string): boolean {
  if (query.length === 0) return true;
  return columns.some((column) => cellText(item.fields[column]).toLowerCase().includes(query));
}

type RealPoolColumnsStatus = "loading" | "success" | "error";

type ResolveColumnsResolvedInput = {
  useMockMode: boolean;
  loadPoolColumnsFromApi: boolean;
  realPoolStatus: RealPoolColumnsStatus | null;
  realPoolFields: string[];
  apiSelectedFields: string[] | null;
  catalogAll: string[];
  visible: string[];
  defaultColumns: string[];
};

function resolveColumnsResolved(params: Readonly<ResolveColumnsResolvedInput>): string[] {
  const { useMockMode, loadPoolColumnsFromApi, realPoolStatus, realPoolFields, apiSelectedFields, catalogAll, visible, defaultColumns } =
    params;
  if (useMockMode || !loadPoolColumnsFromApi) {
    const hasApiSelection = apiSelectedFields !== null && apiSelectedFields.length > 0;
    if (hasApiSelection) {
      return orderedVisibleFromSelectedFields(apiSelectedFields).filter((field) => catalogAll.includes(field));
    }
    if (visible.length > 0) return visible;
    return defaultColumns;
  }
  if (realPoolStatus === null) return [];
  if (realPoolStatus === "loading" || realPoolStatus === "error") return [];
  if (realPoolFields.length === 0) {
    return defaultColumns.filter((field) => catalogAll.includes(field));
  }
  return orderedVisibleFromSelectedFields(realPoolFields).filter((field) => catalogAll.includes(field));
}

function buildTableColumns(columnsResolved: string[]): string[] {
  if (columnsResolved.length === 0) return [];
  const applicationColumn = columnsResolved.find(isApplicationColumn) ?? "applicationNo";
  return [applicationColumn, ...columnsResolved.filter((column) => column !== applicationColumn)].slice(
    0,
    MAX_VISIBLE_COLUMNS,
  );
}

type SelectedFieldsForConfigureModalInput = {
  useMockMode: boolean;
  loadPoolColumnsFromApi: boolean;
  realPoolStatus: RealPoolColumnsStatus | null;
  realPoolFields: string[];
  apiSelectedFields: string[] | null;
  catalogAll: string[];
  columns: string[];
};

function selectedFieldsForConfigureModal(params: Readonly<SelectedFieldsForConfigureModalInput>): string[] {
  const { useMockMode, loadPoolColumnsFromApi, realPoolStatus, realPoolFields, apiSelectedFields, catalogAll, columns } = params;
  if (!useMockMode && loadPoolColumnsFromApi) {
    if (realPoolStatus !== "success") return [];
    const fromApi =
      apiSelectedFields !== null && apiSelectedFields.length > 0
        ? apiSelectedFields
        : realPoolFields;
    if (fromApi.length === 0) {
      return columns.filter((field) => catalogAll.includes(field));
    }
    return orderedVisibleFromSelectedFields(fromApi).filter((field) => catalogAll.includes(field));
  }
  if (apiSelectedFields !== null && apiSelectedFields.length > 0) {
    return orderedVisibleFromSelectedFields(apiSelectedFields).filter((field) => catalogAll.includes(field));
  }
  return columns;
}

function sortInboxRows(
  rows: InboxCase[],
  now: number,
  sortColumn: string,
  sortDirection: SortDirection,
): InboxCase[] {
  return [...rows].sort((left, right) => {
    const priorityDifference =
      priorityRank(timingStatus(left, now)) - priorityRank(timingStatus(right, now));
    if (priorityDifference !== 0) return priorityDifference;
    if (sortColumn.length === 0) return 0;
    return compareText(
      cellText(left.fields[sortColumn]),
      cellText(right.fields[sortColumn]),
      sortDirection,
    );
  });
}

type PoolColumnsLoaderParams = {
  useMockMode: boolean;
  catalogAll: string[];
  defaultColumnKeys: string[];
  configurePoolKey: string | undefined;
  columnContextKey: string | null | undefined;
  loadPoolColumnsFromApi: boolean;
  onLoadColumns: ((poolKey: string) => Promise<string[]>) | undefined;
  onColumnNotice: ((message: string) => void) | undefined;
};

type PoolColumnsLoaderResult = {
  visible: string[];
  setVisible: Dispatch<SetStateAction<string[]>>;
  apiSelectedFields: string[] | null;
  setApiSelectedFields: Dispatch<SetStateAction<string[] | null>>;
  realPoolStatus: RealPoolColumnsStatus | null;
  setRealPoolStatus: Dispatch<SetStateAction<RealPoolColumnsStatus | null>>;
  realPoolFields: string[];
  setRealPoolFields: Dispatch<SetStateAction<string[]>>;
  realPoolError: string;
  setRealPoolError: Dispatch<SetStateAction<string>>;
};

function usePoolColumnsLoader(params: Readonly<PoolColumnsLoaderParams>): PoolColumnsLoaderResult {
  const {
    useMockMode,
    catalogAll,
    defaultColumnKeys,
    configurePoolKey,
    columnContextKey,
    loadPoolColumnsFromApi,
    onLoadColumns,
    onColumnNotice,
  } = params;
  const [visible, setVisible] = useState<string[]>([]);
  const [apiSelectedFields, setApiSelectedFields] = useState<string[] | null>(null);
  const [realPoolStatus, setRealPoolStatus] = useState<RealPoolColumnsStatus | null>(null);
  const [realPoolFields, setRealPoolFields] = useState<string[]>([]);
  const [realPoolError, setRealPoolError] = useState("");

  useEffect(() => {
    if (useMockMode) {
      const defaults = defaultVisibleColumns(defaultColumnKeys);
      setVisible(defaults);
      setApiSelectedFields(null);
      setRealPoolStatus(null);
      setRealPoolFields([]);
      setRealPoolError("");
      if (!columnContextKey || !onLoadColumns) return;
      let current = true;
      onLoadColumns(columnContextKey)
        .then((fields) => {
          if (!current) return;
          if (fields.length === 0) {
            setApiSelectedFields(null);
            return;
          }
          setApiSelectedFields(fields);
          const ordered = orderedVisibleFromSelectedFields(fields);
          const matched = ordered.filter((field) => catalogAll.includes(field));
          if (matched.length > 0) setVisible(matched);
        })
        .catch((reason: unknown) => {
          if (!current) return;
          const message = poolColumnsLoadError(reason);
          if (message.length > 0) onColumnNotice?.(message);
        });
      return () => {
        current = false;
      };
    }

    if (!loadPoolColumnsFromApi) {
      const defaults = defaultVisibleColumns(defaultColumnKeys);
      setVisible(defaults);
      setApiSelectedFields(null);
      setRealPoolStatus(null);
      setRealPoolFields([]);
      setRealPoolError("");
      return;
    }

    setApiSelectedFields(null);
    setVisible([]);
    setRealPoolStatus("loading");
    setRealPoolFields([]);
    setRealPoolError("");
    let current = true;
    if (!columnContextKey || !onLoadColumns) {
      setRealPoolStatus("success");
      setRealPoolFields([]);
      return;
    }
    onLoadColumns(columnContextKey)
      .then((fields) => {
        if (!current) return;
        setRealPoolFields(fields);
        setRealPoolStatus("success");
        setRealPoolError("");
      })
      .catch((reason: unknown) => {
        if (!current) return;
        const msg = poolColumnsLoadError(reason);
        onColumnNotice?.(msg);
        setRealPoolError(msg);
        setRealPoolStatus("error");
        setRealPoolFields([]);
      });
    return () => {
      current = false;
    };
  }, [
    catalogAll,
    columnContextKey,
    configurePoolKey,
    defaultColumnKeys,
    loadPoolColumnsFromApi,
    onColumnNotice,
    onLoadColumns,
    useMockMode,
  ]);

  return {
    visible,
    setVisible,
    apiSelectedFields,
    setApiSelectedFields,
    realPoolStatus,
    setRealPoolStatus,
    realPoolFields,
    setRealPoolFields,
    realPoolError,
    setRealPoolError,
  };
}

function PriorityLegend({
  cases,
  active,
  onSelect,
}: Readonly<{
  cases: InboxCase[];
  active: TimingStatus | null;
  onSelect: (status: TimingStatus) => void;
}>) {
  const now = Date.now();
  let highPriority = 0;
  let atRisk = 0;
  let normal = 0;
  for (const item of cases) {
    const status = timingStatus(item, now);
    if (status === "overdue") highPriority += 1;
    if (status === "atRisk") atRisk += 1;
    if (status === "normal") normal += 1;
  }

  const items = [
    { status: "overdue" as const, label: "High Priority", color: "#D32F2F", count: highPriority, icon: <DangerIcon width={14} height={14} /> },
    { status: "atRisk" as const, label: "At Risk", color: "#ED8A00", count: atRisk, icon: <TimeIcon width={14} height={14} /> },
    { status: "normal" as const, label: "Normal", color: "#155a87", count: normal, icon: <TickIcon width={14} height={14} /> },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, whiteSpace: "nowrap" }}>
      {items.map((item) => (
        <Box
          key={item.label}
          role="button"
          tabIndex={0}
          aria-pressed={active === item.status}
          onClick={() => onSelect(item.status)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelect(item.status);
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            borderRadius: "12px",
            px: 0.75,
            py: 0.25,
            backgroundColor: active === item.status ? `${item.color}14` : "transparent",
            outline: active === item.status ? `1px solid ${item.color}` : "none",
          }}
        >
          <Box
            sx={{
              width: "14px",
              height: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: item.color,
            }}
          >
            {item.icon}
          </Box>
          <Typography component="span" sx={{ fontSize: "10px", lineHeight: 1, color: "#4b5055" }}>
            {item.label}
          </Typography>
          <Box
            component="span"
            sx={{
              minWidth: "16px",
              height: "16px",
              px: 0.5,
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${item.color}14`,
              color: item.color,
              fontSize: "10px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {item.count}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

type InboxTableToolbarProps = {
  title: string;
  columns: string[];
  sorted: InboxCase[];
  cases: InboxCase[];
  priorityFilter: TimingStatus | null;
  onTogglePriority: (status: TimingStatus) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onFilterClick: () => void;
  showConfigureColumns: boolean;
  onConfigureClick: () => void;
};

function InboxTableToolbar(props: Readonly<InboxTableToolbarProps>) {
  const {
    title,
    columns,
    sorted,
    cases,
    priorityFilter,
    onTogglePriority,
    searchOpen,
    onToggleSearch,
    searchText,
    onSearchTextChange,
    onFilterClick,
    showConfigureColumns,
    onConfigureClick,
  } = props;
  const toolbarIconSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    flexShrink: 0,
    cursor: "pointer",
  } as const;

  return (
    <Box
      sx={{
        flexShrink: 0,
        height: "48px",
        minHeight: "48px",
        px: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.borderSoft}`,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <CustomButton
          size="small"
          variant="outlined"
          onClick={() => downloadCsv(title, columns, sorted)}
          sx={{ fontSize: "10px", flexShrink: 0 }}
        >
          Download Excel
        </CustomButton>
        <PriorityLegend cases={cases} active={priorityFilter} onSelect={onTogglePriority} />
      </Box>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: "calc(100% + 4px)",
            top: "50%",
            transform: "translateY(-50%)",
            width: "200px",
            visibility: searchOpen ? "visible" : "hidden",
            opacity: searchOpen ? 1 : 0,
            pointerEvents: searchOpen ? "auto" : "none",
            zIndex: 1,
          }}
        >
          <CustomTextField
            size="small"
            value={searchText}
            placeholder="Search..."
            tabIndex={searchOpen ? 0 : -1}
            aria-hidden={!searchOpen}
            onChange={(event) => {
              onSearchTextChange(event.target.value);
            }}
            sx={{
              width: "200px",
              backgroundColor: colors.white,
              "& .MuiOutlinedInput-root": {
                height: "32px",
                minHeight: "32px",
                fontSize: "11px",
              },
              "& .MuiOutlinedInput-input": {
                py: 0.5,
                px: 1,
              },
            }}
          />
        </Box>
        <Box aria-label="Search cases" onClick={onToggleSearch} sx={toolbarIconSx}>
          <SearchIcon width={32} height={32} />
        </Box>
        <Box aria-label="Filter cases" onClick={onFilterClick} sx={toolbarIconSx}>
          <FilterIcon width={32} />
        </Box>
        {showConfigureColumns ? (
          <Box aria-label="Configure columns" onClick={onConfigureClick} sx={toolbarIconSx}>
            <SettingsIcon width={32} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

type InboxCasesTableProps = {
  columns: string[];
  sortColumn: string;
  sortDirection: SortDirection;
  onToggleSort: (column: string) => void;
  pageRows: InboxCase[];
  now: number;
  onOpen: (item: InboxCase) => void;
};

type InboxCasesTableBodyParams = {
  columns: string[];
  pageRows: InboxCase[];
  now: number;
  onOpen: (item: InboxCase) => void;
};

function renderInboxCasesTableBody(params: Readonly<InboxCasesTableBodyParams>): ReactNode {
  const { columns, pageRows, now, onOpen } = params;
  const noColumnsButHasRows = columns.length === 0 && pageRows.length > 0;
  if (noColumnsButHasRows) {
    return (
      <TableRow>
        <TableCell
          colSpan={1}
          align="center"
          sx={{ height: "80px", color: "#8a8f94", fontSize: "11px", borderBottom: 0 }}
        >
          No columns returned for this pool
        </TableCell>
      </TableRow>
    );
  }
  if (pageRows.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={Math.max(columns.length, 1)}
          align="center"
          sx={{ height: "80px", color: "#8a8f94", fontSize: "11px", borderBottom: 0 }}
        >
          No data available
        </TableCell>
      </TableRow>
    );
  }
  return pageRows.map((row) => {
    const status = timingStatus(row, now);
    const warningColor = status === "overdue" ? "#D32F2F" : "#C05600";
    return (
      <TableRow
        key={row.rowId}
        hover
        sx={{
          height: "30px",
          "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
          "&:hover": { backgroundColor: "#f3f7fa" },
          "&:last-child td": { borderBottom: 0 },
        }}
      >
        {columns.map((column) => {
          const value = cellText(row.fields[column]);
          const applicationColumn = isApplicationColumn(column);
          const color = status === "normal" ? "#155a87" : warningColor;
          return (
            <TableCell
              key={column}
              title={value}
              sx={{
                height: "30px",
                padding: "0 10px",
                fontSize: "11px",
                lineHeight: 1.1,
                color: applicationColumn ? color : "#4b5055",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                borderBottom: "1px solid #eeeeee",
              }}
            >
              {applicationColumn ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => onOpen(row)}
                  sx={{
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    maxWidth: "100%",
                    p: 0,
                    border: 0,
                    background: "transparent",
                    color,
                    font: "inherit",
                    fontSize: "11px",
                    fontWeight: 500,
                    lineHeight: 1.1,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    "&:hover": { color: status === "normal" ? "#9A2529" : warningColor },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: "14px",
                      height: "14px",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {status === "normal" ? null : <DangerIcon width={14} height={14} />}
                  </Box>
                  <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value}
                  </Box>
                </Box>
              ) : (
                value
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );
  });
}

function InboxCasesTable(props: Readonly<InboxCasesTableProps>) {
  const { columns, sortColumn, sortDirection, onToggleSort, pageRows, now, onOpen } = props;
  return (
    <TableContainer
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflowX: "hidden",
        overflowY: "auto",
        boxSizing: "border-box",
        "&::-webkit-scrollbar": { width: "6px", height: "6px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#c7cdd3", borderRadius: "10px" },
        "&::-webkit-scrollbar-track": { backgroundColor: "#f7f8f9" },
      }}
    >
      <Table
        stickyHeader
        size="small"
        sx={{ width: "100%", tableLayout: "fixed", "& .MuiTableCell-root": { boxSizing: "border-box" } }}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => {
              const isAppCol = isApplicationColumn(column);
              const label = formatColumnName(column);
              return (
                <TableCell
                  key={column}
                  onClick={() => onToggleSort(column)}
                  sx={{
                    width: isAppCol ? "16%" : undefined,
                    height: "30px",
                    padding: isAppCol ? "0 10px 0 28px" : "0 10px",
                    backgroundColor: "#eef1f4",
                    color: "#20252a",
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    borderBottom: "1px solid #d9dde1",
                    cursor: "pointer",
                    userSelect: "none",
                    "&:hover": { backgroundColor: "#e7ebee" },
                  }}
                >
                  <Tooltip title={label} placement="top" arrow enterDelay={300}>
                    <TableSortLabel
                      active={sortColumn === column}
                      direction={sortColumn === column ? sortDirection : "asc"}
                      sx={{
                        maxWidth: "100%",
                        minWidth: 0,
                        color: "#20252a",
                        "&:hover": { color: "#20252a" },
                        "&.Mui-active": { color: "#0D4C7D" },
                        "& .MuiTableSortLabel-icon": {
                          width: "14px",
                          height: "14px",
                          marginLeft: "3px",
                          color: "#8a8f94 !important",
                          opacity: 0.65,
                          flexShrink: 0,
                        },
                        "&.Mui-active .MuiTableSortLabel-icon": { color: "#0D4C7D !important", opacity: 1 },
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          minWidth: 0,
                          fontSize: "11px",
                          fontWeight: 600,
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </Typography>
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>{renderInboxCasesTableBody({ columns, pageRows, now, onOpen })}</TableBody>
      </Table>
    </TableContainer>
  );
}

type InboxFilterDialogProps = {
  open: boolean;
  onClose: () => void;
  columns: string[];
  cases: InboxCase[];
  draftFilters: Record<string, string[]>;
  setDraftFilters: Dispatch<SetStateAction<Record<string, string[]>>>;
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  onApply: () => void;
};

function InboxFilterDialog(props: Readonly<InboxFilterDialogProps>) {
  const { open, onClose, columns, cases, draftFilters, setDraftFilters, activeFilter, setActiveFilter, onApply } = props;
  const filterColumn = columns.includes(activeFilter) ? activeFilter : (columns[0] ?? "");
  const filterOptions = [...new Set(cases.map((item) => cellText(item.fields[filterColumn])))].filter(
    (value) => value !== "-",
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="FILTER"
      maxWidth="md"
      fullWidth
      contentSx={{
        p: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      actionsSx={{ justifyContent: "center", gap: 2, pb: 3 }}
      actions={
        <>
          <CustomButton variant="outlined" onClick={() => setDraftFilters({})} sx={{ px: 4 }}>
            Clear All
          </CustomButton>
          <CustomButton variant="contained" onClick={onApply} sx={{ px: 4 }}>
            Apply
          </CustomButton>
        </>
      }
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "min(420px, calc(100vh - 220px))",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: "40%",
            flexShrink: 0,
            borderRight: `1px solid ${colors.borderLight}`,
            overflow: "hidden",
          }}
        >
          {columns.map((column) => (
            <Box
              key={column}
              onClick={() => setActiveFilter(column)}
              sx={{
                padding: "12px",
                cursor: "pointer",
                fontSize: "14px",
                color: colors.textLabel,
                backgroundColor: filterColumn === column ? colors.surfaceHover : "transparent",
                borderLeft:
                  filterColumn === column ? `4px solid ${colors.primary}` : "4px solid transparent",
              }}
            >
              {formatColumnName(column)}
            </Box>
          ))}
          {columns.length === 0 ? (
            <Box sx={{ padding: "12px", color: colors.textMuted }}>No visible columns to filter</Box>
          ) : null}
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            p: 2,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          {filterOptions.map((option) => (
            <Box key={option} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CustomCheckbox
                label={option}
                checked={(draftFilters[filterColumn] ?? []).includes(option)}
                onChange={() => {
                  setDraftFilters((current) => {
                    const selected = current[filterColumn] ?? [];
                    const next = selected.includes(option)
                      ? selected.filter((value) => value !== option)
                      : [...selected, option];
                    return { ...current, [filterColumn]: next };
                  });
                }}
              />
            </Box>
          ))}
          {filterColumn.length > 0 && filterOptions.length === 0 ? (
            <Box sx={{ color: colors.textMuted, fontSize: "14px" }}>No values available for this column</Box>
          ) : null}
        </Box>
      </Box>
    </CustomDialog>
  );
}

type InboxConfigureColumnsDialogProps = {
  open: boolean;
  onClose: () => void;
  savingColumns: boolean;
  draftSelected: string[];
  draftAvailable: string[];
  pickedAvailable: string[];
  pickedSelected: string[];
  togglePicked: (column: string, selected: boolean) => void;
  movePickedToSelected: () => void;
  movePickedToAvailable: () => void;
  moveDraft: (index: number, direction: -1 | 1) => void;
  onReset: () => void;
  onSave: () => void;
};

function InboxConfigureColumnsDialog(props: Readonly<InboxConfigureColumnsDialogProps>) {
  const {
    open,
    onClose,
    savingColumns,
    draftSelected,
    draftAvailable,
    pickedAvailable,
    pickedSelected,
    togglePicked,
    movePickedToSelected,
    movePickedToAvailable,
    moveDraft,
    onReset,
    onSave,
  } = props;
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Configure Columns"
      maxWidth="md"
      fullWidth
      actionsSx={{ justifyContent: "center", pb: 2 }}
      actions={
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: "100%" }}>
          <CustomButton size="small" variant="outlined" disabled={savingColumns} onClick={onReset} sx={{ fontSize: "12px", px: 2 }}>
            {savingColumns ? "Saving..." : "Reset"}
          </CustomButton>
          <CustomButton
            size="small"
            variant="contained"
            disabled={draftSelected.length === 0 || savingColumns}
            onClick={onSave}
            sx={{ fontSize: "12px", px: 2 }}
          >
            {savingColumns ? "Saving..." : "Save"}
          </CustomButton>
        </Box>
      }
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%", mt: 2 }}>
        <ColumnPickerPane
          title="Available Columns"
          countLabel={`${draftAvailable.length} columns`}
          columns={draftAvailable}
          emptyLabel="No available columns"
          renderItem={(column) => {
            const full = draftSelected.length >= MAX_VISIBLE_COLUMNS;
            return (
              <ListItemButton disabled={full && !pickedAvailable.includes(column)} sx={{ minHeight: "32px", py: 0, px: 1 }}>
                <ListItemIcon sx={{ minWidth: "30px" }}>
                  <CustomCheckbox
                    edge="start"
                    checked={pickedAvailable.includes(column)}
                    disabled={full && !pickedAvailable.includes(column)}
                    onChange={() => togglePicked(column, false)}
                    onClick={(event) => event.stopPropagation()}
                    tabIndex={-1}
                  />
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: "11px", color: "#444" }}>{formatColumnName(column)}</Typography>} />
              </ListItemButton>
            );
          }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <CustomButton
            sx={{ my: 1 }}
            variant="outlined"
            size="small"
            aria-label="Move checked columns to selected"
            onClick={movePickedToSelected}
            disabled={pickedAvailable.length === 0 || draftSelected.length >= MAX_VISIBLE_COLUMNS}
          >
            <KeyRightArrowIcon />
          </CustomButton>
          <CustomButton
            sx={{ my: 1 }}
            variant="outlined"
            size="small"
            aria-label="Move checked columns to available"
            onClick={movePickedToAvailable}
            disabled={pickedSelected.length === 0}
          >
            <KeyLeftArrowIcon />
          </CustomButton>
        </Box>

        <ColumnPickerPane
          title="Selected Columns"
          countLabel={`${draftSelected.length} / ${MAX_VISIBLE_COLUMNS}`}
          countColor={draftSelected.length >= MAX_VISIBLE_COLUMNS ? colors.brandRed : colors.textNeutral}
          columns={draftSelected}
          emptyLabel="Select columns from the left"
          renderItem={(column, index) => {
            const locked = isApplicationColumn(column);
            return (
              <ListItemButton sx={{ minHeight: "32px", py: 0, px: 1, pr: 0.5, cursor: locked ? "default" : "pointer" }}>
                <ListItemIcon sx={{ minWidth: "30px" }}>
                  <CustomCheckbox
                    edge="start"
                    checked={locked || pickedSelected.includes(column)}
                    disabled={locked}
                    onChange={() => togglePicked(column, true)}
                    onClick={(event) => event.stopPropagation()}
                    tabIndex={-1}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: "11px", color: "#333", fontWeight: 500 }}>
                      {formatColumnName(column)}
                    </Typography>
                  }
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: 1 }}>
                  <CustomButton
                    variant="outlined"
                    size="small"
                    aria-label="Move column up"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveDraft(index, -1);
                    }}
                    disabled={index === 0 || locked}
                    sx={reorderButtonSx}
                  >
                    <KeyUpArrowIcon />
                  </CustomButton>
                  <CustomButton
                    variant="outlined"
                    size="small"
                    aria-label="Move column down"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveDraft(index, 1);
                    }}
                    disabled={locked || index === draftSelected.length - 1}
                    sx={reorderButtonSx}
                  >
                    <KeyDownArrowIcon />
                  </CustomButton>
                </Box>
              </ListItemButton>
            );
          }}
        />
      </Box>
    </CustomDialog>
  );
}

const reorderButtonSx = {
  minWidth: "24px",
  width: "24px",
  height: "24px",
  p: 0,
  borderRadius: "8px",
} as const;

type ColumnPickerPaneProps = {
  title: string;
  countLabel: string;
  countColor?: string;
  columns: string[];
  emptyLabel: string;
  renderItem: (column: string, index: number) => ReactNode;
};

function ColumnPickerPane(props: Readonly<ColumnPickerPaneProps>) {
  const { title, countLabel, countColor = colors.textNeutral, columns, emptyLabel, renderItem } = props;
  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: colors.white,
        border: `1px solid ${colors.borderControl}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: colors.textLabel }}>{title}</Typography>
        <Typography sx={{ fontSize: "10px", color: countColor, mt: 0.2 }}>{countLabel}</Typography>
      </Box>
      <List dense sx={{ height: "300px", overflowY: "auto", p: 1 }}>
        {columns.map((column, index) => (
          <ListItem key={column} disablePadding>
            {renderItem(column, index)}
          </ListItem>
        ))}
        {columns.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography sx={{ fontSize: "11px", color: "#999" }}>{emptyLabel}</Typography>
          </Box>
        ) : null}
      </List>
    </Box>
  );
}

export function InboxTable({
  title,
  cases,
  useMockOverride,
  inboxData,
  columnContextKey,
  onOpen,
  onLoadColumns,
  onSaveColumns,
  onColumnNotice,
}: Readonly<InboxTableProps>) {
  const mockModeForPoolColumns = useMockOverride ?? useMock;

  const fieldKeysFromCases = useMemo(() => columnKeys(cases), [cases]);

  const configurePoolKey = useMemo(() => {
    if (!columnContextKey || !inboxData) return undefined;
    return inboxData.poolData[columnContextKey] !== undefined ? columnContextKey : undefined;
  }, [columnContextKey, inboxData]);

  const catalogAll = useMemo(() => {
    const fromData =
      configurePoolKey !== undefined && inboxData
        ? fieldKeysForPool(inboxData, configurePoolKey)
        : fieldKeysFromCases;
    return columnsForPool(fromData);
  }, [configurePoolKey, fieldKeysFromCases, inboxData]);

  const defaultColumnKeys = useMemo(() => {
    if (configurePoolKey !== undefined && inboxData) {
      return fieldKeysForPool(inboxData, configurePoolKey);
    }
    return fieldKeysFromCases;
  }, [configurePoolKey, fieldKeysFromCases, inboxData]);

  const loadPoolColumnsFromApi = Boolean(columnContextKey && onLoadColumns);

  const {
    visible,
    setVisible,
    apiSelectedFields,
    setApiSelectedFields,
    realPoolStatus,
    setRealPoolStatus,
    realPoolFields,
    setRealPoolFields,
    realPoolError,
    setRealPoolError,
  } = usePoolColumnsLoader({
    useMockMode: mockModeForPoolColumns,
    catalogAll,
    defaultColumnKeys,
    configurePoolKey,
    columnContextKey,
    loadPoolColumnsFromApi,
    onLoadColumns,
    onColumnNotice,
  });

  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const [draftAvailable, setDraftAvailable] = useState<string[]>([]);
  const [pickedAvailable, setPickedAvailable] = useState<string[]>([]);
  const [pickedSelected, setPickedSelected] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>({});
  const [activeFilter, setActiveFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [priorityFilter, setPriorityFilter] = useState<TimingStatus | null>(null);
  const [savingColumns, setSavingColumns] = useState(false);

  useEffect(() => {
    setFilters({});
    setPage(0);
    setPriorityFilter(null);
  }, [catalogAll, columnContextKey, configurePoolKey]);

  const defaultColumns = useMemo(
    () => defaultVisibleColumns(defaultColumnKeys),
    [defaultColumnKeys],
  );
  const columnsResolved = useMemo(
    () =>
      resolveColumnsResolved({
        useMockMode: mockModeForPoolColumns,
        loadPoolColumnsFromApi,
        realPoolStatus,
        realPoolFields,
        apiSelectedFields,
        catalogAll,
        visible,
        defaultColumns,
      }),
    [
      apiSelectedFields,
      catalogAll,
      defaultColumns,
      loadPoolColumnsFromApi,
      mockModeForPoolColumns,
      realPoolFields,
      realPoolStatus,
      visible,
    ],
  );
  const columns = useMemo(() => buildTableColumns(columnsResolved), [columnsResolved]);

  const poolFieldList = useMemo(() => {
    if (configurePoolKey !== undefined && inboxData) {
      return fieldKeysForPool(inboxData, configurePoolKey);
    }
    return fieldKeysFromCases;
  }, [configurePoolKey, fieldKeysFromCases, inboxData]);

  const selectedFieldsForModal = useMemo(
    () =>
      selectedFieldsForConfigureModal({
        useMockMode: mockModeForPoolColumns,
        loadPoolColumnsFromApi,
        realPoolStatus,
        realPoolFields,
        apiSelectedFields,
        catalogAll,
        columns,
      }),
    [
      apiSelectedFields,
      catalogAll,
      columns,
      loadPoolColumnsFromApi,
      mockModeForPoolColumns,
      realPoolFields,
      realPoolStatus,
    ],
  );

  const configureAvailable = useMemo(() => {
    const selected = new Set(selectedFieldsForModal);
    return poolFieldList.filter(
      (field) => !selected.has(field) && !HIDDEN_COLUMNS.has(field) && !isApplicationColumn(field),
    );
  }, [poolFieldList, selectedFieldsForModal]);

  const query = searchText.trim().toLowerCase();
  const now = Date.now();

  const filtered = useMemo(() => {
    return cases.filter((item) => {
      const matchesPriority = priorityFilter === null || timingStatus(item, now) === priorityFilter;
      return matchesPriority && matchesSearchRow(item, columns, query) && matchesFiltersRow(item, filters);
    });
  }, [cases, columns, filters, now, priorityFilter, query]);

  const sorted = useMemo(
    () => sortInboxRows(filtered, now, sortColumn, sortDirection),
    [filtered, now, sortColumn, sortDirection],
  );
  const pageRows = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, sorted],
  );

  function toggleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  }

  function openSettings() {
    setDraftSelected(selectedFieldsForModal);
    setDraftAvailable(configureAvailable);
    setPickedAvailable([]);
    setPickedSelected([]);
    setSettingsOpen(true);
  }

  function togglePicked(column: string, selected: boolean) {
    const update = selected ? setPickedSelected : setPickedAvailable;
    update((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
    );
  }

  function movePickedToSelected() {
    const remaining = MAX_VISIBLE_COLUMNS - draftSelected.length;
    if (remaining <= 0 || pickedAvailable.length === 0) return;
    const moving = pickedAvailable.slice(0, remaining);
    setDraftSelected((current) => [...current, ...moving]);
    setDraftAvailable((current) => current.filter((column) => !moving.includes(column)));
    setPickedAvailable([]);
  }

  function movePickedToAvailable() {
    const moving = pickedSelected.filter((column) => !isApplicationColumn(column));
    if (moving.length === 0) return;
    setDraftSelected((current) => current.filter((column) => !moving.includes(column)));
    setDraftAvailable((current) => [...current, ...moving.filter((column) => !current.includes(column))]);
    setPickedSelected([]);
  }

  function applyDraft(nextSelected: string[]) {
    const selected = nextSelected.slice(0, MAX_VISIBLE_COLUMNS);
    setDraftSelected(selected);
    const selectedSet = new Set(selected);
    setDraftAvailable(
      poolFieldList.filter(
        (column) =>
          !selectedSet.has(column) && !HIDDEN_COLUMNS.has(column) && !isApplicationColumn(column),
      ),
    );
    setPickedAvailable([]);
    setPickedSelected([]);
    if (mockModeForPoolColumns || !loadPoolColumnsFromApi) {
      setVisible(selected);
    } else {
      setApiSelectedFields(selected);
      setRealPoolFields(selected);
      setRealPoolStatus("success");
      setRealPoolError("");
    }
  }

  async function resetColumns() {
    if (!columnContextKey || !onSaveColumns) {
      applyDraft(defaultColumns);
      return;
    }
    setSavingColumns(true);
    try {
      const saved = await onSaveColumns(columnContextKey, defaultColumns);
      const nextOrdered = orderedVisibleFromSelectedFields(saved);
      const next = nextOrdered.filter((field) => catalogAll.includes(field));
      if (mockModeForPoolColumns || !loadPoolColumnsFromApi) {
        setApiSelectedFields(saved);
        applyDraft(next.length > 0 ? next : defaultColumns);
      } else {
        setApiSelectedFields(saved);
        setRealPoolFields(next);
        setRealPoolStatus("success");
        setRealPoolError("");
        applyDraft(next);
      }
    } catch (reason: unknown) {
      const message = columnError(reason);
      if (message.length > 0) onColumnNotice?.(message);
    } finally {
      setSavingColumns(false);
    }
  }

  async function saveColumns() {
    const next = draftSelected.slice(0, MAX_VISIBLE_COLUMNS);
    if (next.length === 0) return;
    if (!columnContextKey || !onSaveColumns) {
      if (mockModeForPoolColumns || !loadPoolColumnsFromApi) {
        setVisible(next);
      } else {
        setApiSelectedFields(next);
        setRealPoolFields(next);
        setRealPoolStatus("success");
        setRealPoolError("");
      }
      setSettingsOpen(false);
      return;
    }
    setSavingColumns(true);
    try {
      const saved = await onSaveColumns(columnContextKey, next);
      const applied = orderedVisibleFromSelectedFields(saved).filter((field) => catalogAll.includes(field));
      if (mockModeForPoolColumns || !loadPoolColumnsFromApi) {
        setApiSelectedFields(saved);
        setVisible(applied.length > 0 ? applied : next);
      } else {
        setApiSelectedFields(saved);
        setRealPoolFields(applied.length > 0 ? applied : next);
        setRealPoolStatus("success");
        setRealPoolError("");
      }
      setSettingsOpen(false);
    } catch (reason: unknown) {
      const message = columnError(reason);
      if (message.length > 0) onColumnNotice?.(message);
    } finally {
      setSavingColumns(false);
    }
  }

  function moveDraft(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftSelected.length) return;
    setDraftSelected((current) => {
      const next = [...current];
      const currentColumn = next[index];
      const swapColumn = next[nextIndex];
      if (!currentColumn || !swapColumn) return current;
      if (isApplicationColumn(currentColumn) || isApplicationColumn(swapColumn)) return current;
      next[index] = swapColumn;
      next[nextIndex] = currentColumn;
      return next;
    });
  }

  const showPoolColumnsLoading = !mockModeForPoolColumns && loadPoolColumnsFromApi && realPoolStatus === "loading";
  const showPoolColumnsError = !mockModeForPoolColumns && loadPoolColumnsFromApi && realPoolStatus === "error";

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: 5,
        borderRadius: "10px",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          height: "38px",
          minHeight: "38px",
          flexShrink: 0,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#E45F14",
          color: "#fff",
          boxSizing: "border-box",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{title}</Typography>
      </Box>

      <InboxTableToolbar
        title={title}
        columns={columns}
        sorted={sorted}
        cases={cases}
        priorityFilter={priorityFilter}
        onTogglePriority={(status) => {
          setPriorityFilter((current) => (current === status ? null : status));
          setPage(0);
        }}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((open) => !open)}
        searchText={searchText}
        onSearchTextChange={(value) => {
          setSearchText(value);
          setPage(0);
        }}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        showConfigureColumns={Boolean(columnContextKey && onSaveColumns)}
        onConfigureClick={openSettings}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        <InboxCasesTable
          columns={columns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
          pageRows={pageRows}
          now={now}
          onOpen={onOpen}
        />

        {showPoolColumnsLoading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.88)",
            }}
          >
            <CircularProgress size={36} thickness={4} sx={{ color: "#f58220" }} />
          </Box>
        ) : null}
        {showPoolColumnsError ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 2,
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
          >
            <Typography sx={{ fontSize: "12px", color: "#b00020", textAlign: "center", fontWeight: 600 }}>
              {realPoolError}
            </Typography>
          </Box>
        ) : null}

        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={PAGE_SIZES}
          labelRowsPerPage="Show"
          sx={{
            minHeight: "34px",
            height: "34px",
            maxHeight: "34px",
            flexShrink: 0,
            overflow: "hidden",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            borderTop: "1px solid #e3e6e8",
            borderRadius: "0 0 10px 10px",
            "& .MuiTablePagination-toolbar": { minHeight: "34px", height: "34px", padding: "0 8px 0 16px" },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "11px", color: "#555" },
            "& .MuiTablePagination-select": { fontSize: "11px" },
            "& .MuiTablePagination-actions": { marginLeft: "8px" },
            "& .MuiIconButton-root": { padding: "3px" },
          }}
        />
      </Box>

      <InboxFilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        columns={columns}
        cases={cases}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onApply={() => {
          setFilters(draftFilters);
          setPage(0);
          setFilterOpen(false);
        }}
      />

      <InboxConfigureColumnsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        savingColumns={savingColumns}
        draftSelected={draftSelected}
        draftAvailable={draftAvailable}
        pickedAvailable={pickedAvailable}
        pickedSelected={pickedSelected}
        togglePicked={togglePicked}
        movePickedToSelected={movePickedToSelected}
        movePickedToAvailable={movePickedToAvailable}
        moveDraft={moveDraft}
        onReset={() => {
          void resetColumns();
        }}
        onSave={() => {
          void saveColumns();
        }}
      />
    </Box>
  );
}
